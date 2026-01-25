import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProjectPageSidebar from '../components/ProjectPageSidebar';
import MembersPage from './MembersPage';
import ChatPage from './ChatPage';
import ProjectSettingsPage from './ProjectSettingsPage';
import ProjectHomePage from './ProjectHomePage';
import { useUser } from '../../context/UserContext';
import OncoLensAIUpload from '../components/OncoLensAIUpload';

export interface Project {
    _id: string;
    name: string;
    description: string;
    focus?: string;
    status?: string;
    cancerTypes?: string[];
    teamEmails?: string[];
    adminEmail?: string;
}

const ProjectPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [activeTab, setActiveTab] = useState<string>('Home');
    const user = useUser();

    // Example page components
    const HomePage = () => <ProjectHomePage project={project} />;
    const CalendarPage = () => <div>Calendar Content</div>;
    const SettingsPage = () => <ProjectSettingsPage />
    const OncoLensAIPage = () => <OncoLensAIUpload />

    useEffect(() => {
        if (user.loading || !user.user || !project) return;
        // console.log(user.user?.email);
        // console.log(project?.adminEmail);
        if (project?.adminEmail !== user?.user?.email && !project?.teamEmails?.includes(user?.user?.email)) {
            navigate('/');
        }
    }, [user.user, user.loading, project]);

    useEffect(() => {
        document.title = `${project?.name} | OncoLens`;
    }, [project]);

    useEffect(() => {
        localStorage.setItem('activeTab', activeTab);
    }, [activeTab]);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const res = await axios.get(`http://localhost:8000/api/project/${id}`, { withCredentials: true });
                setProject(res.data);
            } catch (error) {
                // console.error('Failed to fetch project', error);
            }
        };

        if (id) fetchProject();
    }, [id]);

    if (!project) return <div>Loading...</div>;

    // Render the selected tab
    const renderTabContent = () => {
        switch (activeTab) {
            case 'Home': return <HomePage project={project} />;
            case 'Files': return <DataPage />;
            case 'Chat': return <ChatPage />;
            case 'Calendar': return <CalendarPage />;
            case 'Members': return <MembersPage />;
            case 'Settings': return <SettingsPage />;
            case 'OncoLens AI': return <OncoLensAIPage />;
            default: return <DataPage />;
        }
    };

    return (
        <div className="flex max-w-6xl mx-auto mt-20 gap-6">
            {/* Sidebar */}
            <div className="w-48">
                <ProjectPageSidebar active={activeTab} onSelect={setActiveTab} />
            </div>

            {/* Main content */}
            <div className="flex-1">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 px-4 py-2 text-orange-500 rounded-lg hover:bg-gray-300 transition"
                >
                    ← Back
                </button>

                {/* Project Header */}
                {/* <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
                <p className="text-gray-700 mb-4">{project.description}</p> */}

                {/* <div className="flex flex-wrap gap-2 mb-4">
                    {project.focus && (
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full">{project.focus}</span>
                    )}
                    {project.cancerTypes?.map(type => (
                        <span key={type} className="bg-green-100 text-green-800 px-2 py-1 rounded-full">{type}</span>
                    ))}
                    {project.status && (
                        <span className={`text-sm px-2 py-1 rounded-full ${project.status === 'Planning' ? 'bg-gray-200 text-gray-800' :
                            project.status === 'Ongoing' ? 'bg-blue-100 text-blue-800' :
                                project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                    'bg-purple-100 text-purple-800'
                            }`}>
                            {project.status}
                        </span>
                    )}
                </div> */}

                {/* Selected Tab Content */}
                <div className="mt-6">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

export default ProjectPage;
