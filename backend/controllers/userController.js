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
import { google } from 'googleapis';

// Initialize Google Drive client (use your OAuth2 setup)
const auth = new google.auth.GoogleAuth({
  credentials: {
    // Add your service account credentials here or load from env
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

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

export const reconnectGoogleAccount = async (req, res) => {
  try {
    const { userId } = req.query; // Pass userId from frontend

    console.log(userId);

    if (!userId) return res.status(400).json({ message: "Missing userId" });

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI // e.g., http://localhost:8000/auth/google/callback
    );

    // Generate auth URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline", // get refresh token
      scope: [
        "https://www.googleapis.com/auth/drive.file", // adjust scopes as needed
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
      state: encodeURIComponent(JSON.stringify({ userId })), // optional state
      prompt: "consent", // forces Google to always show consent screen (reconnect)
    });

    // Send URL to frontend
    res.status(200).json({ url: authUrl });

  } catch (error) {
    console.error("Reconnect Google account error:", error);
    res.status(500).json({ message: "Failed to generate reconnect URL", error: error.message });
  }
};

// Example: backend callback at /auth/google/callback
export const googleOAuthCallback = async (req, res) => {
  const { code, state } = req.query;
  const { userId } = JSON.parse(decodeURIComponent(state));

  const user = await UserModel.findById(userId);

  // Exchange code for tokens
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  user.googleAccessToken = tokens.access_token;
  user.googleRefreshToken = tokens.refresh_token || user.googleRefreshToken;
  await user.save();

  // ✅ Send postMessage to main page and close popup
  res.send(`
    <script>
      window.opener.postMessage(
        { googleConnected: true, accessToken: "${tokens.access_token}" },
        "http://localhost:5173"
      );
      window.close(); // closes the popup
    </script>
  `);
};
