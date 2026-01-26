import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LuTriangleAlert, LuRocket } from "react-icons/lu";

const ProblemSolutionSection = () => {
  return (
    <section className="relative w-full min-h-screen flex flex-col justify-center overflow-hidden bg-orange-400">

      {/* Floating Gradient Orbs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute top-10 left-10 w-72 h-72 bg-orange-400/20 rounded-full blur-3xl"
          animate={{ x: [0, 35, 0], y: [0, 25, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-96 h-96 bg-yellow-400/15 rounded-full blur-3xl"
          animate={{ x: [0, -35, 0], y: [0, -25, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-orange-400/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.15, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Header */}
      <motion.div
        className="text-center px-6 md:px-0 max-w-4xl mx-auto relative z-10"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
          From Chaos to{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-200 to-yellow-100">
            Clarity
          </span>
        </h2>
        <p className="text-white/70 max-w-2xl mx-auto mt-6 text-lg md:text-xl leading-relaxed">
          A clear look at the real challenges research teams face — and how our platform solves them with speed, intelligence, and seamless collaboration.
        </p>
      </motion.div>

      {/* Cards */}
      <div className="mt-20 max-w-6xl mx-auto grid md:grid-cols-2 gap-10 px-6 relative z-10">
        
        {/* Problem Card */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="group relative px-8 py-12 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 rounded-xl bg-red-500/30">
              <LuTriangleAlert className="text-white text-4xl" />
            </div>
            <h3 className="text-2xl font-semibold text-white">The Problem</h3>
          </div>
          <p className="text-white/70 leading-relaxed">
            Research teams often struggle with fragmented data, slow tools, and disconnected systems that stall discovery.
          </p>
          <ul className="mt-6 space-y-2 text-white/60 text-sm">
            <li>• Insights scattered across multiple platforms</li>
            <li>• Slow, manual workflows limiting progress</li>
            <li>• Tools not designed for modern collaboration</li>
          </ul>
        </motion.div>

        {/* Solution Card */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative px-8 py-12 rounded-3xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 rounded-xl bg-linear-to-r from-orange-400 to-yellow-300">
              <LuRocket className="text-white text-4xl" />
            </div>
            <h3 className="text-2xl font-semibold text-white">Our Solution</h3>
          </div>
          <p className="text-white/70 leading-relaxed">
            A unified research intelligence platform that accelerates discovery, centralizes data, and empowers teams with real-time, actionable insights.
          </p>
          <ul className="mt-6 space-y-2 text-white/60 text-sm">
            <li>• All research tools in one intelligent system</li>
            <li>• Fast, automated insight generation</li>
            <li>• Built for seamless teamwork and clarity</li>
          </ul>
        </motion.div>

      </div>

      {/* CTA */}
      <motion.div
        className="mt-24 text-center relative z-10"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        <p className="text-white/60 mb-4 text-lg">Ready to transform your research?</p>
        <Link to="/get-started">
          <motion.button
            className="group relative px-10 py-4 bg-white text-orange-600 font-semibold rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition duration-300 overflow-hidden cursor-pointer"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="relative z-10">Get Started for Free</span>
            <div className="absolute inset-0 bg-linear-to-r from-orange-100 to-yellow-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
          </motion.button>
        </Link>
      </motion.div>

    </section>
  );
};

export default ProblemSolutionSection;
