import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { io } from 'socket.io-client';

const socket = io("https://onco-lens-backend-hq5x.onrender.com");

const Login: React.FC = () => {

    const { login } = useAuth();
    const { getUserInfo } = useUser();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "OncoLens | Login";
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const user = await login(email, password); // { _id: "123" }

            // Navigate using returned ID, NOT localStorage
            getUserInfo(user._id);
            if (socket && socket.connected) {
                socket.emit("register_user", user._id);
            } else {
                socket.on("connect", () => {
                    socket.emit("register_user", user._id);
                });
            }
            localStorage.setItem('activePage', 'projects');
            localStorage.setItem('activeTab', 'Home');
            navigate(`/${user._id}/dashboard`);
        } catch (err) {
            toast.error("Incorrect email or password!");
        }
    };




    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 px-4">
            <ToastContainer
                position="top-center"
                autoClose={2000}
                hideProgressBar
                newestOnTop
                pauseOnHover
                theme="light"
                closeButton={false}
            />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="
                    w-full max-w-md
                    bg-white/90 backdrop-blur-md
                    border border-gray-200
                    rounded-2xl
                    shadow-xl shadow-gray-200/60
                    p-8
                "
            >
                {/* Header */}
                <div className="mb-6 text-center">
                    <h2 className="text-3xl font-extrabold text-gray-800">
                        Login
                    </h2>
                    <p className="text-gray-500 mt-1">
                        Sign in to continue to <span className="font-medium text-orange-500">OncoLens</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="
                                w-full px-4 py-2.5
                                border border-gray-300
                                rounded-lg
                                text-gray-800
                                focus:outline-none
                                focus:ring-2 focus:ring-orange-400
                                focus:border-orange-400
                                transition
                            "
                            required
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="
                                w-full px-4 py-2.5
                                border border-gray-300
                                rounded-lg
                                text-gray-800
                                focus:outline-none
                                focus:ring-2 focus:ring-orange-400
                                focus:border-orange-400
                                transition
                            "
                            required
                        />
                    </div>

                    {/* Submit */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="
                            w-full mt-4
                            bg-orange-500
                            text-white
                            py-2.5
                            rounded-xl
                            font-semibold
                            shadow-md shadow-orange-500/30
                            hover:bg-orange-600
                            hover:shadow-orange-500/40
                            transition-all
                            cursor-pointer
                        "
                    >
                        Login
                    </motion.button>
                </form>

                {/* Footer */}
                <p className="text-gray-500 text-sm mt-6 text-center">
                    Don&apos;t have an account?{' '}
                    <a
                        href="/get-started"
                        className="text-orange-500 font-medium hover:underline"
                    >
                        Get started
                    </a>
                </p>
            </motion.div>
        </div>
    );

};

export default Login;
