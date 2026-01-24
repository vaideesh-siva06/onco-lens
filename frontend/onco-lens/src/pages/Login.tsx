import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { io } from 'socket.io-client';

const socket = io("http://localhost:8000");

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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <ToastContainer
                position="top-center" // can be top-left, top-center, bottom-right, etc.
                autoClose={2000} // milliseconds
                hideProgressBar={true}
                newestOnTop={true}
                pauseOnHover
                theme="light"
                closeButton={false}
            />
            <motion.div
                className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Login</h2>
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Email */}
                    <div>
                        <label className="block text-gray-700 mb-1" htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-gray-700 mb-1" htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="********"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full mt-4 bg-orange-500 text-white py-2 rounded-md font-semibold hover:bg-orange-600 transition cursor-pointer"
                    >
                        Login
                    </button>
                </form>

                <p className="text-gray-500 text-sm mt-4 text-center">
                    Don't have an account? <a href="/get-started" className="text-orange-500 hover:underline">Sign Up</a>
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
