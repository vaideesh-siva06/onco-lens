import UserModel from "../models/UserModel.js";
import ProjectModel from "../models/ProjectModel.js";
import MeetingModel from "../models/MeetingModel.js";
import { logoutController } from "./authController.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import DocumentModel from "../models/DocumentModel.js";
import redis from "../config/redisClient.js";
import { invalidateProject, invalidateProjectLists, invalidateDocumentCacheForUser } from "../utils/redisHelpers.js";
import { getIO } from '../server/socket.ts';

export const getUserController = async (req, res) => {
    try {
        const user = await UserModel.findById(req.params.id);
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json(error);
    }
}

export const getUserByEmailController = async (req, res) => {
    try {
        const user = await UserModel.findOne({ email: req.params.email });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json(error);
    }
}

export const getCurrentUserController = async (req, res) => {
    try {
        const token = req.cookies.token; // HttpOnly cookie

        if (!token) {
            // ✅ Instead of 401, just return null
            return res.status(200).json({ user: null });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await UserModel.findById(decoded.id).select("-password");

        if (!user) return res.status(200).json({ user: null });

        res.status(200).json({ user });
    } catch (error) {
        // On invalid token, just return null
        return res.status(200).json({ user: null });
    }
};


export const updateUserController = async (req, res) => {
  try {
    const { email, password, name, ...rest } = req.body;

    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const oldName = user.name;
    const updateData = { ...rest };

    // CHECK EMAIL
    if (email && email !== user.email) {
      const existing = await UserModel.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: "Email is already in use" });
      }
      updateData.email = email;
    }

    // NAME UPDATE
    if (name && name !== user.name) {
      updateData.name = name;
    }

    // ISSUE NEW TOKEN
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    // PASSWORD
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // UPDATE USER
    const updatedUser = await UserModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    // 🔥 UPDATE DOCUMENT AUTHORS IF NAME CHANGED
    if (name && name !== oldName) {
        const result = await DocumentModel.updateMany(
            { createdBy: user._id },
            { $set: { author: updatedUser.name } }
        );
        console.log(`${result.modifiedCount} documents updated`);

        // Find all projects affected
        const projects = await DocumentModel.distinct("projectId", { createdBy: user._id });

        for (const projectId of projects) {
            const docs = await DocumentModel.find({ projectId }).lean();

            const projectCacheKey = `project:${projectId}:documents`;
            await redis.set(projectCacheKey, JSON.stringify(docs), { EX: 60 * 60 });

            console.log(`Redis cache refreshed for project ${projectId}`);
        }
    }

    let io = getIO();

    // 🔥 EMIT SOCKET EVENT TO UPDATE OTHER CLIENTS
    if (name && name !== oldName && io) {
        const updatedUser = await UserModel.findById(req.params.id); // get fresh user
        io.emit("user_name_updated", {
            userId: updatedUser?._id,
            newName: updatedUser?.name
        });
        console.log(`Emitted user_name_updated for user ${updatedUser?._id}`);
    }

    // Find all cached project keys for this user
    const projectKeys = await redis.keys(`projects:user:${user._id}:*`);

    for (const key of projectKeys) {
        const cached = await redis.get(key);
        if (!cached) continue;

        let projects = JSON.parse(cached);

        projects = projects.map((p) => {
            // Update adminName if adminId matches updated user
            if (p.adminId._id === user._id.toString()) {
                p.adminId.name = updatedUser.name;
                p.adminName = updatedUser.name;
            }
            return p;
        });

        await redis.set(key, JSON.stringify(projects), { EX: 60 * 60 });
        console.log(`Updated cached project data in Redis for key ${key}`);
    }




    // 🔥 INVALIDATE PROJECT CACHE WHEN USER DATA CHANGES
    await invalidateProjectLists(redis);

    console.log("USER + DOCUMENT AUTHORS UPDATED");

    return res.status(200).json({ user: updatedUser, token });

  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
};


export const deleteUserController = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("FULLY PURGING USER:", userId);

    /* =========================
       1️⃣ FIND PROJECT CONTEXT
    ========================== */

    const projects = await ProjectModel.find({
      $or: [
        { adminId: userId },
        { teamEmails: user.email },
      ],
    }).select("_id adminId");

    const adminProjectIds = projects
      .filter(p => p.adminId.toString() === userId)
      .map(p => p._id);

    const memberProjectIds = projects
      .filter(p => p.adminId.toString() !== userId)
      .map(p => p._id);

    /* =========================
       2️⃣ DELETE USER DOCUMENTS
    ========================== */

    await DocumentModel.deleteMany({ createdBy: userId });

    /* =========================
       3️⃣ DELETE ADMIN PROJECTS
    ========================== */

    if (adminProjectIds.length > 0) {
      await ProjectModel.deleteMany({ _id: { $in: adminProjectIds } });
    }

    /* =========================
       4️⃣ REMOVE FROM MEMBER PROJECTS
    ========================== */

    if (memberProjectIds.length > 0) {
      await ProjectModel.updateMany(
        { _id: { $in: memberProjectIds } },
        {
          $pull: {
            teamEmails: user.email, // ✅ correct field
          },
        }
      );
    }

    /* =========================
       5️⃣ MEETINGS CLEANUP
    ========================== */

    await MeetingModel.deleteMany({ admin: userId });

    await MeetingModel.updateMany(
      {},
      {
        $pull: {
          invitees: user.email,
        },
      }
    );

    /* =========================
       6️⃣ DELETE USER
    ========================== */

    await UserModel.findByIdAndDelete(userId);

    /* =========================
       7️⃣ REDIS CACHE INVALIDATION
    ========================== */

    for (const projectId of [...adminProjectIds, ...memberProjectIds]) {
      await invalidateProject(projectId.toString());
    }

    await invalidateProjectLists(userId);

    await redis.del(`user:${userId}`);
    await redis.del(`projects:user:${userId}`);

    /* =========================
       8️⃣ AUTH CLEANUP
    ========================== */

    req.session?.destroy(() => {});
    res.clearCookie("token");

    console.log("USER FULLY ERASED FROM SYSTEM");

    return res.status(200).json({
      message: "User and all related data permanently deleted",
    });

  } catch (error) {
    console.error("DELETE USER FAILED:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

