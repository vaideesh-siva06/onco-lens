import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiSettings } from 'react-icons/fi';
import { FaSignOutAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Navbar: React.FC = () => {
  // const isAuthenticated = useState(Boolean(localStorage.getItem('token')));
  const { isAuthenticated } = useAuth();
  const userId = localStorage.getItem('userId');
  const { logout } = useAuth();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="
        fixed top-0 left-0 w-full z-50
        bg-white/85 backdrop-blur-md
        border-b border-gray-200
      "
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-bold text-orange-500 tracking-tight"
        >
          OncoLens
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
                <>
                    <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                    <Link
                        to={`/${userId}/settings`}
                        className="
                        w-10 h-10
                        flex items-center justify-center
                        rounded-full
                        bg-orange-500 text-white
                        hover:bg-orange-600
                        transition-colors
                        "
                    >
                        <FiSettings size={18} />
                    </Link>
                    </motion.div>

                    <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={logout}
                    className="
                        w-10 h-10
                        flex items-center justify-center
                        rounded-full
                        bg-orange-500 text-white
                        hover:bg-orange-600
                        transition-colors
                    "
                    >
                    <FaSignOutAlt size={18} />
                    </motion.button>
                </>
                ) : (

            <>
              {/* Get Started – primary */}
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/get-started"
                  className="
                    px-5 py-2.5 rounded-xl
                    bg-orange-500 text-white font-medium
                    shadow-sm shadow-orange-500/30
                    hover:bg-orange-600 hover:shadow-orange-500/40
                    transition-all duration-300
                  "
                >
                  Get Started
                </Link>
              </motion.div>

              {/* Login – secondary */}
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/login"
                  className="
                    px-5 py-2.5 rounded-xl
                    border border-gray-300
                    text-gray-800 font-medium
                    hover:border-orange-500
                    hover:text-orange-600
                    hover:bg-orange-50
                    transition-all duration-300
                  "
                >
                  Login
                </Link>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
