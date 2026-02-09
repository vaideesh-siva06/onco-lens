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
    const { documents, fetchDocuments, updateDocument } = useDocuments(); // ✅ get documents from context
    const { projects, setProjects, updateProject } = useProjects();

    // Local state for form inputs
    const [name, setName] = useState<string>(user?.name || '');
    const [email, setEmail] = useState<string>(user?.email || '');
    const [password, setPassword] = useState<string>('');

    const nameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);

    const socket = io("https://onco-lens-backend.onrender.com");
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "OncoLens | Settings";

        const fetchUser = async () => {
            try {
                await getUserInfo(id!);
            } catch (error) {
                // console.error("Failed to get user info:", error);
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
        // console.log("HANDLING UPDATE");

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

            // console.log("Updated user:", updatedUser);

            // 2️⃣ Update email/name refs
            emailRef.current = updatedUser.email;
            nameRef.current = updatedUser.name;

            // console.log("UPDATED NAME: " + updatedUser.name);

            // 3️⃣ Update documents authored by this user in frontend
            documents.forEach(doc => {
                if (doc.createdBy === updatedUser._id) {
                    updateDocument(doc._id, { author: updatedUser.name });
                }
            });
            

            // 4️⃣ Update adminName for projects where this user is admin
            // console.log(projects);
            if (projects?.length) {
                const updatedProjects = projects.map(proj => {
                    // console.log(proj);
                    // console.log(proj.adminId);
                    // console.log(updatedUser);
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
                    // console.log("Fetched project documents:", proj._id);
                }
            }

            // 5️⃣ Clear password field
            setPassword('');

            // 6️⃣ Show success toast
            toast.success("User info updated successfully!");
        } catch (error) {
            toast.error("Failed to update user info");
            // console.error("handleUpdate error:", error);
        }
    };

    // console.log("UPDATED PROJECTS");
    // console.log(projects);


    const handleDelete = async () => {
        try {
            socket.emit("leave_room", id);
            await axios.delete(`https://onco-lens-backend.onrender.com/api/user/${id}`, { withCredentials: true });
            setUser(null);
            logout();
            navigate("/"); // redirect after delete
        } catch (error) {
            toast.error("Failed to delete user");
        }
    };

   const reconnectGoogleAccount = async () => {
        if (!user?._id) return;

        try {
            const res = await axios.get(
            `https://onco-lens-backend.onrender.com/api/user/auth/google/reconnect`,
            { params: { userId: user._id },
              withCredentials: true
            }
            
            );

            const { url } = res.data;
            if (!url) throw new Error("No OAuth URL returned from backend");

            const width = 500;
            const height = 600;
            const left = window.screenX + (window.innerWidth - width) / 2;
            const top = window.screenY + (window.innerHeight - height) / 2;

            const popup = window.open(
            url,
            "Google OAuth",
            `width=${width},height=${height},left=${left},top=${top}`
            );

            console.log(popup);

            const listener = (event: MessageEvent) => {
            if (!event.data.googleConnected) return;

                toast.success("Google account connected successfully!");

                setUser(prev => {
                    if (!prev) return prev; // do nothing if user is null
                    return {
                        ...prev,
                        googleAccessToken: event.data.accessToken,
                    };
                });


                window.removeEventListener("message", listener);
                window.close();

                // ✅ Do NOT navigate, the user is already on the main page
                // navigate(`/${user._id}/dashboard`);  <-- remove this
            };

            //window.addEventListener("message", listener);

        } catch (error: any) {
            console.error("Failed to reconnect Google:", error);
            toast.error("Failed to initiate Google reconnect");
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

            {/* Page Header */}
            <div className="mb-10">
            <h1 className="text-3xl font-extrabold text-gray-900">Settings</h1>
            <p className="mt-2 text-gray-500">
                Manage your account information and connected services.
            </p>
            </div>

            {/* Settings Card */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
            <form onSubmit={handleUpdate} className="space-y-6">
                {/* Name */}
                <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                </label>
                <input
                    type="text"
                    id="name"
                    ref={nameRef}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="
                    w-full px-4 py-2.5
                    border border-gray-300 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-orange-400
                    transition
                    "
                    required
                />
                </div>

                {/* Email */}
                <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                </label>
                <input
                    type="email"
                    id="email"
                    ref={emailRef}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="
                    w-full px-4 py-2.5
                    border border-gray-300 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-orange-400
                    transition
                    "
                    required
                />
                </div>

                {/* Password */}
                <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                </label>
                <input
                    type="password"
                    id="password"
                    value={password || ''}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    className="
                    w-full px-4 py-2.5
                    border border-gray-300 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-orange-400
                    transition
                    "
                />
                <p className="text-gray-400 text-sm mt-1">
                    Leave blank to keep current password
                </p>
                </div>

                {/* Primary Action */}
                <button
                type="submit"
                className="
                    w-full py-3 rounded-xl
                    bg-orange-500 text-white font-medium
                    hover:bg-orange-600
                    transition
                "
                >
                Update Settings
                </button>
            </form>
            </div>

            {/* Integrations */}
            <div className="mt-8 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Integrations
            </h2>
            <p className="text-sm text-gray-500 mb-4">
                Connect external services to enhance your workflow.
            </p>

            <button
                type="button"
                className="
                w-full py-3 rounded-xl
                bg-blue-500 text-white font-medium
                hover:bg-blue-600
                transition
                "
                onClick={async () => {
                await reconnectGoogleAccount();
                }}
            >
                Connect Google Account
            </button>
            </div>

            {/* Danger Zone */}
            <div className="mt-8 border border-red-200 bg-red-50 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-red-600 mb-1">
                Danger Zone
            </h2>
            <p className="text-sm text-red-500 mb-4">
                This action is permanent and cannot be undone.
            </p>

            <button
                type="button"
                className="
                w-full py-3 rounded-xl
                bg-red-500 text-white font-medium
                hover:bg-red-600
                transition
                "
                onClick={handleDelete}
            >
                Delete Account
            </button>
            </div>
        </div>
        );

};

export default Settings;
