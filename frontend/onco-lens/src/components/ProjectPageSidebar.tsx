// components/ProjectPageSidebar.tsx
import React from 'react';
import { FaUsers, FaComments, FaCog, FaBrain, FaHome, FaFile } from 'react-icons/fa';
import { useUser } from '../../context/UserContext';
import { useProjects } from '../../context/ProjectsContext';

interface ProjectPageSidebarProps {
    active?: string; // optional, can highlight current tab
    onSelect?: (item: string) => void; // optional click handler
}

const ITEMS = [
    { label: 'Home', icon: <FaHome /> },
    { label: 'Chat', icon: <FaComments /> },
    { label: 'Members', icon: <FaUsers /> },
    { label: 'OncoLens AI', icon: <FaBrain /> },
    { label: 'Settings', icon: <FaCog /> },
];

const ProjectPageSidebar: React.FC<ProjectPageSidebarProps> = ({ active, onSelect }) => {

    return (
        <div className="w-48 bg-white rounded-xl p-4 flex flex-col gap-4 h-screen">
            {ITEMS.map(item => (
                <button
                    key={item.label}
                    onClick={() => onSelect?.(item.label)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-orange-50 transition ${active === item.label ? 'bg-orange-100 font-semibold text-orange-700' : ''
                        }`}
                >

                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                </button>
            ))}
        </div>
    );
};

export default ProjectPageSidebar;
