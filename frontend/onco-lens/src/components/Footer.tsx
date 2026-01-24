import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="w-full bg-white/20 backdrop-blur-md border-t border-orange-500 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col md:flex-row justify-between items-center md:items-start space-y-8 md:space-y-0 md:space-x-8">

                    {/* Left: Project Info */}
                    <div className="flex flex-col items-center md:items-start">
                        <h2 className="text-2xl font-bold text-orange-500 mb-2">OncoLens</h2>
                        <p className="text-gray-700 max-w-sm text-center md:text-left">
                            Empowering researchers with intelligent tools to accelerate discovery and improve oncological outcomes.
                        </p>
                    </div>
                </div>

                {/* Bottom copyright */}
                <div className="mt-8 border-t border-gray-300 pt-4 text-center text-gray-400 text-sm">
                    &copy; {new Date().getFullYear()} OncoLens. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
