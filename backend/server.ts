import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import cookieParser from 'cookie-parser';

import { connectDB } from './db/db.js';
import { initSocketServer } from './server/socket.js'

import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoutes.js';
import projectRouter from './routes/projectRoutes.js';
import meetingRouter from './routes/meetingRoutes.js';
import chatRouter from './routes/chatRoutes.js';
import { googleAuthCallback, googleAuthRedirect } from './controllers/projectController.js';
import { getAllowedOrigins } from './config/corsOrigins.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const isProd = process.env.NODE_ENV === "production";

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initSocketServer(server);

const allowedOrigins = [
  "https://onco-lens.vaideesh4.workers.dev",
  "https://onco-lens-sxrc.onrender.com",
  "http://localhost"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

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
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
