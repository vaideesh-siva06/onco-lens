import { motion } from 'framer-motion';
import React from 'react';
import { Link as ScrollLink } from 'react-scroll';
import { FaArrowDown, FaPlay } from 'react-icons/fa';
import { Link } from 'react-router';
import { LuBookOpen, LuGlobe, LuZap } from 'react-icons/lu';

const HeroSection: React.FC = () => {
    return (
        <section className="header relative w-screen h-screen flex flex-col items-center justify-center overflow-hidden">

            {/* Animated background */}
            <div className="wavy-bg absolute inset-0 -z-10"></div>

            {/* Floating gradient orbs */}
            <div className="absolute inset-0 -z-5 overflow-hidden">
                <motion.div
                    className="absolute top-20 left-10 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl"
                    animate={{
                        x: [0, 50, 0],
                        y: [0, 30, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-500/15 rounded-full blur-3xl"
                    animate={{
                        x: [0, -40, 0],
                        y: [0, -50, 0],
                        scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-400/10 rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.15, 1],
                        rotate: [0, 180, 360]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
            </div>

            {/* Centered Hero Content */}
            <motion.div
                className="text-center px-4 md:px-16 z-10 max-w-5xl"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
            >
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-8"
                >
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-white/90 text-sm font-medium">Advancing Oncology Research</span>
                </motion.div>

                <motion.h1
                    className="text-6xl md:text-8xl font-extrabold text-white tracking-tight"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                >
                    Onco<span className="text-transparent bg-clip-text bg-linear-to-r from-orange-300 to-yellow-200">Lens</span>
                </motion.h1>

                <motion.p
                    className="mt-6 text-xl md:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                >
                    Empowering cancer researchers with <span className="text-white font-semibold">intelligent tools</span> to accelerate discovery and improve oncological outcomes.
                </motion.p>

                <motion.div
                    className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.8 }}
                >
                    <Link to="/get-started">
                        <motion.button
                            className="group relative px-8 py-4 bg-white text-orange-600 font-semibold rounded-xl overflow-hidden shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 text-lg"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                Get Started
                                <FaPlay className="text-sm group-hover:translate-x-1 transition-transform" />
                            </span>
                            <div className="absolute inset-0 bg-linear-to-r from-orange-100 to-yellow-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </motion.button>
                    </Link>

                    <Link to="/login">
                        <motion.button
                            className="group px-8 py-4 bg-transparent text-white font-semibold rounded-xl border-2 border-white/30 hover:border-white/60 hover:bg-white/10 backdrop-blur-sm transition-all duration-300 text-lg"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Login
                        </motion.button>
                    </Link>
                </motion.div>

                {/* Mission Blocks */}
                <motion.div
                    className="mt-16 flex flex-wrap justify-center gap-10 md:gap-16"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.8 }}
                >
                    {[
                        {
                            icon: <LuGlobe className="text-white text-3xl" />,
                            title: "Empower Discovery",
                            desc: "We help teams uncover insights that move the world forward."
                        },
                        {
                            icon: <LuZap className="text-white text-3xl" />,
                            title: "Accelerate Innovation",
                            desc: "Tools designed to speed up research and decision-making."
                        },
                        {
                            icon: <LuBookOpen className="text-white text-3xl" />,
                            title: "Expand Knowledge",
                            desc: "Making advanced forecasting and understanding accessible to all."
                        },
                    ].map((item, i) => (
                        <div
                            key={i}
                            className="text-center max-w-60 px-6 py-5 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
                        >
                            <div className="mb-3 flex justify-center">{item.icon}</div>
                            <div className="text-lg md:text-xl font-semibold text-white">
                                {item.title}
                            </div>
                            <div className="text-white/60 text-sm mt-2 leading-relaxed">
                                {item.desc}
                            </div>
                        </div>
                    ))}
                </motion.div>


                {/* Scroll Down Arrow */}
                <ScrollLink
                    to="features"
                    smooth={true}
                    duration={1000}
                    className="cursor-pointer inline-block mt-16"
                >
                    <motion.div
                        className="flex flex-col items-center gap-2 text-white/50 hover:text-white transition-colors"
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <span className="text-xs uppercase tracking-widest">Scroll</span>
                        <FaArrowDown className="text-xl" />
                    </motion.div>
                </ScrollLink>
            </motion.div>
        </section>
    );
};

export default HeroSection;