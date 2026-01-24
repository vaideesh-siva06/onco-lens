import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiSettings } from 'react-icons/fi';
import { FaSignOutAlt } from 'react-icons/fa';

const Navbar: React.FC = () => {
    const isAuthenticated = Boolean(localStorage.getItem('token'));
    const userId = localStorage.getItem('userId');
    const { logout } = useAuth();

    return (
        <nav className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-200 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                {/* Logo */}
                <Link to="/" className="text-2xl font-bold text-orange-500">
                    OncoLens
                </Link>

                {/* Right Buttons */}
                <div className="flex items-center space-x-3">
                    {isAuthenticated ? (
                        <>
                            <Link
                                to={`/${userId}/settings`}
                                className="p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition"
                            >
                                <FiSettings size={20} />
                            </Link>
                            <button
                                onClick={logout}
                                className="p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition"
                            >
                                <FaSignOutAlt size={20} />
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/get-started"
                                className="px-3 py-3 bg-orange-500 text-white hover:bg-orange-600 transition rounded-xl"
                            >
                                Get Started
                            </Link>
                            <Link
                                to="/login"
                                className="px-3 py-3 border border-black text-black hover:border-none hover:bg-orange-500 rounded-xl hover:text-white transition"
                            >
                                Login
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
