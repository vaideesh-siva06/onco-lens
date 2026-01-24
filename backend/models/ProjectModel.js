import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    name: String,
    adminEmail: {
        type: String,
        required: false
    },
    description: String,
    cancerTypes: {
        type: [String],
        required: false
    },
    status: {
        type: String,
        required: false
    },
    focus: {
        type: String,
        required: false
    },
    teamEmails: {
        type: [String],
        required: false
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    adminName: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

const ProjectModel = mongoose.model("Project", projectSchema);

export default ProjectModel;