import { FaBrain, FaCalendarAlt, FaFolderOpen, FaPlus, FaUsers, FaBars, FaTimes } from "react-icons/fa";
import { useUser } from "../../context/UserContext";
import { useState } from "react";
import { useModal } from "../../context/ModalContext";

interface SidebarProps {
    setActivePage: (page: 'projects' | 'meetings' | 'oncolensai') => void;
    activePage: 'projects' | 'meetings' | 'oncolensai';
}

const Sidebar: React.FC<SidebarProps> = ({ setActivePage, activePage }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useUser();
    const { openProjectModal } = useModal();

    const toggleSidebar = () => setIsOpen(!isOpen);

    const handleNavClick = (page: 'projects' | 'meetings' | 'calendar' | 'oncolensai') => {
        setActivePage(page);
        setIsOpen(false); // Close sidebar on mobile after selection
    };

    const handleCreateProject = () => {
        openProjectModal();
        setIsOpen(false); // Close sidebar on mobile after action
    };

    return (
        <>
            {/* Mobile Toggle Button - Fixed at top left */}
            <button
                onClick={toggleSidebar}
                className="fixed top-20 left-4 z-50 md:hidden bg-orange-500 text-white p-3 rounded-full shadow-lg hover:bg-orange-600 transition"
                aria-label="Toggle sidebar"
            >
                {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>

            {/* Sidebar */}
            <div
                className={`fixed left-0 w-128 md:w-64 bg-white border-r border-gray-200 z-40 overflow-y-auto transform transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                    md:translate-x-0 md:static md:flex md:flex-col md:h-screen
                    top-16 h-[calc(100vh-4rem)]
                    md:top-28 md:h-[calc(100vh-4rem)]`}
            >
                <div className="flex flex-col flex-1 px-4 pt-6 md:pt-8 mt-16">
                    {/* Mobile Header */}
                    <div className="flex items-center justify-between mb-6 md:hidden">
                        <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>
                    </div>

                    {/* Desktop Header */}
                    <h2 className="text-xl font-bold text-gray-800 mb-6 hidden md:block">Dashboard</h2>

                    <nav className="flex flex-col space-y-2 flex-1">
                        <button
                            onClick={handleCreateProject}
                            className="flex items-center px-4 py-3 md:py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition cursor-pointer"
                        >
                            <FaPlus className="mr-3" /> Create Project
                        </button>

                        <button
                            className={`flex items-center px-4 py-3 md:py-2 rounded-md font-medium text-gray-700 hover:bg-orange-100 hover:text-orange-500 transition ${activePage === 'projects' ? 'bg-orange-100 text-orange-500' : ''}`}
                            onClick={() => handleNavClick('projects')}
                        >
                            <FaFolderOpen className="mr-3" /> Projects
                        </button>

                        <button
                            className={`flex items-center px-4 py-3 md:py-2 rounded-md font-medium text-gray-700 hover:bg-orange-100 hover:text-orange-500 transition ${activePage === 'meetings' ? 'bg-orange-100 text-orange-500' : ''}`}
                            onClick={() => handleNavClick('meetings')}
                        >
                            <FaUsers className="mr-3" /> Meetings
                        </button>

                        <button
                            className={`flex items-center px-4 py-3 md:py-2 rounded-md font-medium text-gray-700 hover:bg-orange-100 hover:text-orange-500 transition ${activePage === 'oncolensai' ? 'bg-orange-100 text-orange-500' : ''}`}
                            onClick={() => handleNavClick('oncolensai')}
                        >
                            <FaBrain className="mr-3" /> OncoLens AI
                        </button>
                    </nav>

                    {/* User info at bottom for mobile */}
                    {user && (
                        <div className="mt-auto pb-6 pt-4 border-t border-gray-200 md:hidden">
                            <div className="flex items-center px-4 py-2">
                                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                                    {user.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-800">{user.name || 'User'}</p>
                                    <p className="text-xs text-gray-500">{user.email || ''}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity duration-300"
                    onClick={toggleSidebar}
                />
            )}
        </>
    );
};

export default Sidebar;