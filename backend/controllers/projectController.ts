import ProjectModel from "../models/ProjectModel.js";
import { ChatModel } from "../models/ChatModel.ts";
import UserModel from "../models/UserModel.js";
import mongoose from "mongoose";
import redis from "../config/redisClient.js";
import { invalidateProject, invalidateProjectLists } from "../utils/redisHelpers.js";
import DocumentModel from "../models/DocumentModel.js";
import { google } from 'googleapis';

export const getProjectController = async (req, res) => {
    try {
        const { id } = req.params;
        const cacheKey = `project:${id}`;

        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.status(200).json(JSON.parse(cached));
        }

        const project = await ProjectModel.findById(id);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        await redis.setEx(cacheKey, 60 * 10, JSON.stringify(project));

        res.status(200).json(project);
    } catch (error) {
        res.status(500).json({ message: "Error fetching project", error });
    }
};


export const getAllProjectsController = async (req, res) => {
    try {
        const { userId, email } = req.query;
        if (!userId || !email) {
            return res.status(400).json({ message: "User ID and email required" });
        }

        const cacheKey = `projects:user:${userId}:email:${email}`;
        const cached = await redis.get(cacheKey);

        if (cached) {
            return res.status(200).json(JSON.parse(cached));
        }

        const projects = await ProjectModel.find({
            deleted: { $ne: true },
            $or: [{ adminId: userId }, { teamEmails: email }]
        })
            .sort({ createdAt: -1 })
            .populate("adminId", "name email");

        await redis.setEx(cacheKey, 60 * 5, JSON.stringify(projects));

        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};



export const createProjectController = async (req, res) => {
    try {
        const { id } = req.params;

        const project = await ProjectModel.create({
            ...req.body,
            adminId: id
        });

        await invalidateProjectLists(redis);

        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ message: "Error creating project", error });
    }
};



export const deleteProjectController = async (req, res) => {
  try {
    const { id, userId, userEmail } = req.body;

    const project = await ProjectModel.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // ADMIN deletes project → full cleanup
    if (project.adminId.toString() === userId) {

      await ChatModel.deleteMany({ projectId: project._id });

      // 🔥 DELETE ALL DOCUMENTS FOR THIS PROJECT
      await DocumentModel.deleteMany({ projectId: project._id.toString() });

      await ProjectModel.findByIdAndDelete(id);

    } else {
      // Non-admin: remove from team
      if (!project.teamEmails.includes(userEmail)) {
        return res.status(400).json({ message: "User not part of project" });
      }

      project.teamEmails = project.teamEmails.filter(e => e !== userEmail);
      await project.save();

      await ChatModel.deleteMany({
        projectId: project._id,
        participants: userId
      });
    }

    await invalidateProject(redis, id);
    await invalidateProjectLists(redis);

    res.status(200).json({ message: "Project updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting project", error });
  }
};


export const updateProjectController = async (req, res) => {
    try {
        const { id } = req.params;

        const project = await ProjectModel.findByIdAndUpdate(
            id,
            req.body,
            { new: true }
        );

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        await invalidateProject(redis, id);
        await invalidateProjectLists(redis);

        res.status(200).json({ message: "Project updated", project });
    } catch (error) {
        res.status(500).json({ message: "Error updating project", error });
    }
};


export const addMemberController = async (req, res) => {
  try {
    const { id } = req.params; // project ID
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    const project = await ProjectModel.findById(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (project.teamEmails.includes(email) || project.adminEmail === email) {
      return res.status(400).json({ message: "Member already exists" });
    }

    // Add member
    project.teamEmails.push(email);
    await project.save();

    // Fetch all documents for this project
    const documents = await DocumentModel.find({ projectId: project._id });

    // Fetch admin user to get Google OAuth tokens
    const adminUser = await UserModel.findOne({ email: project.adminEmail });
    if (!adminUser?.googleAccessToken) {
      return res.status(400).json({ message: "Project admin has not connected Google account" });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: adminUser.googleAccessToken,
      refresh_token: adminUser.googleRefreshToken,
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Share each document with the new member
    for (const doc of documents) {
      try {
        await drive.permissions.create({
          fileId: doc.documentId,
          requestBody: {
            type: 'user',
            role: 'writer',
            emailAddress: email,
          },
          sendNotificationEmail: false,
        });
      } catch (err) {
        console.error(`Failed to share document ${doc.title} with ${email}:`, err.message);
      }
    }

    // ---------------- Redis Cache Invalidation & Update ----------------
    if (redis) {
      // 1️⃣ Invalidate single project cache
      await redis.del(`project:${id}`);

      // 2️⃣ Re-cache updated project object
      await redis.setEx(`project:${id}`, 60 * 5, JSON.stringify(project));

      // 3️⃣ Invalidate admin's project list (so it gets updated)
      await redis.del(`projects:user:${project.adminId._id}:email:${project.adminEmail}`);

      // 4️⃣ Invalidate / update the new member's project list
      const memberUser = await UserModel.findOne({ email });
      if (memberUser) {
        await redis.del(`projects:user:${memberUser._id}:email:${memberUser.email}`);
      }
    }

    res.status(200).json({ message: "Member added and documents shared", project });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding member", error });
  }
};


export const deleteMemberController = async (req: any, res: any) => {
  try {
    const { id } = req.params; // project ID
    const { email, currUserId } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const project = await ProjectModel.findById(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (project.adminEmail === email) {
      return res.status(400).json({ message: "Cannot remove admin" });
    }

    // Remove user from project team
    project.teamEmails = project.teamEmails.filter(e => e !== email);
    await project.save();

    // Delete chats between removed user and current user
    await ChatModel.deleteMany({
      projectId: project._id,
      participants: user._id
    });

    // Remove Google Drive access
    // Remove Google Drive access
    const adminUser = await UserModel.findOne({ email: project.adminEmail });

    if (adminUser?.googleAccessToken && adminUser?.googleRefreshToken) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({
        access_token: adminUser.googleAccessToken,
        refresh_token: adminUser.googleRefreshToken,
      });

      const drive = google.drive({ version: "v3", auth: oauth2Client });

      // 🔥 Get all docs in this project
      const documents = await DocumentModel.find({ projectId: project._id });

      for (const doc of documents) {
        try {
          // List permissions on the Google Doc
          const perms = await drive.permissions.list({
            fileId: doc.documentId,
            fields: "permissions(id,emailAddress)",
          });

          // Find the removed user's permission
          const permission = perms.data.permissions?.find(
            (p) => p.emailAddress === email
          );

          // Delete permission if found
          if (permission?.id) {
            await drive.permissions.delete({
              fileId: doc.documentId,
              permissionId: permission.id,
            });

            console.log(
              `✅ Removed Google Drive access for ${email} on doc ${doc.title}`
            );
          }
        } catch (err: any) {
          console.error(
            `❌ Failed to remove Drive access for ${email} on doc ${doc.title}:`,
            err.message
          );
        }
      }
    }


    // ---------------- Redis Cache Invalidation ----------------
    if (redis) {
      // Remove single project cache
      await redis.del(`project:${id}`);

      // Remove admin's project list cache if adminId exists
      if (project.adminId?._id) {
        await redis.del(`projects:user:${project.adminId._id}:email:${project.adminEmail}`);
      }

      // Remove removed user's project list cache
      if (user?._id) {
        await redis.del(`projects:user:${user._id}:email:${user.email}`);
      }

      // Optionally, reset the updated project cache
      await redis.setEx(`project:${id}`, 60 * 5, JSON.stringify(project));
    }

    res.status(200).json({ message: "Member removed and caches updated", project });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error removing member", error });
  }
};



// /auth/google
export const googleAuthRedirect = (req: any, res: any) => {
  const { state } = req.query; // <-- this is what your frontend actually sends
  if (!state) return res.status(400).send("No state provided");

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const scopes = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/documents'
  ];

  // Just forward the state along to Google
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state // keep the same encoded JSON
  });

  res.redirect(authUrl);
};



// /auth/google/callback
export const googleAuthCallback = async (req: any, res: any) => {
  const { code, state } = req.query;

  if (!code) return res.status(400).send('No code returned from Google');
  if (!state) return res.status(400).send('No state returned from Google');

  const { projectId, userId } = JSON.parse(decodeURIComponent(state as string));

  console.log(`User Id: ${userId}`);
  console.log(`Project Id: ${projectId}`);

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  try {
    const { tokens } = await oauth2Client.getToken(code)
    console.log(tokens) // access_token and refresh_token

    // Save tokens in DB if you want
    await UserModel.findByIdAndUpdate(userId, { googleAccessToken: tokens.access_token, googleRefreshToken: tokens.refresh_token })

    // Redirect back to your frontend project page
    res.redirect(`http://localhost:5173/project/${projectId}`)
  } catch (err) {
    console.error('Error exchanging code for tokens:', err)
    res.status(400).send('Failed to exchange code for tokens')
  }
}

export const getAllDocumentsController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Project ID is required" });
    }

    const redisKey = `project:${id}:documents`;

    // 1️⃣ Check Redis cache first
    if (redis) {
      const cached = await redis.get(redisKey);
      if (cached) {
        const documents = JSON.parse(cached);
        return res.status(200).json({
          count: documents.length,
          documents,
          cached: true, // optional flag to indicate this came from cache
        });
      }
    }

    // 2️⃣ If not cached, fetch from MongoDB
    const documents = await DocumentModel.find({ projectId: id }).sort({ createdAt: -1 });

    // 3️⃣ Save results to Redis
    if (redis) {
      await redis.setEx(redisKey, 60 * 5, JSON.stringify(documents)); // expires in 5 mins
    }

    res.status(200).json({
      count: documents.length,
      documents,
      cached: false,
    });
  } catch (error) {
    console.error("Fetch documents error:", error);
    res.status(500).json({ message: "Failed to fetch documents" });
  }
};



export const createDocumentController = async (req: any, res: any) => {
  try {
    const { userId, title, projectId, author, email } = req.body;

    if (!title || !projectId || !userId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 1️⃣ Load user + tokens
    const user = await UserModel.findById(userId);
    if (!user?.googleAccessToken || !user?.googleRefreshToken) {
      return res.status(401).json({ message: "Google account not connected" });
    }

    // 2️⃣ OAuth client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    // APIs
    const docs = google.docs({ version: "v1", auth: oauth2Client });
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // 3️⃣ Find or create project folder
    const folderName = `onco-lens-${projectId}`;
    const folderSearch = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
      fields: "files(id)",
    });

    let folderId;
    const files = folderSearch.data.files;

    if (files && files.length > 0) {
      folderId = files[0].id!;
    } else {
      const folder = await drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
        },
        fields: "id",
      });
      folderId = folder.data.id!;
    }

    // 4️⃣ Create Google Doc
    const docResponse = await docs.documents.create({ requestBody: { title } });
    const documentId = docResponse.data.documentId;

    // 5️⃣ Move doc into folder
    await drive.files.update({
      fileId: documentId,
      addParents: folderId,
      removeParents: "root",
      fields: "id, parents",
    });

    const documentUrl = `https://docs.google.com/document/d/${documentId}`;

    // 6️⃣ Save in MongoDB
    const savedDoc = await DocumentModel.create({
      title,
      documentId,
      documentUrl,
      projectId,
      createdBy: userId,
      author,
      email,
    });

    // 7️⃣ Share document with all project members
    const project = await ProjectModel.findById(projectId);
    if (project) {
      const allEmails = [project.adminEmail, ...project.teamEmails];

      for (const email of allEmails) {
        try {
          await drive.permissions.create({
            fileId: documentId,
            requestBody: {
              type: "user",
              role: "writer", // use 'reader' for read-only
              emailAddress: email,
            },
            sendNotificationEmail: false,
          });
        } catch (err) {
          console.error(`Failed to share document with ${email}:`, err.message);
        }
      }
    }

    // ---------------- Redis Cache Update ----------------
    if (redis) {
      const redisKey = `project:${projectId}:documents`;

      // 1️⃣ Try to get existing cache
      const cached = await redis.get(redisKey);
      let documents = cached ? JSON.parse(cached) : [];

      // 2️⃣ Add the newly created document at the top
      documents.unshift(savedDoc);

      // 3️⃣ Update Redis cache (expires in 5 mins)
      await redis.setEx(redisKey, 60 * 5, JSON.stringify(documents));
    }

    res.status(201).json({
      message: "Document created and shared with all members",
      document: savedDoc,
      documentUrl,
    });
  } catch (error) {
    console.error("Google Docs creation error:", error);
    res.status(500).json({ message: "Failed to create document" });
  }
};


export const deleteDocumentController = async (req, res) => {
  try {
    const { documentId, userId } = req.body;

    if (!documentId || !userId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 1️⃣ Find the document in MongoDB
    const doc = await DocumentModel.findById(documentId);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    // 2️⃣ Optional: check if user is allowed to delete
    const project = await ProjectModel.findById(doc.projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const user_id = userId.toString();
    const creatorId = doc.createdBy.toString();
    const adminId = project.adminId.toString();

    if (user_id !== creatorId && user_id !== adminId) {
      return res.status(403).json({ message: "Not authorized to delete this document" });
    }

    // 3️⃣ Load document owner (creator) for Google Drive credentials
    const owner = await UserModel.findById(doc.createdBy);
    if (!owner?.googleAccessToken || !owner?.googleRefreshToken) {
      return res.status(401).json({ message: "Document owner Google account not connected" });
    }

    // 4️⃣ OAuth client using owner's credentials
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({
      access_token: owner.googleAccessToken,
      refresh_token: owner.googleRefreshToken,
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // 5️⃣ Delete document from Google Drive
    try {
      await drive.files.delete({ fileId: doc.documentId });
    } catch (err) {
      console.error("Failed to delete Google Doc:", err.message);
      return res.status(500).json({ message: "Failed to delete document from Google Drive" });
    }

    // 6️⃣ Delete from MongoDB
    const deletedDoc = await DocumentModel.findByIdAndDelete(documentId);
    if (!deletedDoc) {
      return res.status(404).json({ message: "Document not found in DB" });
    }
    console.log("DELETED FROM MONGODB!");

    // 7️⃣ Update Redis cache
    if (redis) {
      const redisKey = `project:${doc.projectId}:documents`;
      const cached = await redis.get(redisKey);
      if (cached) {
        let documents = JSON.parse(cached);
        documents = documents.filter(d => d.documentId !== doc.documentId);
        await redis.setEx(redisKey, 60 * 5, JSON.stringify(documents));
      }
    }

    res.status(200).json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({ message: "Failed to delete document" });
  }
};
