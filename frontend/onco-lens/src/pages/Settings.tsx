import React, { useEffect, useRef, useState } from 'react';
import { useUser } from '../../context/UserContext';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { useDocuments } from '../../context/DocumentsContext';
import { useProjects } from '../../context/ProjectsContext';

const Settings = () => {
    const { user, setUser, updateUser, getUserInfo } = useUser();
    const { logout } = useAuth();
    const { id } = useParams();
    const { documents, fetchDocuments, updateDocument, setDocuments } = useDocuments(); // ✅ get documents from context
    const { projects, setProjects, updateProject } = useProjects();

    // Local state for form inputs
    const [name, setName] = useState<string>(user?.name || '');
    const [email, setEmail] = useState<string>(user?.email || '');
    const [password, setPassword] = useState<string>('');

    const emailRef = useRef<string>(email);
    const nameRef = useRef<string>(name);

    const socket = io("http://localhost:8000");
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "OncoLens | Settings";

        const fetchUser = async () => {
            try {
                await getUserInfo(id!);
            } catch (error) {
                console.error("Failed to get user info:", error);
            }
        };

        fetchUser();
    }, [id]);

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
            setPassword('');
        }
    }, [user]);

   const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("HANDLING UPDATE");

        try {
            // 1️⃣ Update user in backend
            const updatedUser: any = await updateUser(id!, {
                name,
                email,
                ...(password && { password }),
            });

            if (!updatedUser) {
                toast.error("Failed to update user info");
                return;
            }

            console.log("Updated user:", updatedUser);

            // 2️⃣ Update email/name refs
            emailRef.current = updatedUser.email;
            nameRef.current = updatedUser.name;

            console.log("UPDATED NAME: " + updatedUser.name);

            // 3️⃣ Update documents authored by this user in frontend
            documents.forEach(doc => {
                if (doc.createdBy === updatedUser._id) {
                    updateDocument(doc._id, { author: updatedUser.name });
                }
            });
            

            // 4️⃣ Update adminName for projects where this user is admin
            console.log(projects);
            if (projects?.length) {
                const updatedProjects = projects.map(proj => {
                    console.log(proj);
                    console.log(proj.adminId);
                    console.log(updatedUser);
                    if (proj.adminId === updatedUser._id) {
                        updateProject(proj._id, {adminName: updatedUser.name})
                    }
                    return proj;
                });

                // Optionally, update your state if you store projects in state
                setProjects(updatedProjects);

                // Also fetch documents if needed
                for (const proj of updatedProjects) {
                    await fetchDocuments(proj._id);
                    console.log("Fetched project documents:", proj._id);
                }
            }

            // 5️⃣ Clear password field
            setPassword('');

            // 6️⃣ Show success toast
            toast.success("User info updated successfully!");
        } catch (error) {
            toast.error("Failed to update user info");
            console.error("handleUpdate error:", error);
        }
    };

    console.log("UPDATED PROJECTS");
    console.log(projects);


    const handleDelete = async () => {
        try {
            socket.emit("leave_room", id);
            await axios.delete(`http://localhost:8000/api/user/${id}`, { withCredentials: true });
            setUser(null);
            logout();
            navigate("/"); // redirect after delete
        } catch (error) {
            toast.error("Failed to delete user");
        }
    };

    return (
        <div className="w-11/12 md:w-10/12 lg:w-8/12 mx-auto mt-40">
            <ToastContainer
                position="top-center"
                autoClose={2000}
                hideProgressBar
                newestOnTop
                pauseOnHover
                theme="light"
                closeButton={false}
            />
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>

            <form onSubmit={handleUpdate} className="space-y-4">
                {/* Name */}
                <div>
                    <label htmlFor="name" className="block text-gray-700 mb-1">Name</label>
                    <input
                        type="text"
                        id="name"
                        ref={nameRef}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                        required
                    />
                </div>

                {/* Email */}
                <div>
                    <label htmlFor="email" className="block text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        id="email"
                        ref={emailRef}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                        required
                    />
                </div>

                {/* Password */}
                <div>
                    <label htmlFor="password" className="block text-gray-700 mb-1">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password || ''}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="********"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                    <p className="text-gray-400 text-sm mt-1">Leave blank to keep current password</p>
                </div>

                <button
                    type="submit"
                    className="bg-orange-400 text-white px-6 py-2 rounded-md hover:bg-orange-500 transition w-full cursor-pointer"
                >
                    Update Settings
                </button>
            </form>

            <button
                type="button"
                className="bg-red-400 text-white px-6 py-2 rounded-md hover:bg-red-500 transition w-full cursor-pointer mt-4"
                onClick={handleDelete}
            >
                Delete Account
            </button>
        </div>
    );
};

export default Settings;
