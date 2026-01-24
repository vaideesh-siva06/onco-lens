import React, { useEffect, useState, type ReactNode } from 'react';
import Sidebar from '../components/Sidebar';
import { useUser } from '../../context/UserContext';
import { ModalProvider, useModal } from '../../context/ModalContext';
import CreateProjectModal from '../components/CreateProjectModal';
import ProjectsComponents from '../components/ProjectsComponents';
import MeetingPage from '../pages/MeetingPage';
import OncoLensAIPage from './OncoLensAIPage';
import { ProjectsProvider, useProjects } from '../../context/ProjectsContext';
import CreateEventModal from '../components/CreateEventModal';

const DashboardContent: React.FC = () => {
    const { user, getUserInfo } = useUser();
    const { isOpen, closeProjectModal, editProject, isEditMode } = useModal();
    const [activePage, setActivePage] = useState<'projects' | 'meetings' | 'oncolensai'>(() => {
        // Initialize from localStorage if available
        const saved = localStorage.getItem('activePage') as
            | 'projects'
            | 'meetings'
            | 'oncolensai'
            | null;
        return saved || 'projects';
    });

    useEffect(() => {
        document.title = 'OncoLens | Dashboard';

        if (!user) {
            const storedId = localStorage.getItem('userId');
            if (storedId) getUserInfo(storedId);
        }

        console.log(user);
    }, [user, getUserInfo]);

    // Save activePage to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('activePage', activePage);
    }, [activePage]);


    return (
        <div className="flex w-full min-h-screen pt-16">
            {/* Sidebar */}
            <div className="hidden md:block w-64">
                <Sidebar setActivePage={setActivePage} activePage={activePage} />
            </div>

            {/* Main content */}
            <div className="flex-1 p-6 mt-20 md:mt-0">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">
                    Welcome {user?.name || user?.user?.name || '!'}!
                </h1>
                <ProjectsProvider>
                    {activePage === 'projects' && <ProjectsComponents />}
                    {activePage === 'meetings' && <MeetingPage />}
                    {activePage === 'oncolensai' && <OncoLensAIPage />}

                    <CreateProjectModal
                        isOpen={isOpen}
                        onClose={closeProjectModal}
                        editMode={isEditMode}
                        projectData={editProject}
                    />
                </ProjectsProvider>
            </div>

            {/* Mobile sidebar */}
            <div className="md:hidden mt-16">
                <Sidebar setActivePage={setActivePage} activePage={activePage} />
            </div>

        </div>
    );
};

const Dashboard: React.FC = () => (
    <ModalProvider>
        <DashboardContent />
        <CreateEventModal />
    </ModalProvider>
);

export default Dashboard;
