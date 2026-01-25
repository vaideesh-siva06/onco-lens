import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LuTriangleAlert, LuRocket } from "react-icons/lu";

const ProblemSolutionSection = () => {
    return (
        <section className="relative w-full py-32 overflow-hidden">

            {/* Background (same as Hero) */}
            <div className="wavy-bg absolute inset-0 -z-10"></div>

            {/* Floating gradient orbs */}
            <div className="absolute inset-0 -z-5 overflow-hidden">
                <motion.div
                    className="absolute top-10 left-10 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl"
                    animate={{ x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute bottom-10 right-10 w-96 h-96 bg-yellow-500/15 rounded-full blur-3xl"
                    animate={{ x: [0, -40, 0], y: [0, -35, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-orange-400/10 rounded-full blur-3xl"
                    animate={{ scale: [1, 1.15, 1], rotate: [0, 180, 360] }}
                    transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
                />
            </div>

            <div className="max-w-6xl mx-auto px-6 text-center relative z-10">

                {/* Heading */}
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-4xl md:text-5xl font-extrabold text-white"
                >
                    From Chaos to Clarity
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="text-white/70 max-w-2xl mx-auto mt-4 text-lg"
                >
                    A clear look at the real challenges teams face — and how our platform solves them
                    with speed, intelligence, and seamless collaboration.
                </motion.p>

                {/* Grid */}
                <div className="mt-20 grid md:grid-cols-2 gap-12">

                    {/* PROBLEM */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="px-8 py-10 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <LuTriangleAlert className="text-white text-4xl" />
                            <h3 className="text-2xl font-semibold text-white">The Problem</h3>
                        </div>

                        <p className="text-white/60 leading-relaxed">
                            Research teams often struggle with fragmented data, slow tools,
                            and disconnected systems that stall discovery and create friction.
                        </p>

                        <ul className="mt-6 space-y-3 text-white/70 text-sm">
                            <li>• Insights scattered across multiple platforms</li>
                            <li>• Slow, manual workflows limiting progress</li>
                            <li>• Tools not designed for modern collaboration</li>
                        </ul>
                    </motion.div>

                    {/* SOLUTION */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="px-8 py-10 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <LuRocket className="text-white text-4xl" />
                            <h3 className="text-2xl font-semibold text-white">Our Solution</h3>
                        </div>

                        <p className="text-white/70 leading-relaxed">
                            A unified research intelligence platform that accelerates
                            discovery, centralizes data, and empowers teams with real-time,
                            actionable insights.
                        </p>

                        <ul className="mt-6 space-y-3 text-white/80 text-sm">
                            <li>• All research tools in one intelligent system</li>
                            <li>• Fast, automated insight generation</li>
                            <li>• Built for seamless teamwork and clarity</li>
                        </ul>
                    </motion.div>

                </div>

                {/* Bottom CTA */}
                <motion.div
                    className="mt-20 text-center"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                >
                    <p className="text-white/60 mb-4 text-lg">Ready to transform your research?</p>

                    <Link to="/get-started">
                        <motion.button
                            className="group relative px-10 py-4 bg-white text-orange-600 font-semibold rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition duration-300 overflow-hidden cursor-pointer"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span className="relative z-10">Get Started for Free</span>
                            <div className="absolute inset-0 bg-linear-to-r from-orange-100 to-yellow-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </motion.button>
                    </Link>
                </motion.div>

            </div>
        </section>
    );
};

export default ProblemSolutionSection;
