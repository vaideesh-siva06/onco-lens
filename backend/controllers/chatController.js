import ChatModel from "../models/ChatModel.js";

export const getMessages = async (req, res) => {
    try {

        const messages = await ChatModel.find({ meetingId: req.params.meetingId });
        res.status(200).json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to get messages" });
    }
}

export const createMessage = async (req, res) => {
    try {
        const { senderId, recipientId, text, projectId } = req.body;

        if (!projectId) {
            return res.status(400).json({ error: "projectId is required" });
        }

        // Find chat for these users and this project
        let chat = await ChatModel.findOne({
            participants: { $all: [senderId, recipientId] },
            projectId
        });

        console.log(projectId);

        if (!chat) {
            chat = await ChatModel.create({
                participants: [senderId, recipientId],
                privateId: [senderId, recipientId],
                messages: [],
                projectId: projectId
            });
        }

        const messageObj = {
            senderId,
            text,
            timestamp: new Date(),
            read: false
        };
        chat.messages.push(messageObj);
        await chat.save();

        res.status(201).json(messageObj);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create message" });
    }
};
