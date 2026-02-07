import mongoose from "mongoose";

const MeetingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    adminEmail: {
        type: String,
        required: true
    },
    projectId: {
        type: String,
        required: false
    },
    meetingCode: {
        type: String,
        required: true
    },
    invitees: {
        type: [String],
        required: false
    },
    status: {
        type: String,
        required: false
    },
    kickedUsers: {
        type: [String],
        default: [],
        required: false
    }
});

const MeetingModel = mongoose.model("Meeting", MeetingSchema);

export default MeetingModel;
