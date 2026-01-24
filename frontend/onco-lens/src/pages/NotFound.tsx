import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
            <p className="text-xl text-gray-600 mb-6">Page not found</p>
            <Link
                to="/"
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
                Go Home
            </Link>
        </div>
    );
};

export default NotFound;
