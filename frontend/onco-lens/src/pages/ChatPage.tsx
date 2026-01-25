import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaSearch, FaEllipsisV, FaUserCircle, FaSmile } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import io, { Socket } from "socket.io-client";
import { useProjects } from '../../context/ProjectsContext';
import { useUser } from '../../context/UserContext';
import axios from 'axios';
import { useParams } from 'react-router';
import EmojiPicker from 'emoji-picker-react';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'other';
    senderName: string;
    timestamp: Date;
    avatar?: string;
    senderId?: string;
    recipientId?: string;
    projectId?: string;
}

interface Contact {
    id: string;
    name: string;
    lastMessage: string;
    sender: 'user' | 'other';
    timestamp: string;
    unread: number;
    avatar?: string;
    online: boolean;
}

const ChatPage = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [socketReady, setSocketReady] = useState(false);

    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

    const [messages, setMessages] = useState<Record<string, Message[]>>({});
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [chosenEmoji, setChosenEmoji] = useState<string>('');
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const emojiButtonRef = useRef<HTMLButtonElement>(null);
    const [projectId, setProjectId] = useState<string | null>(null);
    const [showNewMessagesIndicator, setShowNewMessagesIndicator] = useState(false);


    const projects = useProjects();
    const user = useUser();

    useEffect(() => {
        if (projects.projects.length > 0) {
            setProjectId(projects.projects[0]._id); // pick first project
        }
    }, [projects.projects]);

    useEffect(() => {
        setShowEmojiPicker(false);
    }, []);


    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            const clickedInsidePicker =
                emojiPickerRef.current?.contains(target);

            const clickedEmojiButton =
                emojiButtonRef.current?.contains(target);

            // If clicked inside picker → do nothing
            if (clickedInsidePicker) return;

            // If clicked emoji button → toggle
            if (clickedEmojiButton) {
                setShowEmojiPicker(prev => !prev);
                return;
            }

            // Clicked anywhere else → close
            setShowEmojiPicker(false);
        };

        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleUserNameUpdate = (data: { userId: string; newName: string }) => {
            setContacts(prev =>
                prev.map(c => c.id === data.userId ? { ...c, name: data.newName } : c)
            );

            // Also update messages where senderName matches this user
            setMessages(prev => {
                const updated: Record<string, Message[]> = {};
                for (const contactId in prev) {
                    updated[contactId] = prev[contactId].map(msg =>
                        msg.senderId === data.userId
                            ? { ...msg, senderName: data.newName }
                            : msg
                    );
                }
                return updated;
            });
        };

        socket.on("user_name_updated", handleUserNameUpdate);

        return () => socket.off("user_name_updated", handleUserNameUpdate);
    }, [socket]);


    const handleEmojiClick = (emoji: string) => {
        setChosenEmoji(emoji);
        // console.log("EMOJI CHOSEN");
        setNewMessage((prev) => prev + emoji.emoji);
    };

    // -----------------------------
    // 3. Load All Contacts
    // -----------------------------

    const loadContacts = async () => {
        if (!user?.user?._id) return;
        const fetchedProjects = await projects.fetchProjects();

        const project = fetchedProjects ? fetchedProjects[0] : null; // pick the first project
        if (!project) return;

        const tempContacts: Contact[] = [];

        // Admin contact (if not current user)
        if (user.user._id !== project.adminId) {
            tempContacts.push({
                id: project.adminId,
                name: project.adminName || "Admin",
                lastMessage: '',
                timestamp: '',
                unread: 0,
                online: project.adminIsOnline || false,
                sender: 'user',
            });
        }
        
        // console.log(project.adminName);

        // Team members
        for (const email of project.teamEmails) {
            if (email === user.user.email) continue;

            const member = await user.getUserByEmail(email); // fetch user info
            if (!member?._id) continue;

            tempContacts.push({
                id: member._id,
                name: member.name,
                lastMessage: '',
                timestamp: '',
                unread: 0,
                online: member.isOnline || false,
                sender: 'other',
            });
        }

        setContacts(tempContacts);
    };

    const loadChatWithContact = async (contactId: string) => {
        if (!user?.user?._id || !projectId) return;

        // // console.log("THIS IS LOAD CHAT WITH CONTACT");

        try {
            const res = await axios.get(`http://localhost:8000/api/chat/${user.user._id}/${contactId}?projectId=${projectId}`, {
                withCredentials: true,
            });

            const chat = res.data;
            //// console.log(chat);

            // Map messages to your frontend format
            const mappedMessages = chat.messages.map((m: any) => (
                // // console.log(m.senderId._id),
                {
                    id: m._id,
                    text: m.text,
                    sender: m.senderId._id === user?.user?._id ? 'user' : 'other',
                    senderId: m.senderId._id,
                    senderName: m.senderId._id === user?.user?._id ? user?.user?.name : m.senderName,
                    recipientId: chat.participants.find((id: string) => id !== user?.user?._id),
                    timestamp: new Date(m.timestamp),
                    projectId: projectId
                }));

            setMessages(prev => ({
                ...prev,
                [contactId]: mappedMessages
            }));
            // scrollToBottom();
        } catch (err) {
            // console.error('Failed to load chat:', err);
        }
    };


    // useEffect(() => {
    //     // console.log("LOOK AT THIS:", user?.user?._id);

    //     const s = io("http://localhost:8000", { transports: ["websocket"] });
    //     setSocket(s);

    //     s.on("connect", () => {
    //         // console.log("Socket connected:", s.id);
    //         setSocketReady(true);
    //         if (!user.user?._id) {
    //             // console.log("No user");
    //             return
    //         };
    //         loadChatWithContact(user.user._id);
    //     });

    //     // console.log(contacts);


    //     return () => s.disconnect();

    // }, []);

    useEffect(() => {
        if (!user?.user?._id) return;
        loadContacts();
        // console.log("LOAD CONTACTS RAN!");
    }, [user]);

    // Load latest message for every contact AFTER contacts are loaded
    // Load latest message for every contact AFTER contacts are loaded
    useEffect(() => {
        if (!user?.user?._id || contacts.length === 0) return;

        const loadLastMessages = async () => {
            // Filter contacts that don't have messages loaded yet
            const contactsToFetch = contacts.filter(c => !messages[c.id]);

            if (contactsToFetch.length === 0 || !projectId) return;

            const newMessages: Record<string, Message[]> = {};

            await Promise.all(contactsToFetch.map(async (c) => {
                try {
                    const res = await axios.get(
                        `http://localhost:8000/api/chat/${user.user._id}/${c.id}?projectId=${projectId}`,
                        { withCredentials: true }
                    );
                    const chat = res.data;
                    if (chat && chat.messages) {
                        newMessages[c.id] = chat.messages.map((m: any) => ({
                            id: m._id,
                            text: m.text,
                            sender: m.senderId._id === user.user._id ? "user" : "other",
                            senderName: m.senderId.name,
                            senderId: m.senderId._id,
                            recipientId: c.id,
                            timestamp: new Date(m.timestamp),
                        }));
                    } else {
                        newMessages[c.id] = [];
                    }
                } catch (err) {
                    // console.error("Failed to load chat for", c.id);
                    newMessages[c.id] = [];
                }
            }));

            setMessages(prev => ({ ...prev, ...newMessages }));
        };

        loadLastMessages();
    }, [contacts, user, messages]);

    React.useLayoutEffect(() => {
        if (selectedContact) {
            loadChatWithContact(selectedContact.id);
            scrollToBottom();
        }
    }, [selectedContact]);

    // Receive messages from socket
    useEffect(() => {
        if (!socket || !user?.user?._id) return;

        const handleMessage = (data: { message: Message; from: string }) => {
            const incoming: Message = {
                ...data.message,
                sender: data.message.senderId === user.user._id ? 'user' : 'other',
                timestamp: new Date(data.message.timestamp)
            };

            // Add message to messages per contact
            setMessages(prev => {
                const updated = {
                    ...prev,
                    [data.from]: [...(prev[data.from] || []), incoming]
                };

                // Scroll to bottom after updating messages
                setTimeout(() => {
                    if (messagesContainerRef.current) {
                        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                    }
                }, 0);

                return updated;
            });
        };

        socket.on("receive_message", handleMessage);

        return () => socket.off("receive_message", handleMessage);
    }, [socket, user]);


    // Update each contact's lastMessage whenever messages change
    useEffect(() => {
        setContacts(prevContacts =>
            prevContacts.map(contact => {
                const convo = messages[contact.id] || [];
                if (!convo.length) return contact;

                const lastMsg = convo[convo.length - 1];
                return {
                    ...contact,
                    lastMessage: lastMsg.text,
                    timestamp: lastMsg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
            })
        );
    }, [user, messages]);




    useEffect(() => {
        if (!user?.user?._id) {
            //// console.log("No user");
            return;
        };  // Wait for the real user
        projects.fetchProjects();
    }, [user]);

    useEffect(() => {
        // Update contact lastMessage whenever messages update
        setContacts(prevContacts =>
            prevContacts.map(contact => {
                const convoMessages = messages[contact.id] || [];
                if (convoMessages.length === 0) return contact;

                const lastMsg = convoMessages[convoMessages.length - 1];
                return {
                    ...contact,
                    lastMessage: lastMsg.text,
                    timestamp: lastMsg.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
                };
            })
        );
    }, [messages]);


    // -----------------------------
    // 1. Initialize Socket
    // -----------------------------
    useEffect(() => {
        const s = io("http://localhost:8000", { transports: ["websocket"] });
        setSocket(s);

        s.on("connect", () => {
            //// console.log("Socket connected:", s.id);
            setSocketReady(true);
            if (!user.user?._id) {
                // console.log("No user");
                return
            };
            loadChatWithContact(user.user._id);
        });


        return () => s.disconnect();
    }, [user]);

    //// console.log(contacts);

    // -----------------------------
    // 2. Register User
    // -----------------------------
    useEffect(() => {
        if (!socketReady || !socket || !user?.user?._id) return;

        socket.emit("register_user", user.user._id);
        // console.log("Registered user:", user.user._id);
    }, [socketReady, socket, user]);

    useEffect(() => {
        if (!socketReady || !user?.user?._id) return;
        loadChatWithContact(user.user._id);
    }, [socketReady, user]);

    // -----------------------------
    // 4. Online Status Events
    // -----------------------------
    useEffect(() => {
        if (!socket) return;

        const handleUserOnline = (userId: string) => {
            setContacts(prev =>
                prev.map(c => c.id === userId ? { ...c, online: true } : c)
            );
        };

        const handleUserOffline = (userId: string) => {
            setContacts(prev =>
                prev.map(c => c.id === userId ? { ...c, online: false } : c)
            );
        };

        socket.on("user_online", handleUserOnline);
        socket.on("user_offline", handleUserOffline);

        return () => {
            socket.off("user_online", handleUserOnline);
            socket.off("user_offline", handleUserOffline);
        };
    }, [socket]);

    // -----------------------------
    // 5. Load Messages When Selecting Contact
    // -----------------------------
    useEffect(() => {
        if (!selectedContact || !socket || !user?.user?._id) return;

        socket.emit("load_messages", {
            userId: user.user._id,
            contactId: selectedContact.id
        });

        socket.once("messages_loaded", (msgs: any[]) => {
            const parsed = msgs.map(m => ({
                ...m,
                sender: m.senderId === user?.user?._id ? 'user' : 'other',
                timestamp: new Date(m.timestamp)
            }));
            setMessages(parsed);

        });
    }, [selectedContact, socket, user]);


    // -----------------------------
    // 6. Receive Messages Live
    // -----------------------------
    // useEffect(() => {
    //     if (!socket) return;

    //     const handleMessage = (data: { message: Message; from: string }) => {
    //         const incoming: Message = {
    //             ...data.message,
    //             sender: 'other',
    //             timestamp: new Date(data.message.timestamp)
    //         };

    //         // Only append messages from current chat
    //         if (selectedContact && data.from === selectedContact.id) {
    //             setMessages(prev => ({
    //                 ...prev,
    //                 [data.from]: [...(prev[data.from] || []), incoming]
    //             }));
    //         }

    //         // Mark contact last message preview
    //         setContacts(prev =>
    //             prev.map(c =>
    //                 c.id === data.from
    //                     ? { ...c, lastMessage: incoming.text }
    //                     : c
    //             )
    //         );
    //     };

    //     socket.on("receive_message", handleMessage);
    //     return () => socket.off("receive_message", handleMessage);
    // }, [socket, selectedContact]);

    // -----------------------------
    // 7. Send Message
    // -----------------------------

    const isUserNearBottom = () => {
        if (!messagesContainerRef.current) return false;
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        return scrollHeight - scrollTop - clientHeight < 80; // threshold
    };


    const isSendingRef = useRef(false);

    React.useLayoutEffect(() => {
        if (!selectedContact) return;

        if (isUserNearBottom() || isSendingRef.current) {
            scrollToBottom();
            setShowNewMessagesIndicator(false);
            isSendingRef.current = false;
        } else {
            // User is reading older messages, show indicator
            const lastMsgs = messages[selectedContact.id] || [];
            if (lastMsgs.length) setShowNewMessagesIndicator(true);
        }
    }, [messages[selectedContact?.id]]); // only watch messages for selected contact


    const scrollToBottom = () => {
        if (!messagesContainerRef.current) return;
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    };



    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedContact || !user?.user?._id || !projectId) return;

        // console.log(projectId);

        const messagePayload = {
            senderId: user.user._id,
            recipientId: selectedContact.id,
            text: newMessage,
            projectId: projectId

        };

        try {
            // Send message to backend
            const res = await axios.post('http://localhost:8000/api/chat/send', messagePayload, {
                withCredentials: true,
            });

            const savedMessage = res.data;
            // console.log("FIRST SEND!");

            const newMsg: Message = {
                id: savedMessage._id || `msg-${Date.now()}`, // fallback for frontend
                text: savedMessage.text,
                sender: 'user',
                senderName: user.user.name,
                senderId: savedMessage.senderId,
                recipientId: selectedContact.id,
                timestamp: new Date(savedMessage.timestamp),
                projectId: projectId
            };

            // Add message to local state per contact
            isSendingRef.current = true;
            setMessages(prev => ({
                ...prev,
                [selectedContact.id]: [...(prev[selectedContact.id] || []), newMsg]
            }));

            // Emit to socket
            socket?.emit("send_message", {
                message: newMsg,
                from: user.user._id,
                to: selectedContact.id,
                projectId: projectId
            });

            setNewMessage('');
        } catch (err) {
            // console.error('Failed to send message:', err);
        }
    };



    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // -----------------------------
    // UI Rendering
    // -----------------------------
    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!user?.user?._id) return <div>Loading...</div>;

    return (
        <div className="h-[80vh] bg-gray-100 flex">

            {/* ---------------- Sidebar ---------------- */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-lg">
                <div className="p-4 border-b bg-gradient-to-r from-orange-500 to-orange-600">
                    <h1 className="text-2xl font-bold text-white mb-3">Messages</h1>

                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-full bg-white/90 text-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredContacts.length > 0 ? filteredContacts.map(contact => (
                        <motion.div
                            key={contact.id}
                            onClick={() => setSelectedContact(contact)}
                            className={`p-4 cursor-pointer ${selectedContact?.id === contact.id ? "bg-orange-50 border-l-4 border-orange-500" : ""}`}
                            whileHover={{ backgroundColor: "#0000001a" }}
                        >
                            <div className="flex items-start gap-3">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center text-lg font-bold">
                                        {contact.name.charAt(0)}
                                    </div>
                                    {contact.online && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <h3 className="font-semibold text-[14px]">{contact.name}</h3>
                                        <span className="text-xs text-gray-500 text-right w-[50%]">{contact.timestamp}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 truncate max-w-[200px]">
                                        {/* {contact.sender} -- 9 */}
                                        {/* {contact.sender === 'other' ? 'You' : contact.name}: {contact.lastMessage || "No messages yet"} */}
                                        {contact.lastMessage || "No messages yet"}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )) : (
                        <p className="text-center py-10 text-gray-500">No contacts found</p>
                    )}
                </div>
            </div>


            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedContact ? (
                    <>
                        {/* Header */}
                        <div className="bg-white p-4 flex justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-semibold">
                                        {selectedContact.name.charAt(0)}
                                    </div>
                                    {selectedContact.online && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                    )}
                                </div>
                                <div>
                                    <h2 className="font-semibold">{selectedContact.name}</h2>
                                    {/* <p className="text-xs">{selectedContact.online ? "Online" : "Offline"}</p> */}
                                </div>
                            </div>
                        </div>

                        {/* Messages container */}
                        <div ref={messagesContainerRef} className="flex-1 flex-col overflow-y-auto p-6 bg-gray-50 space-y-4 w-[50vw] relative">
                            <AnimatePresence>
                                {(messages[selectedContact.id] || []).map(msg => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className="max-w-[50%]">
                                            <p className="text-xs text-gray-500 mb-1">{msg.sender === 'user' ? 'You' : selectedContact.name}</p>
                                            <div className={`px-4 py-3 rounded-2xl shadow ${msg.sender === 'user' ? 'bg-orange-500 text-white rounded-br-md' : 'bg-white rounded-bl-md'}`}>
                                                <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>
                                            </div>
                                            <p className={`text-xs text-gray-400 mt-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                                {msg.timestamp.toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            <div ref={messagesEndRef} />

                            {/* New Messages Indicator */}
                            {showNewMessagesIndicator && (
                                <div
                                    onClick={scrollToBottom}
                                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full flex items-center gap-2 cursor-pointer shadow-lg"
                                >
                                    <span>New Messages</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            )}
                        </div>



                        {/* Input fixed at bottom */}
                        <div className="bg-white p-4">
                            <div className="flex items-center gap-3">
                                <button className="p-3 hover:bg-gray-100 rounded-full smile-picker cursor-pointer epr" ref={emojiButtonRef}>
                                    <FaSmile className="text-gray-500 epr" />
                                </button>

                                <div className='absolute top-[45%]' ref={emojiPickerRef}>
                                    {showEmojiPicker && (
                                        <EmojiPicker
                                            onEmojiClick={handleEmojiClick}
                                            theme="light"
                                        />
                                    )}
                                </div>

                                <input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-3 border rounded-full"
                                />

                                <button
                                    onClick={handleSendMessage}
                                    disabled={!newMessage.trim()}
                                    className={`p-3 rounded-full ${newMessage.trim()
                                        ? "bg-orange-500 text-white"
                                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                        }`}
                                >
                                    <FaPaperPlane />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <FaUserCircle className="text-6xl text-gray-400 mx-auto mb-3" />
                            <h2 className="text-xl font-semibold">Select a chat</h2>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default ChatPage;
