import React from 'react';
import { motion } from 'framer-motion';
import { FaBrain, FaUsers, FaDatabase } from 'react-icons/fa';

type Feature = {
    title: string;
    description: string;
    icon: React.ReactNode;
    gradient: string;
};

const featuresData: Feature[] = [
  {
    title: 'AI Model Predictions',
    description:
      'Run advanced machine learning models to analyze oncology data, predict patient outcomes, and evaluate treatment responses with clinically meaningful insights.',
    icon: <FaBrain className="text-3xl" />,
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    title: 'Research Collaboration',
    description:
      'Create research projects, collaborate with team members in real time, discuss findings via integrated chat, and keep everyone aligned across institutions.',
    icon: <FaUsers className="text-3xl" />,
    gradient: 'from-amber-500 to-yellow-500',
  },
  {
    title: 'Centralized Data & Documents',
    description:
      'Securely manage oncology datasets, research documents, and reports with seamless Google Drive integration and structured access control.',
    icon: <FaDatabase className="text-3xl" />,
    gradient: 'from-yellow-500 to-orange-400',
  },
];


const FeaturesSection: React.FC = () => {
    return (
        <section id="features" className="features relative w-screen min-h-screen flex flex-col items-center justify-center py-24 overflow-hidden bg-linear-to-b from-gray-50 to-white">

            {/* Background decorations */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-b from-orange-50/50 to-transparent"></div>
                <div className="absolute top-40 right-0 w-72 h-72 bg-orange-100/40 rounded-full blur-3xl"></div>
                <div className="absolute bottom-40 left-0 w-96 h-96 bg-yellow-100/30 rounded-full blur-3xl"></div>

                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.02]" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, gray 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }}></div>
            </div>

            {/* Section Header */}
            <motion.div
                className="text-center px-4 md:px-16 z-10 max-w-4xl"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
            >
                <motion.span
                    className="inline-block px-4 py-1.5 bg-orange-100 text-orange-600 text-sm font-semibold rounded-full mb-6"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                >
                    Features
                </motion.span>

                <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
                    Everything you need to
                    <motion.span
                        className="
                            inline-block
                            text-transparent
                            bg-clip-text
                            bg-linear-to-r
                            from-orange-600
                            via-amber-400
                            to-orange-600
                            bg-size-[200%_100%]
                        "
                        animate={{
                            backgroundPositionX: ['0%', '200%'],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                        >
                        accelerate research
                    </motion.span>

                </h2>

                <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    Powerful tools designed specifically for oncology researchers to streamline workflows and drive breakthrough discoveries.
                </p>
            </motion.div>

            {/* Features Grid */}
            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 px-4 md:px-20 z-10 max-w-7xl">
                {featuresData.map((feature, index) => (
                    <motion.div
                        key={index}
                        className="group relative"
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6, delay: index * 0.15, ease: 'easeOut' }}
                    >
                        <div className="relative bg-white rounded-3xl p-8 h-full border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-orange-100/50 transition-all duration-500 overflow-hidden">

                            {/* Hover gradient background */}
                            <div className={`absolute inset-0 bg-linear-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`}></div>

                            {/* Icon container */}
                            <div className={`relative w-16 h-16 rounded-2xl bg-linear-to-br ${feature.gradient} flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                                {feature.icon}
                            </div>

                            {/* Content */}
                            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors duration-300">
                                {feature.title}
                            </h3>

                            <p className="text-gray-600 leading-relaxed">
                                {feature.description}
                            </p>

                            {/* Corner decoration */}
                            <div className={`absolute -bottom-20 -right-20 w-40 h-40 bg-linear-to-br ${feature.gradient} rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-2xl`}></div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default FeaturesSection;