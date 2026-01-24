import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import cookieParser from 'cookie-parser';

import { connectDB } from './db/db.js';
import { initSocketServer } from './server/socket.ts'

import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoutes.js';
import projectRouter from './routes/projectRoutes.js';
import meetingRouter from './routes/meetingRoutes.js';
import chatRouter from './routes/chatRoutes.js';
import { googleAuthCallback, googleAuthRedirect } from './controllers/projectController.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initSocketServer(server);

app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: 'http://localhost:5173', // frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

app.use('/', authRouter);
app.use('/api', userRouter);
app.use('/api', projectRouter);
app.use('/api', meetingRouter);
app.use('/api/chat', chatRouter);


app.get('/auth/google', googleAuthRedirect)
app.get('/auth/google/callback', googleAuthCallback)

connectDB()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => console.log('MongoDB connection error:', err));
