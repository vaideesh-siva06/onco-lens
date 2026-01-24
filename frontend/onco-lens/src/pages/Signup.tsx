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
        axios.post("http://localhost:8000/auth/signup", { name, email, password })
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
                initial={{ opacity: 0, y: 40 }} // start transparent and below
                animate={{ opacity: 1, y: 0 }}  // fade in and move up
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Get Started</h2>
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Name */}
                    <div>
                        <label className="block text-gray-700 mb-1" htmlFor="name">Name</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your full name"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                            required
                        />
                    </div>

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
                        Sign Up
                    </button>
                </form>

                <p className="text-gray-500 text-sm mt-4 text-center">
                    Already have an account? <a href="/login" className="text-orange-500 hover:underline">Login</a>
                </p>
            </motion.div>
        </div>
    );
};

export default Signup;
