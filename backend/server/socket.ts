import { Server, Socket } from "socket.io";
import MeetingModel from "../models/MeetingModel.js";
// import UserModel from "../models/UserModel";

interface RoomUser {
    odId: string;
    name: string;
    isMuted: boolean;
    isScreenSharing: boolean;
    isVideoOff: boolean;
}

// In-memory room storage: roomId -> Map<socketId, RoomUser>
const rooms = new Map<string, Map<string, RoomUser>>();
let io: Server;

export const getIO = () => {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
};

export const initSocketServer = async (server: any) => {
    io = new Server(server, {
        cors: {
            origin: ["http://localhost:5173", "http://localhost", "https://onco-lens.onrender.com"],
            methods: ["GET", "POST"],
            credentials: true,
        },
        pingInterval: 10000,
        pingTimeout: 5000,
    });

    rooms.clear();
    console.log("🧹 All rooms cleared on server start");

    io.on("connection", (socket: Socket) => {
        console.log("✅ Connected:", socket.id);

        let currentRoom: string | null = null;
        let userName: string = "Anonymous";
        let odId: string | null = null;

        socket.on("register_user", (userId) => {
            socket.join(userId); // <--- THIS is key
            console.log(`User ${userId} joined their room`);
        });

        // --- JOIN ROOM ---
        socket.on("join-room", async ({ roomId, odId: odId, userName: joiningUserName, isMuted }) => {
            console.log(`🔍 User ${joiningUserName} joining room ${roomId}`);

            userName = joiningUserName || "Anonymous";
            odId = odId;
            currentRoom = roomId;

            socket.data.odId = odId;
            socket.data.userName = userName;

            console.log("SOCKET DATA!", socket.data);

            try {
                const meeting = await MeetingModel.findById(roomId);
                if (!meeting) {
                    socket.emit("error", { message: "Meeting not found" });
                    return socket.disconnect(true);
                }

                const sockets = await io.in(roomId).fetchSockets();
                const users = sockets.map(s => s.data);

                console.log("Users in room:", users);

                if (users.some(u => u.odId === odId)) {
                    console.log(`❌ User ${odId} already in room ${roomId}`);
                    socket.emit("join-room-status", {
                        success: false,
                        code: "USER_ALREADY_IN_ROOM",
                        message: "You are already in the room!"
                    });
                    return;
                }

                if (!rooms.has(roomId)) rooms.set(roomId, new Map());
                const room = rooms.get(roomId)!;

                const existingUsers = Array.from(room.entries()).map(([socketId, user]) => ({
                    socketId,
                    name: user.name,
                    isMuted: user.isMuted,
                    isScreenSharing: user.isScreenSharing,
                    isVideoOff: user.isVideoOff,
                }));

                room.set(socket.id, {
                    odId: odId,
                    name: userName,
                    isMuted: isMuted ?? true,
                    isScreenSharing: false,
                    isVideoOff: false
                });

                socket.emit("all-users", existingUsers);
                socket.join(roomId);
                socket.to(roomId).emit("user-joined-room", {
                    socketId: socket.id,
                    name: userName,
                    isMuted: isMuted ?? true
                });

                console.log(`🎉 ${userName} joined ${roomId} (${socket.id})`);

                const sockets2 = await io.in(roomId).fetchSockets();
                const users2 = sockets2.map(s => ({
                    socketId: s.id,
                    odId: s.data.odId,
                    userName: s.data.userName
                }));

                console.log("Current users:", users2);

            } catch (err: any) {
                console.error("Join-room error:", err.message);
                socket.emit("error", { message: "Error joining room" });
                socket.disconnect(true);
            }
        });

        socket.on("register_user", (userId) => {
            socket.join(userId); // <--- THIS is key
            console.log(`User ${userId} joined their room`);
        });

        socket.on('recieve-message', (data) => {
            console.log('Recieved message:', data);
            io.emit('message', data);
        });

        // --- START MEETING ---
        socket.on("start-meeting", ({ roomId, adminId }) => {
            console.log(`🚀 Meeting ${roomId} started by admin ${adminId}`);
            io.to(roomId).emit("meeting-started");
        });

        // --- WEBRTC SIGNALING ---
        const relaySignal = (type: 'Offer' | 'Answer' | 'ICE Candidate', target: string, payload: any) => {
            const targetSocket = io.sockets.sockets.get(target);
            if (!targetSocket) return console.log(`⚠️ Signal ${type} failed: target ${target} not found`);
            if (type !== 'ICE Candidate') console.log(`📡 ${type}: ${socket.id} → ${target}`);
            targetSocket.emit(payload.event, payload.data);
        };

        socket.on("offer", ({ target, sdp, isMuted }) => relaySignal('Offer', target, { event: 'offer', data: { sender: socket.id, sdp, isMuted } }));
        socket.on("answer", ({ target, sdp }) => relaySignal('Answer', target, { event: 'answer', data: { sender: socket.id, sdp } }));
        socket.on("ice-candidate", ({ target, candidate }) => relaySignal('ICE Candidate', target, { event: 'ice-candidate', data: { sender: socket.id, candidate } }));

        // --- MUTE / SCREEN SHARE / VIDEO ---
        socket.on("toggle-mute", ({ roomId, isMuted }) => {
            const room = rooms.get(roomId);
            if (room && room.has(socket.id)) {
                room.get(socket.id)!.isMuted = isMuted;
            }
            socket.to(roomId).emit("user-toggled-mute", { socketId: socket.id, isMuted });
        });

        socket.on("toggle-video", ({ roomId, isVideoOff }) => {
            const room = rooms.get(roomId);
            if (room && room.has(socket.id)) {
                room.get(socket.id)!.isVideoOff = isVideoOff;
            }
            socket.to(roomId).emit("user-toggled-video", { socketId: socket.id, isVideoOff });
        });

        socket.on("toggle-screen-share", ({ roomId, isScreenSharing }) => {
            const room = rooms.get(roomId);
            if (room && room.has(socket.id)) {
                room.get(socket.id)!.isScreenSharing = isScreenSharing;
            }
            socket.to(roomId).emit("user-toggled-screen-share", { socketId: socket.id, isScreenSharing });
        });

        // --- ADMIN: TOGGLE MUTE USER ---
        socket.on("admin-toggle-mute-user", async ({ roomId, targetSocketId, isMuted }) => {
            try {
                const meeting = await MeetingModel.findById(roomId);
                if (!meeting) return;

                // Verify the requester is the admin
                const room = rooms.get(roomId);
                if (!room) return;

                const requester = room.get(socket.id);
                if (!requester || requester.odId !== meeting.admin.toString()) {
                    console.log(`❌ Non-admin tried to toggle mute`);
                    return;
                }

                const targetUser = room.get(targetSocketId);
                if (!targetUser) return;

                // Update room state
                targetUser.isMuted = isMuted;

                // Notify the target user
                const targetSocket = io.sockets.sockets.get(targetSocketId);
                if (targetSocket) {
                    targetSocket.emit("admin-toggle-mute", { isMuted });
                }

                // Broadcast to room
                io.to(roomId).emit("user-toggled-mute", { socketId: targetSocketId, isMuted });

                console.log(`🔇 Admin ${isMuted ? 'muted' : 'unmuted'} user ${targetSocketId} in room ${roomId}`);
            } catch (err: any) {
                console.error("Admin toggle mute error:", err.message);
            }
        });

        // --- ADMIN: TOGGLE VIDEO USER ---
        socket.on("admin-toggle-video-user", async ({ roomId, targetSocketId, isVideoOff }) => {
            try {
                const meeting = await MeetingModel.findById(roomId);
                if (!meeting) return;

                // Verify the requester is the admin
                const room = rooms.get(roomId);
                if (!room) return;

                const requester = room.get(socket.id);
                if (!requester || requester.odId !== meeting.admin.toString()) {
                    console.log(`❌ Non-admin tried to toggle video`);
                    return;
                }

                const targetUser = room.get(targetSocketId);
                if (!targetUser) return;

                // Update room state
                targetUser.isVideoOff = isVideoOff;

                // Notify the target user
                const targetSocket = io.sockets.sockets.get(targetSocketId);
                if (targetSocket) {
                    targetSocket.emit("admin-toggle-video", { isVideoOff });
                }

                // Broadcast to room
                io.to(roomId).emit("user-toggled-video", { socketId: targetSocketId, isVideoOff });

                console.log(`📹 Admin ${isVideoOff ? 'turned off' : 'turned on'} video for user ${targetSocketId} in room ${roomId}`);
            } catch (err: any) {
                console.error("Admin toggle video error:", err.message);
            }
        });

        // --- KICK USER ---
        socket.on("kick-user", async ({ roomId, targetSocketId }) => {
            try {
                const meeting = await MeetingModel.findById(roomId);
                if (!meeting) return;

                // Verify the requester is the admin
                const room = rooms.get(roomId);
                if (!room) return;

                const requester = room.get(socket.id);
                if (!requester || requester.odId !== meeting.admin.toString()) {
                    console.log(`❌ Non-admin tried to kick user`);
                    return;
                }

                const targetUser = room.get(targetSocketId);
                if (!targetUser) return console.log(`❌ Target socket ${targetSocketId} not found`);

                console.log(`👢 Kicking ${targetUser.odId} (${targetSocketId}) from ${roomId}`);

                const targetSocket = io.sockets.sockets.get(targetSocketId);
                if (targetSocket) {
                    targetSocket.emit("user-kicked");
                    socket.to(roomId).emit("user-left", targetSocketId);

                    setTimeout(() => {
                        room.delete(targetSocketId);
                        targetSocket.leave(roomId);
                        targetSocket.disconnect(true);
                        console.log(`👋 Target socket ${targetSocketId} disconnected`);
                    }, 500);
                }
            } catch (err: any) {
                console.error("Kick user error:", err.message);
            }
        });

        // --- CHAT MESSAGE ---
        socket.on("chat-message", ({ roomId, message, senderId, senderName }) => {
            console.log(`💬 Chat message in room ${roomId} from ${senderName}: ${message}`);

            // Create message object with ID and timestamp
            const messageData = {
                id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                senderId,
                senderName,
                message,
                timestamp: new Date(),
            };

            // Send to EVERYONE in the room (including sender)
            io.to(roomId).emit("chat-message", messageData);

            console.log(`✅ Message broadcasted to room ${roomId}`);
        });

        // --- END MEETING ---
        socket.on("end-meeting", ({ roomId }) => {
            console.log(`🛑 Meeting ${roomId} ended by host`);
            socket.to(roomId).emit("meeting-ended");
            if (rooms.has(roomId)) {
                rooms.delete(roomId);
            }
        });

        // --- DISCONNECT ---
        socket.on("disconnect", () => {
            if (currentRoom && rooms.has(currentRoom)) {
                const room = rooms.get(currentRoom)!;
                room.delete(socket.id);
                socket.to(currentRoom).emit("user-left", socket.id);
                if (room.size === 0) rooms.delete(currentRoom);
            }
            console.log(`❌ Disconnected: ${socket.id}`);
        });

        socket.on("register_user", (userId) => {
            socket.join(userId);    // ← each user joins a room with their userId
            console.log(`User ${userId} joined room ${userId}`);
        });

        socket.on("logout_user", (userId) => {
            socket.leave(userId);    // ← each user joins a room with their userId
            console.log(`User ${userId} left room ${userId}`);
        });

        socket.on("send_message", (data) => {
            console.log("Received message:", data);

            const { to, message, from } = data;


            /*console.log("To:", to);
            console.log("From:", from);
            console.log("Message:", message);*/

            // sconsole.log("All rooms currently:", io.sockets.adapter.rooms);

            if (io.sockets.adapter.rooms.has(to)) {
                console.log(`Room for recipient ${to} exists!`);
            } else {
                console.log(`No room found for recipient ${to}`);
            }

            io.to(to).emit("receive_message", { message, from }); // <-- corrected
        });


        socket.on("receive_message", (data) => {
            console.log("RECEIVED!", data);
        });
    });

    console.log("🚀 Socket server ready");
};
