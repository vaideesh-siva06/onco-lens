// routes/chat.ts
import express from 'express';
import { ChatModel } from '../models/ChatModel.js';
const chatRouter = express.Router();

// Get chat between two users
chatRouter.get('/:userId/:contactId', async (req, res) => {
    const { userId, contactId } = req.params;
    const { projectId } = req.query;

    if (!projectId) {
        return res.status(400).json({ error: 'projectId is required' });
    }

    try {
        let chat = await ChatModel.findOne({
            participants: { $all: [userId, contactId] },
            projectId: projectId
        }).populate('messages.senderId', 'name');

        if (!chat) {
            chat = await ChatModel.create({ participants: [userId, contactId], messages: [], projectId });
        }

        res.json(chat);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

chatRouter.post('/send', async (req, res) => {
    const { senderId, recipientId, text, projectId } = req.body;

    if (!senderId || !recipientId || !text || !projectId) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    try {
        let chat = await ChatModel.findOne({
            participants: { $all: [senderId, recipientId] }
        });

        if (!chat) {
            chat = await ChatModel.create({ participants: [senderId, recipientId], messages: [], projectId });
        }

        const message = {
            senderId,
            text,
            timestamp: new Date(),
            read: false
        };

        chat.messages.push(message);
        await chat.save();

        res.json(message);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default chatRouter;
