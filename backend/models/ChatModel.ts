// models/Chat.ts
import mongoose, { Schema, model } from 'mongoose';

interface IMessage {
    senderId: mongoose.Types.ObjectId;
    text: string;
    timestamp: Date;
    read: boolean;
}

interface IChat {
    participants: mongoose.Types.ObjectId[]; // Array of 2 user IDs
    messages: IMessage[];
    projectId?: mongoose.Types.ObjectId;
}

const MessageSchema = new Schema<IMessage>({
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
});

const ChatSchema = new Schema<IChat>({
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    messages: [MessageSchema],
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
});

// Index for faster queries
ChatSchema.index({ participants: 1 });

export const ChatModel = model<IChat>('Chat', ChatSchema);
