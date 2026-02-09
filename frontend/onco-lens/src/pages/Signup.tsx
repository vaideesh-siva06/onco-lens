import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Signup: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        document.title = "OncoLens | Sign Up";
    }, []);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        axios.post("https://onco-lens-backend-hq5x.onrender.com/auth/signup", { name, email, password })
            .then(res => {
                console.log(res.data);
                toast.success("Successfully signed up!");
            })
            .catch(err => {
                console.log(err);
                toast.error("User already exists!");
            })
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
                        Get started
                    </h2>
                    <p className="text-gray-500 mt-1">
                        Create your <span className="font-medium text-orange-500">OncoLens</span> account
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your full name"
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
                        Sign Up
                    </motion.button>
                </form>

                {/* Footer */}
                <p className="text-gray-500 text-sm mt-6 text-center">
                    Already have an account?{' '}
                    <a
                        href="/login"
                        className="text-orange-500 font-medium hover:underline"
                    >
                        Login
                    </a>
                </p>
            </motion.div>
        </div>
    );

};

export default Signup;
