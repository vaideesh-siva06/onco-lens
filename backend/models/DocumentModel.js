import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  documentId: {
    type: String,
    required: true
  },
  documentUrl: {
    type: String,
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  author: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true
  }
}, {timestamps: true});

export default mongoose.model("Document", DocumentSchema);