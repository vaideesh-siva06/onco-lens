import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import io, { Socket } from "socket.io-client";
import {
    FaMicrophone,
    FaMicrophoneSlash,
    FaVideo,
    FaVideoSlash,
    FaDesktop,
    FaPhoneSlash,
    FaTimes,
    FaUserTimes,
    FaUsers,
    FaComments,
    FaPaperPlane,
} from "react-icons/fa";
import { useUser } from "../../context/UserContext";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { Tooltip } from "react-tooltip";
import 'react-tooltip/dist/react-tooltip.css'

const SOCKET_SERVER_URL = "https://onco-lens-backend-hq5x.onrender.com";

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelay@metered.ca",
            credential: "8cc55a2b160e1d51a660a92f",
        },
    ],
};

interface PeerData {
    peerId: string;
    name: string;
    pc: RTCPeerConnection;
    stream?: MediaStream;
    iceQueue: RTCIceCandidateInit[];
    isMuted?: boolean;
    isScreenSharing?: boolean;
    isVideoOff?: boolean;
}

interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    message: string;
    timestamp: Date;
    isOwn: boolean;
}

const parseMessageWithLinks = (text: string): Array<{ type: 'text' | 'link', content: string }> => {
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
    const parts: Array<{ type: 'text' | 'link', content: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = urlRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
        }
        let url = match[0];
        if (url.startsWith('www.')) url = 'https://' + url;
        parts.push({ type: 'link', content: url });
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        parts.push({ type: 'text', content: text.substring(lastIndex) });
    }

    if (parts.length === 0) {
        parts.push({ type: 'text', content: text });
    }

    return parts;
};

const MessageContent: React.FC<{ message: string; isOwn: boolean }> = ({ message, isOwn }) => {
    const parts = parseMessageWithLinks(message);

    return (
        <>
            {parts.map((part, index) => {
                if (part.type === 'link') {
                    return (
                        <a
                            key={index}
                            href={part.content}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`underline font-medium break-all inline-flex items-center gap-1 ${isOwn ? 'hover:text-orange-100' : 'hover:text-blue-600'
                                }`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {part.content}
                            <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    );
                }
                return <span key={index}>{part.content}</span>;
            })}
        </>
    );
};

const ConferenceCallPage: React.FC = () => {
    const { meetingId } = useParams();
    const { user } = useUser();
    const navigate = useNavigate();

    const [peers, setPeers] = useState<PeerData[]>([]);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [micOn, setMicOn] = useState(false);
    const [videoOn, setVideoOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [name, setName] = useState<string>("");
    const [adminId, setAdminId] = useState<string | null>(null);
    const [meetingStatus, setMeetingStatus] = useState<string | null>(null);
    const [_, setDebugLog] = useState<string[]>([]);
    const [, setIsConnected] = useState(false);
    const [speakingPeerId, setSpeakingPeerId] = useState<string | null>(null);
    const [pollingIntervalId, setPollingIntervalId] = useState<number | null>(null);
    const [showParticipants, setShowParticipants] = useState(false);

    const socketRef = useRef<Socket | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const peersRef = useRef<PeerData[]>([]);
    const peerNamesRef = useRef<Map<string, string>>(new Map());
    const isInitializing = useRef(false);
    const constraintsRef = useRef<HTMLDivElement>(null);
    const audioAnalyzers = useRef<Map<string, AnalyserNode>>(new Map());
    const micOnRef = useRef(micOn);

    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const showChatRef = useRef(showChat);
    const lastProcessedMessageId = useRef<string | null>(null);

    const [isAtBottom, setIsAtBottom] = useState(true);
    const [hasNewUnseenMessages, setHasNewUnseenMessages] = useState(false);


    const log = useCallback((msg: string) => {
        console.log(`[RTC] ${msg}`);
        setDebugLog((prev) => [...prev.slice(-29), `${new Date().toLocaleTimeString()}: ${msg}`]);
    }, []);

    useEffect(() => {
        micOnRef.current = micOn;
    }, [micOn]);

    useEffect(() => {
        showChatRef.current = showChat;
    }, [showChat]);

    useEffect(() => {
        axios.get(`${SOCKET_SERVER_URL}/api/meeting/${meetingId}`, { withCredentials: true })
            .then((res) => {
                console.log(res.data);
                document.title = res.data.name;
            })
            .catch((err) => console.log(err));
    }, [meetingId]);

    const updatePeersState = useCallback(() => {
        setPeers([...peersRef.current]);
    }, []);

    useEffect(() => {
        if (user?.name) setName(user.name);
    }, [user]);

    useEffect(() => {
        if (!meetingId) return;
        axios
            .get(`${SOCKET_SERVER_URL}/api/meeting/${meetingId}`, { withCredentials: true })
            .then((res) => {
                if (res.data.status === "upcoming" || res.data.status === "ended") {
                    setMeetingStatus(res.data.status);
                } else {
                    setAdminId(res.data.admin);
                }
            })
            .catch((err) => log(`Meeting info error: ${err.message}`));
    }, [meetingId, log]);

    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 20;
            setIsAtBottom(atBottom);
            if (atBottom) setHasNewUnseenMessages(false);
        };

        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, [showChat]); // Re-attach listener when chat is opened

    useEffect(() => {
        if (!bottomRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                const visible = entry.isIntersecting;
                setIsAtBottom(visible);
                if (visible) setHasNewUnseenMessages(false);
            },
            { threshold: 1 }
        );

        observer.observe(bottomRef.current);
        return () => observer.disconnect();
    }, [showChat]); // Re-observe when chat is opened

    useEffect(() => {
        if (chatMessages.length === 0) return;

        const lastMsg = chatMessages[chatMessages.length - 1];

        // If we've already processed this message (e.g. just scrolling around), do nothing
        if (lastProcessedMessageId.current === lastMsg.id) return;

        lastProcessedMessageId.current = lastMsg.id;

        if (isAtBottom) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        } else {
            // Only set new unseen messages if the last message is NOT from us
            if (!lastMsg.isOwn) {
                setHasNewUnseenMessages(true);
            }
        }
    }, [chatMessages, isAtBottom]);

    useEffect(() => {
        if (showChat) setUnreadCount(0);
    }, [showChat]);

    // Add these functions:
    const sendMessage = useCallback(() => {
        if (!newMessage.trim() || !user) return;

        console.log('[Chat] Sending message:', newMessage.trim());

        // Send complete message data to backend
        socketRef.current?.emit("chat-message", {
            roomId: meetingId,
            message: newMessage.trim(),
            senderId: user._id,
            senderName: user.name || "Anonymous"
        });

        setNewMessage("");
        log(`Sent message: ${newMessage.trim()}`);
    }, [newMessage, user, meetingId, log]);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const toggleChat = () => {
        if (showParticipants && !showChat) setShowParticipants(false);
        setShowChat(!showChat);
    };

    const removePeer = useCallback(
        (peerId: string) => {
            const idx = peersRef.current.findIndex((p) => p.peerId === peerId);
            if (idx !== -1) {
                const peer = peersRef.current[idx];
                log(`Removing ${peer.name} (${peerId.slice(0, 8)})`);
                peer.pc.close();
                peersRef.current.splice(idx, 1);
                peerNamesRef.current.delete(peerId);
                audioAnalyzers.current.delete(peerId);
                updatePeersState();
            }
        },
        [log, updatePeersState]
    );

    const createPeerConnection = useCallback(
        (peerId: string, peerName: string): RTCPeerConnection => {
            log(`Creating connection to ${peerName} (${peerId.slice(0, 8)})`);
            const pc = new RTCPeerConnection(ICE_SERVERS);

            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => {
                    try {
                        pc.addTrack(track, streamRef.current!);
                    } catch (e: any) {
                        log(`Error adding track: ${e.message}`);
                    }
                });
            }

            pc.ontrack = (e) => {
                const idx = peersRef.current.findIndex((p) => p.peerId === peerId);
                if (idx !== -1 && e.streams[0]) {
                    peersRef.current[idx].stream = e.streams[0];
                    updatePeersState();
                    setupSpeakingDetection(peerId, e.streams[0]);
                }
            };

            pc.onicecandidate = (e) => {
                if (e.candidate && socketRef.current) {
                    socketRef.current.emit("ice-candidate", { target: peerId, candidate: e.candidate });
                }
            };

            pc.oniceconnectionstatechange = () => {
                const state = pc.iceConnectionState;
                log(`ICE State to ${peerName}: ${state}`);
                if (state === "failed" || state === "disconnected") removePeer(peerId);
            };

            pc.onconnectionstatechange = () => {
                const state = pc.connectionState;
                log(`Connection to ${peerName}: ${state}`);
                if (state === "failed") removePeer(peerId);
            };

            return pc;
        },
        [log, removePeer, updatePeersState]
    );

    const setupSpeakingDetection = (peerId: string, stream: MediaStream) => {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        audioAnalyzers.current.set(peerId, analyser);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            let maxVolume = 0;
            let speakerId: string | null = null;
            audioAnalyzers.current.forEach((analyser, id) => {
                const data = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(data);
                const volume = data.reduce((a, b) => a + b, 0) / data.length;
                if (volume > maxVolume && volume > 5) {
                    maxVolume = volume;
                    speakerId = id;
                }
            });
            setSpeakingPeerId(speakerId);
        }, 150);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (showParticipants) {
            setShowChat(false);
        }

    }, [showParticipants]);

    const createOffer = useCallback(
        async (peerId: string, peerName: string, initialState?: { isMuted: boolean, isScreenSharing: boolean }) => {
            if (peersRef.current.some((p) => p.peerId === peerId)) return;
            const pc = createPeerConnection(peerId, peerName);
            const peerData: PeerData = {
                peerId,
                name: peerName,
                pc,
                iceQueue: [],
                isMuted: initialState?.isMuted ?? true,
                isScreenSharing: initialState?.isScreenSharing ?? false
            };
            peersRef.current.push(peerData);
            peerNamesRef.current.set(peerId, peerName);
            updatePeersState();

            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socketRef.current?.emit("offer", { target: peerId, sdp: pc.localDescription, isMuted: !micOnRef.current });
                log(`Sent offer to ${peerName}`);
            } catch (e: any) {
                log(`Offer error: ${e.message}`);
                removePeer(peerId);
            }
        },
        [createPeerConnection, log, removePeer, updatePeersState]
    );

    const initializeWebRTC = useCallback((existingUsers: { socketId: string; name: string; isMuted: boolean; isScreenSharing: boolean }[]) => {
        log("🚀 Initialize WebRTC");
        existingUsers.forEach((u) => {
            createOffer(u.socketId, u.name, { isMuted: u.isMuted, isScreenSharing: u.isScreenSharing });
        });
    }, [createOffer, log]);

    useEffect(() => {
        if (!meetingId || !user) return;

        const checkMeetingStatus = async () => {
            try {
                const res = await axios.get(`${SOCKET_SERVER_URL}/api/meeting/${meetingId}`, { withCredentials: true });
                if (res.data.status === "upcoming") {
                    setMeetingStatus("upcoming");
                } else if (res.data.status === "started") {
                    setMeetingStatus("started");
                    if (pollingIntervalId) clearInterval(pollingIntervalId);
                    initializeWebRTC(res.data.existingUsers || []);
                } else if (res.data.status === "ended") {
                    setMeetingStatus("ended");
                }
            } catch (err: any) {
                log(`Meeting status check error: ${err.message}`);
            }
        };

        checkMeetingStatus();

        if (meetingStatus === "upcoming") {
            const interval = setInterval(checkMeetingStatus, 5000);
            setPollingIntervalId(interval);
            return () => clearInterval(interval);
        }
    }, [meetingId, user, meetingStatus, pollingIntervalId, initializeWebRTC, log]);

    const handleOffer = useCallback(
        async (senderId: string, sdp: RTCSessionDescriptionInit, senderIsMuted?: boolean) => {
            if (peersRef.current.some((p) => p.peerId === senderId)) return;
            const senderName = peerNamesRef.current.get(senderId) || "User";
            const pc = createPeerConnection(senderId, senderName);
            const peerData: PeerData = { peerId: senderId, name: senderName, pc, iceQueue: [], isMuted: senderIsMuted ?? true };
            peersRef.current.push(peerData);
            peerNamesRef.current.set(senderId, senderName);
            updatePeersState();

            try {
                await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                peerData.iceQueue.forEach((c) => pc.addIceCandidate(new RTCIceCandidate(c)));
                peerData.iceQueue = [];
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socketRef.current?.emit("answer", { target: senderId, sdp: pc.localDescription });
                log(`Sent answer to ${senderName}`);
            } catch (err: any) {
                log(`Offer handling error: ${err.message}`);
                removePeer(senderId);
            }
        },
        [createPeerConnection, log, removePeer, updatePeersState]
    );

    const handleAnswer = useCallback(
        async (senderId: string, sdp: RTCSessionDescriptionInit) => {
            const peer = peersRef.current.find((p) => p.peerId === senderId);
            if (peer) {
                const senderName = peerNamesRef.current.get(senderId) || "User";
                log(`Got answer from ${senderName}`);
                try {
                    await peer.pc.setRemoteDescription(new RTCSessionDescription(sdp));
                } catch (e: any) {
                    log(`Set remote error for ${senderName}: ${e.message}`);
                }
            }
        },
        [log]
    );

    const handleIceCandidate = useCallback(
        (senderId: string, candidate: RTCIceCandidateInit) => {
            const peer = peersRef.current.find((p) => p.peerId === senderId);
            if (!peer) return;
            if (peer.pc.remoteDescription) {
                peer.pc.addIceCandidate(new RTCIceCandidate(candidate)).catch((err) => {
                    log(`ICE Candidate add error from ${peer.name}: ${err.message}`);
                });
            } else {
                peer.iceQueue.push(candidate);
            }
        },
        [log]
    );

    const cleanup = useCallback(() => {
        log("Cleaning up...");
        if (socketRef.current) {
            socketRef.current.removeAllListeners();
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        peersRef.current.forEach((p) => p.pc.close());
        peersRef.current = [];
        peerNamesRef.current.clear();
        audioAnalyzers.current.clear();
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        setLocalStream(null);
        setPeers([]);
        setIsConnected(false);
        isInitializing.current = false;
    }, [log]);

    useEffect(() => {
        if (!meetingId || !user) return;
        if (isInitializing.current) return;
        isInitializing.current = true;
        let isCancelled = false;

        const init = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

                const audioTrack = stream.getAudioTracks()[0];
                if (audioTrack) audioTrack.enabled = false;
                setMicOn(false);

                const savedVideo = localStorage.getItem("videoOn");
                if (savedVideo !== null) {
                    const videoState = JSON.parse(savedVideo);
                    const videoTrack = stream.getVideoTracks()[0];
                    if (videoTrack) videoTrack.enabled = videoState;
                    setVideoOn(videoState);
                }

                if (isCancelled) return;
                streamRef.current = stream;
                setLocalStream(stream);
                setupSpeakingDetection("local", stream);
                log("Camera ready ✓");

                const socket = io(SOCKET_SERVER_URL, { transports: ["websocket"], timeout: 20000 });
                socketRef.current = socket;

                socket.on("connect", () => {
                    if (isCancelled) return;
                    log(`Connected: ${socket.id?.slice(0, 8)}`);
                    setIsConnected(true);

                    socket.once("join-room-status", (status) => {
                        if (!status.success) {
                            toast.error(status.message);
                            cleanup();
                            navigate(`/meeting/${meetingId}/in-room`);
                        }
                    });

                    socket.emit("join-room", {
                        roomId: meetingId,
                        odId: user._id,
                        userName: user.name || "Anonymous",
                        isMuted: true
                    });

                    socket.once("all-users", (existingUsers) => {
                        log("🚀 Join success - starting WebRTC");
                        initializeWebRTC(existingUsers);
                    });
                });

                socket.on("all-users", (users: { socketId: string; name: string; isMuted: boolean; isScreenSharing: boolean }[]) => {
                    if (isCancelled) return;
                    log(`${users.length} user(s) in room`);
                    users.forEach((u) => {
                        peerNamesRef.current.set(u.socketId, u.name);
                        createOffer(u.socketId, u.name, { isMuted: u.isMuted, isScreenSharing: u.isScreenSharing });
                    });
                });

                socket.on("user-joined-room", ({ socketId, name: userName, isMuted: userIsMuted }) => {
                    if (isCancelled) return;
                    log(`${userName} joined (muted: ${userIsMuted})`);
                    peerNamesRef.current.set(socketId, userName);
                    const existingPeer = peersRef.current.find(p => p.peerId === socketId);
                    if (existingPeer) {
                        existingPeer.isMuted = userIsMuted ?? true;
                        updatePeersState();
                    }
                });

                socket.on("offer", ({ sender, sdp, isMuted: senderIsMuted }) => { if (!isCancelled) handleOffer(sender, sdp, senderIsMuted); });
                socket.on("answer", ({ sender, sdp }) => { if (!isCancelled) handleAnswer(sender, sdp); });
                socket.on("ice-candidate", ({ sender, candidate }) => { if (!isCancelled) handleIceCandidate(sender, candidate); });

                socket.on("user-toggled-mute", ({ socketId, isMuted }) => {
                    const peer = peersRef.current.find(p => p.peerId === socketId);
                    if (peer) {
                        peer.isMuted = isMuted;
                        updatePeersState();
                    }
                });

                socket.on("user-toggled-video", ({ socketId, isVideoOff }) => {
                    const peer = peersRef.current.find(p => p.peerId === socketId);
                    if (peer) {
                        peer.isVideoOff = isVideoOff;
                        updatePeersState();
                    }
                });

                socket.on("admin-toggle-mute", ({ isMuted }) => {
                    const track = streamRef.current?.getAudioTracks()[0];
                    if (track) {
                        track.enabled = !isMuted;
                        setMicOn(!isMuted);
                        // Dismiss previous toast and show new one with same ID
                        toast.dismiss("admin-mic-toast");
                        toast.info(
                            isMuted
                                ? "The host has muted your microphone"
                                : "The host has unmuted your microphone",
                            { toastId: "admin-mic-toast" }
                        );
                        log(`Admin ${isMuted ? 'muted' : 'unmuted'} your mic`);
                    }
                });

                socket.on("admin-toggle-video", ({ isVideoOff }) => {
                    const track = streamRef.current?.getVideoTracks()[0];
                    if (track) {
                        track.enabled = !isVideoOff;
                        setVideoOn(!isVideoOff);
                        // Dismiss previous toast and show new one with same ID
                        toast.dismiss("admin-video-toast");
                        toast.info(
                            isVideoOff
                                ? "The host has turned off your video"
                                : "The host has turned on your video",
                            { toastId: "admin-video-toast" }
                        );
                        log(`Admin ${isVideoOff ? 'turned off' : 'turned on'} your video`);
                    }
                });

                socket.on("user-toggled-screen-share", ({ socketId, isScreenSharing }) => {
                    log(`Received screen share toggle from ${socketId}: ${isScreenSharing}`);
                    const peer = peersRef.current.find(p => p.peerId === socketId);
                    if (peer) {
                        peer.isScreenSharing = isScreenSharing;
                        updatePeersState();
                        log(`Updated peer ${peer.name} screen share state to ${isScreenSharing}`);
                    } else {
                        log(`Peer ${socketId} not found for screen share toggle`);
                    }
                });

                socket.on("chat-message", (msg) => {
                    if (isCancelled) return;

                    console.log('[Chat] Received message:', msg);

                    const incomingMessage: ChatMessage = {
                        id: msg.id || `msg-${Date.now()}`,
                        senderId: msg.senderId,
                        senderName: msg.senderName,
                        message: msg.message,
                        timestamp: new Date(msg.timestamp || Date.now()),
                        isOwn: msg.senderId === user._id,
                    };

                    setChatMessages((prev) => [...prev, incomingMessage]);

                    // Use showChatRef.current instead of showChat
                    console.log('showChatRef.current:', showChatRef.current);
                    if (!showChatRef.current && !incomingMessage.isOwn) {
                        setUnreadCount((prev) => prev + 1);
                        // toast.info(`New message from ${msg.senderName}`, { autoClose: 3000 });
                    } else {
                        console.log('Chat is open or message from self');
                    }
                });

                socket.on("user-left", (id: string) => { if (!isCancelled) removePeer(id); });
                socket.on("disconnect", () => { log("Socket disconnected"); setIsConnected(false); });
                socket.on("connect_error", (err: any) => { log(`Socket connect error: ${err.message}`); });

                socket.on("user-kicked", () => {
                    log("You have been kicked from the meeting!");
                    toast.error("You have been kicked from the meeting!");
                    cleanup();
                    setTimeout(() => navigate("/"), 1500);
                });

                socket.on("meeting-ended", () => {
                    log("Meeting ended by host.");
                    cleanup();
                    navigate("/");
                    toast.info("Meeting ended by host.")
                });

            } catch (e: any) { log(`Media Error: ${e.message}. Check permissions.`); }
        };

        init();

        return () => { isCancelled = true; cleanup(); };
    }, [meetingId, user, log, createOffer, handleOffer, handleAnswer, handleIceCandidate, removePeer, cleanup, updatePeersState, navigate, initializeWebRTC]);

    useEffect(() => {
        const handleBeforeUnload = () => cleanup();
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [cleanup]);

    const toggleMic = () => {
        const track = localStream?.getAudioTracks()[0];
        if (!track) return;

        const newMicOn = !micOn;
        track.enabled = newMicOn;
        setMicOn(newMicOn);

        localStorage.setItem("micOn", JSON.stringify(newMicOn));
        log(`Mic toggled ${newMicOn ? "ON" : "OFF"}`);

        socketRef.current?.emit("toggle-mute", { roomId: meetingId, isMuted: !newMicOn });
    };

    const toggleVideo = () => {
        const track = localStream?.getVideoTracks()[0];
        if (track) {
            track.enabled = !videoOn;
            setVideoOn(!videoOn);
            localStorage.setItem("videoOn", JSON.stringify(!videoOn));
            log(`Video toggled ${!videoOn ? "ON" : "OFF"}`);
        }
    };

    const stopScreenSharing = useCallback(async () => {
        try {
            const screenTrack = streamRef.current?.getVideoTracks()[0];
            if (screenTrack) {
                screenTrack.onended = null;
                screenTrack.stop();
            }

            const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
            const camTrack = camStream.getVideoTracks()[0];
            const audioTrack = streamRef.current?.getAudioTracks()[0];

            peersRef.current.forEach(p => {
                const sender = p.pc.getSenders().find(s => s.track?.kind === "video");
                if (sender) sender.replaceTrack(camTrack);
            });

            const newLocalStream = new MediaStream([camTrack, audioTrack!]);
            streamRef.current = newLocalStream;
            setLocalStream(newLocalStream);
            setupSpeakingDetection("local", newLocalStream);
            setIsScreenSharing(false);
            setVideoOn(true);
            socketRef.current?.emit("toggle-screen-share", { roomId: meetingId, isScreenSharing: false });
            log("Screen sharing stopped, reverted to camera");
        } catch (e: any) { log(`Error reverting to camera: ${e.message}`); }
    }, [meetingId, log]);

    const startScreenSharing = useCallback(async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const screenTrack = screenStream.getVideoTracks()[0];

            screenTrack.onended = () => { stopScreenSharing(); };

            const audioTrack = streamRef.current?.getAudioTracks()[0];

            peersRef.current.forEach(p => {
                const sender = p.pc.getSenders().find(s => s.track?.kind === "video");
                if (sender) sender.replaceTrack(screenTrack);
            });

            const newLocalStream = new MediaStream([screenTrack, audioTrack!]);
            streamRef.current = newLocalStream;
            setLocalStream(newLocalStream);
            setupSpeakingDetection("local", newLocalStream);
            setIsScreenSharing(true);
            socketRef.current?.emit("toggle-screen-share", { roomId: meetingId, isScreenSharing: true });
            log("Screen sharing started");
        } catch (e: any) { log(`Error starting screen share: ${e.message}`); }
    }, [meetingId, log, stopScreenSharing]);

    const toggleScreenShare = () => { if (isScreenSharing) stopScreenSharing(); else startScreenSharing(); };

    const leaveMeeting = async () => {
        log("Leaving meeting...");
        try {
            if (adminId && user?._id === adminId) {
                await axios.post(`${SOCKET_SERVER_URL}/api/meeting/${meetingId}/end`,
                    { adminId: user._id, meetingCode: meetingId }, { withCredentials: true });
                socketRef.current?.emit("end-meeting", { roomId: meetingId });
            }
        } catch (e: any) { log(`Error ending meeting: ${e.message}`); }
        cleanup();
        setTimeout(() => navigate("/"), 50);
    };

    const kickPeer = (peerId: string) => {
        console.log(`Kick check: User=${user?._id}, Admin=${adminId}, Match=${user?._id === adminId}`);
        if (user?._id !== adminId) return;
        log(`Kicking peer ${peerId}`);
        socketRef.current?.emit("kick-user", { roomId: meetingId, targetSocketId: peerId });
        removePeer(peerId);
    };

    const adminToggleMutePeer = (peerId: string, currentlyMuted: boolean) => {
        if (user?._id !== adminId) return;
        const newMutedState = !currentlyMuted;
        log(`Admin ${newMutedState ? 'muting' : 'unmuting'} peer ${peerId}`);
        socketRef.current?.emit("admin-toggle-mute-user", {
            roomId: meetingId,
            targetSocketId: peerId,
            isMuted: newMutedState
        });
        // Update local state immediately
        const peer = peersRef.current.find(p => p.peerId === peerId);
        if (peer) {
            peer.isMuted = newMutedState;
            updatePeersState();
        }
    };

    const adminToggleVideoPeer = (peerId: string, currentlyVideoOff: boolean) => {
        if (user?._id !== adminId) return;
        const newVideoOffState = !currentlyVideoOff;
        log(`Admin ${newVideoOffState ? 'turning off' : 'turning on'} video for peer ${peerId}`);
        socketRef.current?.emit("admin-toggle-video-user", {
            roomId: meetingId,
            targetSocketId: peerId,
            isVideoOff: newVideoOffState
        });
        // Update local state immediately
        const peer = peersRef.current.find(p => p.peerId === peerId);
        if (peer) {
            peer.isVideoOff = newVideoOffState;
            updatePeersState();
        }
    };

    if (meetingStatus === "ended") return <Center>Meeting ended</Center>;
    if (meetingStatus === "upcoming") return <Center>Waiting for host to start the meeting...</Center>;

    const screenSharingPeer = peers.find(p => p.isScreenSharing);
    const isAdmin = user?._id === adminId;
    const participantCount = peers.length + 1;

    return (
        <div className="w-screen h-screen bg-white flex flex-col">
            <div className={`flex-1 pt-20 p-4 flex items-center justify-center overflow-hidden transition-all duration-300 ${showParticipants ? 'mr-80' : ''}`}>
                {screenSharingPeer ? (
                    <div
                        ref={constraintsRef}
                        className="relative w-full h-full bg-none overflow-hidden" // full container
                    >
                        <VideoTile
                            stream={screenSharingPeer.stream}
                            label={`${screenSharingPeer.name} (Screen)`}
                            isMuted={screenSharingPeer.isMuted}
                            className="w-full h-full"
                            videoClassName="object-contain" // <-- use contain so entire screen fits
                            speakingPeerId={speakingPeerId}
                        />

                        <motion.div
                            drag
                            dragConstraints={constraintsRef}
                            dragMomentum={false}
                            dragElastic={0}
                            className="absolute top-4 right-4 w-64 flex flex-col gap-3 max-h-[80vh] overflow-y-auto p-2 bg-none rounded-xl backdrop-blur-sm z-50 cursor-grab"
                        >
                            {/* Local PiP */}
                            <VideoTile
                                peerId="local"
                                stream={localStream}
                                label={`${name} (You)`}
                                muted
                                mirror
                                isMuted={!micOn}
                                speakingPeerId={speakingPeerId}
                                className="w-full h-32"
                            />

                            {/* Other PiPs */}
                            {peers
                                .filter((p) => p.peerId !== screenSharingPeer.peerId)
                                .map((p) => (
                                    <VideoTile
                                        key={p.peerId}
                                        peerId={p.peerId}
                                        stream={p.stream}
                                        label={p.name}
                                        isMuted={p.isMuted}
                                        mirror
                                        isAdmin={isAdmin}
                                        onKick={() => kickPeer(p.peerId)}
                                        speakingPeerId={speakingPeerId}
                                        className="w-full h-32"
                                    />
                                ))}
                        </motion.div>
                    </div>
                ) : (
                    <div
                        className="grid gap-3 w-full max-w-6xl"
                        style={{ gridTemplateColumns: peers.length === 0 ? "1fr" : `repeat(auto-fit, minmax(300px, 1fr))` }}
                    >
                        <VideoTile
                            peerId="local"
                            stream={localStream}
                            label={`${name} (You)`}
                            muted
                            mirror
                            isMuted={!micOn}
                            speakingPeerId={speakingPeerId}
                        />

                        {peers.map((p) => (
                            <VideoTile
                                key={p.peerId}
                                peerId={p.peerId}
                                stream={p.stream}
                                label={p.name}
                                mirror
                                isMuted={p.isMuted}
                                isAdmin={isAdmin}
                                onKick={() => kickPeer(p.peerId)}
                                speakingPeerId={speakingPeerId}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Participants Sidebar */}
            <AnimatePresence>
                {showParticipants && (
                    <motion.div
                        initial={{ x: 420 }}
                        animate={{ x: 0 }}
                        exit={{ x: 420 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-100 bg-white shadow-2xl z-50 flex flex-col"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800">
                                Participants ({participantCount})
                            </h2>
                            <button
                                onClick={() => setShowParticipants(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <FaTimes className="text-gray-500" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {/* Current User (You) */}
                            <ParticipantItem
                                name={`${name} (You)`}
                                isMuted={!micOn}
                                isVideoOff={!videoOn}
                                isHost={isAdmin}
                                isAdmin={false}
                            />

                            {/* Other Participants */}
                            {peers.map((p) => (
                                <ParticipantItem
                                    key={p.peerId}
                                    name={p.name}
                                    isMuted={p.isMuted}
                                    isVideoOff={p.isVideoOff}
                                    isHost={false}
                                    isAdmin={isAdmin}
                                    onKick={() => kickPeer(p.peerId)}
                                    onToggleMute={() => adminToggleMutePeer(p.peerId, p.isMuted ?? false)}
                                    onToggleVideo={() => adminToggleVideoPeer(p.peerId, p.isVideoOff ?? false)}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Sidebar */}
            <AnimatePresence>
                {showChat && (
                    <motion.div
                        initial={{ x: 420 }}
                        animate={{ x: 0 }}
                        exit={{ x: 420 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-9999 flex flex-col border-l border-gray-200"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-linear-to-r from-orange-500 to-orange-600">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <FaComments /> Chat
                            </h2>
                            <button
                                onClick={() => setShowChat(false)}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <FaTimes className="text-white" />
                            </button>
                        </div>

                        {/* Messages Container */}
                        <div
                            ref={chatContainerRef}
                            className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
                        >
                            {chatMessages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <FaComments className="text-4xl mb-2 opacity-50" />
                                    <p className="text-sm">No messages yet</p>
                                    <p className="text-xs">Start the conversation!</p>
                                </div>
                            ) : (
                                chatMessages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`
                                                ${msg.isOwn ? 'max-w-[95%]' : 'max-w-fit'}
                                                ${msg.isOwn ? 'order-2' : 'order-1'}
                                            `}
                                        >
                                            {!msg.isOwn && (
                                                <p className="text-xs text-gray-500 mb-1 ml-1">{msg.senderName}</p>
                                            )}
                                            <div
                                                className={`rounded-2xl px-4 py-2 ${msg.isOwn
                                                    ? 'bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-br-md text-left'
                                                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md text-left'
                                                    }`}
                                            >
                                                {/* REPLACE THIS LINE: */}
                                                {/* <p className="text-sm break-words">{msg.message}</p> */}

                                                {/* WITH THIS: */}
                                                <p className="text-sm wrap-break-word">
                                                    <MessageContent message={msg.message} isOwn={msg.isOwn} />
                                                </p>
                                            </div>
                                            <p className={`text-xs text-gray-400 mt-1 ${msg.isOwn ? 'text-right mr-1' : 'ml-1'}`}>
                                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                <br />
                                                {msg.isOwn ? 'You' : msg.senderName}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                            <div ref={bottomRef} className="h-1"></div>
                        </div>

                        {hasNewUnseenMessages && (
                            <button
                                onClick={() => {
                                    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
                                    setHasNewUnseenMessages(false);
                                }}
                                className="
                                    absolute bottom-20 right-6 z-50 
                                    bg-orange-500 text-white px-4 py-2 rounded-full shadow-lg 
                                    hover:bg-orange-600 transition-all
                                "
                            >
                                New messages ↓
                            </button>
                        )}

                        {/* Input Area */}
                        <div className="p-4 border-t border-gray-200 bg-white">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!newMessage.trim()}
                                    className={`p-3 rounded-xl transition-all duration-200 ${newMessage.trim()
                                        ? 'bg-linear-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg hover:scale-105'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    <FaPaperPlane className="text-sm" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Control Bar */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-full px-6 py-3 flex gap-4 z-9999 shadow-lg">
                <div className="flex gap-4">
                    <button
                        onClick={toggleMic}
                        data-tooltip-id="mic-tooltip"
                        data-tooltip-content="Toggle Microphone"
                        className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200 ${micOn ? "bg-gray-800 hover:bg-gray-700 text-white" : "bg-red-600 hover:bg-red-500 text-white"}`}
                    >
                        {micOn ? <FaMicrophone className="text-lg" /> : <FaMicrophoneSlash className="text-lg" />}
                    </button>
                    <Tooltip id="mic-tooltip" />

                    <button
                        onClick={toggleVideo}
                        data-tooltip-id="video-tooltip"
                        data-tooltip-content="Toggle Video"
                        className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200 ${videoOn ? "bg-gray-800 hover:bg-gray-700 text-white" : "bg-red-600 hover:bg-red-500 text-white"}`}
                    >
                        {videoOn ? <FaVideo className="text-lg" /> : <FaVideoSlash className="text-lg" />}
                    </button>
                    <Tooltip id="video-tooltip" />

                    <button
                        onClick={toggleScreenShare}
                        data-tooltip-id="screen-share-tooltip"
                        data-tooltip-content="Toggle Screen Share"
                        className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200 ${isScreenSharing ? "bg-green-600 hover:bg-green-500 text-white" : "bg-gray-800 hover:bg-gray-700 text-white"}`}
                    >
                        <FaDesktop className="text-lg" />
                    </button>
                    <Tooltip id="screen-share-tooltip" />

                    <button
                        onClick={() => setShowParticipants(!showParticipants)}
                        data-tooltip-id="participants-tooltip"
                        data-tooltip-content="Participants"
                        className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200 relative ${showParticipants ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-gray-800 hover:bg-gray-700 text-white"}`}
                    >
                        <FaUsers className="text-lg" />
                        <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                            {participantCount}
                        </span>
                    </button>
                    <Tooltip id="participants-tooltip" />

                    <button
                        onClick={toggleChat}
                        data-tooltip-id="chat-tooltip"
                        data-tooltip-content="Chat"
                        className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200 relative ${showChat
                            ? "bg-blue-600 hover:bg-blue-500 text-white"
                            : "bg-gray-800 hover:bg-gray-700 text-white"
                            }`}
                    >
                        <FaComments className="text-lg" />
                        {unreadCount > 0 && !showChat && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                                {unreadCount > 50 ? '50+' : unreadCount}
                            </span>
                        )}
                    </button>
                    <Tooltip id="chat-tooltip" />

                    <button
                        onClick={leaveMeeting}
                        data-tooltip-id="leave-tooltip"
                        data-tooltip-content={isAdmin ? "End Meeting" : "Leave Meeting"}
                        className="w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200 bg-red-600 hover:bg-red-500 text-white"
                    >
                        {isAdmin ? <FaTimes className="text-lg" /> : <FaPhoneSlash className="text-lg" />}
                    </button>
                    <Tooltip id="leave-tooltip" />
                </div>
            </div>
        </div>
    );
};

const Center = ({ children }: { children: React.ReactNode }) => (
    <div className="w-screen h-screen flex items-center justify-center bg-gray-900 text-white">{children}</div>
);

interface ParticipantItemProps {
    name: string;
    isMuted?: boolean;
    isVideoOff?: boolean;
    isHost?: boolean;
    isAdmin?: boolean;
    onKick?: () => void;
    onToggleMute?: () => void;
    onToggleVideo?: () => void;
}

const ParticipantItem: React.FC<ParticipantItemProps> = ({ name, isMuted, isVideoOff, isHost, isAdmin, onKick, onToggleMute, onToggleVideo }) => {
    const [hover, setHover] = useState(false);
    const isYou = name.includes("(You)");

    return (
        <div
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800">{name}</span>
                    {isHost && (
                        <span className="text-xs text-orange-600 font-medium">Host</span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2">
                {/* Status indicators */}
                <div className="flex items-center gap-1">
                    {isMuted ? (
                        <FaMicrophoneSlash className="text-red-500 text-sm" />
                    ) : (
                        <FaMicrophone className="text-green-500 text-sm" />
                    )}
                    {isVideoOff ? (
                        <FaVideoSlash className="text-red-500 text-sm" />
                    ) : (
                        <FaVideo className="text-green-500 text-sm" />
                    )}
                </div>

                {/* Admin controls - only show on hover for non-self participants */}
                {isAdmin && !isYou && hover && (
                    <div className="flex items-center gap-1 ml-2">
                        {/* Toggle Mute button */}
                        {onToggleMute && (
                            <button
                                onClick={onToggleMute}
                                className={`p-2 rounded-full transition-colors ${isMuted
                                    ? "bg-red-100 hover:bg-red-200"
                                    : "bg-green-100 hover:bg-green-200"
                                    }`}
                                title={isMuted ? "Unmute participant" : "Mute participant"}
                                data-tooltip-id="mute-tooltip"
                                data-tooltip-content={isMuted ? "Unmute participant" : "Mute participant"}
                            >
                                <Tooltip id="mute-tooltip" />
                                {isMuted ? (
                                    <FaMicrophoneSlash className="text-red-600 text-sm" />
                                ) : (
                                    <FaMicrophone className="text-green-600 text-sm" />
                                )}
                            </button>
                        )}

                        {/* Toggle Video button */}
                        {onToggleVideo && (
                            <button
                                onClick={onToggleVideo}
                                className={`p-2 rounded-full transition-colors ${isVideoOff
                                    ? "bg-red-100 hover:bg-red-200"
                                    : "bg-green-100 hover:bg-green-200"
                                    }`}
                                title={isVideoOff ? "Turn on video" : "Turn off video"}
                                data-tooltip-id="video-tooltip"
                                data-tooltip-content={isVideoOff ? "Turn on video" : "Turn off video"}
                            >
                                <Tooltip id="video-tooltip" />
                                {isVideoOff ? (
                                    <FaVideoSlash className="text-red-600 text-sm" />
                                ) : (
                                    <FaVideo className="text-green-600 text-sm" />
                                )}
                            </button>
                        )}

                        {/* Kick button */}
                        {onKick && (
                            <button
                                onClick={onKick}
                                className="p-2 bg-red-100 hover:bg-red-200 rounded-full transition-colors"
                                title="Remove from meeting"
                                data-tooltip-id="kick-tooltip"
                                data-tooltip-content="Kick"
                            >
                                <FaUserTimes className="text-red-600 text-sm" />
                                <Tooltip id="kick-tooltip" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const VideoTile = ({ peerId, stream, label, muted, mirror, isMuted, isAdmin, onKick, className, videoClassName, speakingPeerId }: any) => {
    const ref = useRef<HTMLVideoElement>(null);
    const [hover, setHover] = useState(false);

    useEffect(() => {
        if (ref.current && stream) ref.current.srcObject = stream;
    }, [stream]);

    const isSpeaking = speakingPeerId === peerId;

    return (
        <div
            className={`relative bg-none rounded-xl overflow-hidden shadow-lg border ${isSpeaking ? "border-orange-500 border-4" : "border-gray-700"} ${muted ? "border-black" : ""} ${className?.includes('h-full') ? '' : 'aspect-video'} ${className || ""}`}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <video
                ref={ref}
                autoPlay
                playsInline
                muted={muted}
                className={`w-full h-full ${mirror ? "scale-x-[-1]" : ""} ${videoClassName || "object-cover"} border-red`}
            />
            {label && (
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-sm px-2 py-1 rounded flex items-center gap-2">
                    {label} {isMuted && <FaMicrophoneSlash className="text-red-500 text-xs" />}
                </div>
            )}

            {isAdmin && onKick && hover && (
                <button onClick={onKick} className="absolute top-2 right-2 bg-red-600 p-2 rounded-full">
                    <FaUserTimes color="white" />
                </button>
            )}
        </div>
    );
};

export default ConferenceCallPage;
