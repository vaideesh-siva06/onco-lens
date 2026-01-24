import MeetingModel from "../models/MeetingModel.js";
import crypto from "crypto";

export const getMeetings = async (req, res) => {
    try {
        const userId = req.params.userId;
        const userEmail = req.query.email; // email sent from frontend

        if (!userId || !userEmail) {
            return res.status(400).json({ message: "Missing userId or email" });
        }

        // Find meetings where user is admin OR participant
        const meetings = await MeetingModel.find({
            $or: [
                { admin: userId },               // Admin of the meeting
                { invitees: { $in: [userEmail] } } // Participant (array of strings)
            ]
        }).sort({ date: 1 }); // earliest first

        console.log(`[getMeetings] ${userEmail} (${userId}) fetched ${meetings.length} meetings`);

        res.status(200).json(meetings);
    } catch (error) {
        console.error("Error fetching meetings:", error);
        res.status(500).json({ message: "Error fetching meetings", error });
    }
};


export const getMeetingById = async (req, res) => {
    try {
        const meeting = await MeetingModel.findById(req.params.meetingId);
        if (!meeting) {
            return res.status(404).json({ message: "Meeting not found" });
        }
        res.status(200).json(meeting);
    } catch (error) {
        console.error("Error fetching meeting by ID:", error);
        res.status(500).json({ message: "Error fetching meeting by ID", error });
    }
}

export const createMeetingController = async (req, res) => {
    try {
        const { name, date, userId, invitees, userEmail } = req.body;

        if (!name || !date || !userId || !userEmail) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const meetingCode = crypto.randomBytes(4).toString('hex');

        const meeting = await MeetingModel.create({
            name,
            date,
            admin: userId, // stored as user reference
            adminEmail: userEmail,
            meetingCode,
            status: "upcoming",
            invitees: invitees
        });

        res.status(201).json(meeting);
    } catch (error) {
        console.error("Error creating meeting:", error);
        res.status(500).json({ message: "Error creating meeting", error });
    }
};

export const startMeetingController = async (req, res) => {
    try {
        const { meetingId } = req.body; // Expecting meetingId (which is _id)

        if (!meetingId) {
            return res.status(400).json({ message: "Missing meeting ID" });
        }

        const meeting = await MeetingModel.findByIdAndUpdate(
            meetingId,
            { status: "started" },
            { new: true }
        );

        if (!meeting) {
            return res.status(404).json({ message: "Meeting not found" });
        }

        res.status(200).json(meeting);
    } catch (error) {
        console.error("Error starting meeting:", error);
        res.status(500).json({ message: "Error starting meeting", error });
    }
};

export const endMeetingController = async (req, res) => {
    try {
        const { meetingCode, adminId } = req.body;

        // Validate required fields
        if (!meetingCode || !adminId) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Find the meeting by code
        const meeting = await MeetingModel.findById(meetingCode);

        if (!meeting) {
            return res.status(404).json({ message: "Meeting not found" });
        }

        // Only the admin can end the meeting
        if (meeting.admin.toString() !== adminId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Check if already ended
        if (meeting.status === "ended") {
            return res.status(400).json({ message: "Meeting already ended" });
        }

        // End the meeting
        meeting.status = "ended";
        await meeting.save();

        res.status(200).json({ message: "Meeting ended successfully", meeting });
    } catch (error) {
        console.error("Error ending meeting:", error);
        res.status(500).json({ message: "Error ending meeting", error });
    }
};

export const leaveMeetingController = async (req, res) => {

    try {
        const payload = {
            meetingCode: meetingId, // assuming meetingId is the MongoDB _id
            adminId: user._id,      // backend will check if user is admin
        };

        // Call backend to end meeting if user is admin
        await axios.post(
            "http://localhost:8000/api/meeting/end",
            payload,
            { withCredentials: true }
        );

        // Stop local camera/mic tracks
        if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
        if (stream && stream !== cameraStream) stream.getTracks().forEach(track => track.stop());

        // Destroy peer connections
        peersRef.current.forEach(({ peer }) => peer.destroy());
        peersRef.current = [];

        // Disconnect socket
        if (socketRef.current) socketRef.current.disconnect();

        // Reset state
        setStream(null);
        setCameraStream(null);
        setActiveSpeaker(null);
        setScreenSharing(false);
        setPeers([]);
    } catch (err) {
        console.error("Error leaving meeting:", err.response?.data || err.message);
    }
};


export const addParticipantToMeetingController = async (req, res) => {
    try {
        const { meetingId, email } = req.body;

        if (!meetingId || !email) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const meeting = await MeetingModel.findById(meetingId);

        if (!meeting) {
            return res.status(404).json({ message: "Meeting not found" });
        }

        if (meeting.invitees.includes(email)) {
            return res.status(400).json({ message: "Participant already invited" });
        }

        meeting.invitees.push(email);
        await meeting.save();

        res.status(200).json({ message: "Participant added successfully", meeting });
    } catch (error) {
        console.error("Error adding participant to meeting:", error);
        res.status(500).json({ message: "Error adding participant to meeting", error });
    }
};

export const removeParticipantFromMeetingController = async (req, res) => {
    try {
        const { meetingId, email } = req.body;

        if (!meetingId || !email) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const meeting = await MeetingModel.findById(meetingId);

        if (!meeting) {
            return res.status(404).json({ message: "Meeting not found" });
        }

        if (!meeting.invitees.includes(email)) {
            return res.status(400).json({ message: "Participant not invited" });
        }

        meeting.invitees = meeting.invitees.filter(invitee => invitee !== email);
        await meeting.save();



        res.status(200).json({ message: "Participant removed successfully", meeting });
    } catch (error) {
        console.error("Error removing participant from meeting:", error);
        res.status(500).json({ message: "Error removing participant from meeting", error });
    }
};

// Kick a participant
export const kickUserController = async (req, res) => {
    try {
        const { meetingId, userId, targetUserId } = req.body;

        if (!meetingId || !userId || !targetUserId) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const meeting = await MeetingModel.findById(meetingId);
        if (!meeting) return res.status(404).json({ message: "Meeting not found" });

        // Only admin can kick
        if (meeting.admin.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // No persistence for now
        // if (!meeting.kickedUsers.includes(targetUserId)) {
        //     meeting.kickedUsers.push(targetUserId);
        //     await meeting.save();
        // }

        res.status(200).json({ message: "User kicked successfully" });
    } catch (err) {
        console.error("Error kicking user:", err);
        res.status(500).json({ message: "Error kicking user", error: err });
    }
};

export const deleteMeetingController = async (req, res) => {
    try {
        const { meetingId } = req.body;

        if (!meetingId) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const meeting = await MeetingModel.findById(meetingId);
        if (!meeting) return res.status(404).json({ message: "Meeting not found" });

        await meeting.deleteOne();

        res.status(200).json({ message: "Meeting deleted successfully" });
    } catch (err) {
        console.error("Error deleting meeting:", err);
        res.status(500).json({ message: "Error deleting meeting", error: err });
    }
};

