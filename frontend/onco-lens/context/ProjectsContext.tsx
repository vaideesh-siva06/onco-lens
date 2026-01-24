import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import axios from "axios";
import { useUser } from "./UserContext";
import { useLocation, useNavigate } from "react-router-dom";

export interface Project {
    _id: string;
    name: string;
    description: string;
    adminId: string; // Always a string ID
    adminEmail: string;
    teamEmails: string[];
    focus?: string;
    status?: string;
    cancerTypes?: string[];
    adminName?: string;
}

export interface Meeting {
    _id: string;
    name: string;
    date: string;
    invitees: string[];
    userId: string;
    link?: string;
    status?: string;
    admin?: string;
    adminEmail?: string;
}

interface ProjectsContextType {
    projects: Project[];
    meetings: Meeting[];
    loading: boolean;
    addProject: (project: Project) => void;
    fetchProjects: () => Promise<Project[]>;
    deleteProject: (projectId: string) => void;
    createMeeting: (meeting: Omit<Meeting, "_id" | "userId">) => Promise<Meeting | undefined>;
    fetchMeetings: () => Promise<Meeting[]>;
    addParticipantToMeeting: (meetingId: string, email: string) => Promise<Meeting | undefined>;
    deleteParticipantFromMeeting: (meetingId: string, email: string) => Promise<Meeting | undefined>;
    deleteMeeting: (meetingId: string) => Promise<Meeting | undefined>;
    setProjects: (projects: Project[]) => void;
    updateProject: (projectId: string, projectData: Partial<Project>) => Promise<void>;
    leaveProject: (projectId: string) => Promise<Project | undefined>;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export const useProjects = () => {
    const context = useContext(ProjectsContext);
    if (!context) throw new Error("useProjects must be used within ProjectsProvider");
    return context;
};

// Helper function to normalize project data
const normalizeProject = (project: any): Project => {
    return {
        ...project,
        adminId: typeof project.adminId === 'object' ? project.adminId._id : project.adminId
    };
};

export const ProjectsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useUser();
    const [projects, setProjects] = useState<Project[]>([]);
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Projects
    const fetchProjects = async () => {
        if (!user?._id) return;
        setLoading(true);
        console.log(user._id);
        try {
            console.log(user._id);
            const res = await axios.get(`http://localhost:8000/api/projects/`, {
                params: { userId: user._id, email: user.email },
                withCredentials: true,
            });

            console.log(res.data);

            // Normalize all projects
            const normalizedProjects = res.data.map(normalizeProject);
            console.log('Fetched projects:', normalizedProjects);
            setProjects(normalizedProjects);
            return normalizedProjects;
        } catch (err) {
            console.error(err);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const addProject = (project: Project) => {
        const normalized = normalizeProject(project);
        setProjects(prev => [normalized, ...prev]);
        console.log('Project added:', normalized);
    }

    const updateProject = async (projectId: string, projectData: Partial<Project>) => {
        if (!user?._id) return;
        try {
            const res = await axios.put(
                `http://localhost:8000/api/project/${projectId}`,
                {
                    ...projectData,
                    userId: user._id
                },
                { withCredentials: true }
            );

            if (res.status === 200) {
                const normalized = normalizeProject(res.data.project);
                setProjects(prev => prev.map(p =>
                    p._id === projectId ? normalized : p
                ));
                console.log("UPDATED NORMALIZED:", normalized);
            }
        } catch (err) {
            console.error('Edit error:', err);
            throw err;
        }
    }

    const deleteProject = async (projectId: string) => {
        if (!user?._id) return;
        try {
            const res = await axios.delete(`http://localhost:8000/api/project/${projectId}`, {
                data: { id: projectId, userId: user._id, userEmail: user.email },
                withCredentials: true,
            });
            if (res.status === 200) {
                setProjects(prev => prev.filter(p => p._id !== projectId));
                console.log('Project deleted:', projectId);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Meetings
    const fetchMeetings = async (): Promise<Meeting[]> => {
        if (!user?._id) return [];
        try {
            const res = await axios.get(`http://localhost:8000/api/meetings/${user._id}?email=${user.email}`, {
                withCredentials: true,
            });
            setMeetings(res.data);
            return res.data;
        } catch (err) {
            console.error(err);
            return [];
        }
    };

    const createMeeting = async (meeting: Omit<Meeting, "_id" | "userId">): Promise<Meeting | undefined> => {
        if (!user?._id) return;
        try {
            const res = await axios.post(`http://localhost:8000/api/meeting/create`, {
                ...meeting,
                userId: user._id,
                userEmail: user.email,
            }, { withCredentials: true });

            const createdMeeting: Meeting = res.data;
            setMeetings(prev => [createdMeeting, ...prev]);
            return createdMeeting;
        } catch (err) {
            console.error(err);
        }
    };

    const addParticipantToMeeting = async (meetingId: string, email: string): Promise<Meeting | undefined> => {
        if (!user?._id) return;
        try {
            const res = await axios.put(`http://localhost:8000/api/meeting/${meetingId}/add-participant`,
                { meetingId, email },
                { withCredentials: true }
            );
            const updatedMeeting: Meeting = res.data.meeting || res.data;
            setMeetings(prev => prev.map(m => (m._id === meetingId ? { ...m, ...updatedMeeting } : m)));
            return updatedMeeting;
        } catch (err) {
            console.error(err);
            return undefined;
        }
    };

    const deleteParticipantFromMeeting = async (meetingId: string, email: string): Promise<Meeting | undefined> => {
        if (!user?._id) return;
        try {
            const res = await axios.put(`http://localhost:8000/api/meeting/${meetingId}/remove-participant`,
                { meetingId, email },
                { withCredentials: true }
            );
            const updatedMeeting: Meeting = res.data.meeting || res.data;
            setMeetings(prev => prev.map(m => (m._id === meetingId ? { ...m, ...updatedMeeting } : m)));
            return updatedMeeting;
        } catch (err) {
            console.error(err);
            return undefined;
        }
    };

    // leaveProject.ts
    const leaveProject = async (projectId: string, userId: string, userEmail: string) => {
    try {

        console.log(userEmail);

        const res = await axios.delete(
            `http://localhost:8000/api/project/${projectId}/member`,
            {
                withCredentials: true,
                data: {
                    email: userEmail,
                    currUserId: userId,
                    projectId,
                },
                headers: {
                'Content-Type': 'application/json'
                }
            }
        );

        window.location.reload();

        console.log("leaveProject response:", res.data);
        return res.data; // caller can handle success/failure
    } catch (err: any) {
        console.error("leaveProject error:", err.response?.data || err.message);
        throw err; // propagate error
    }
    };



    const deleteMeeting = async (meetingId: string) => {
        if (!user?._id) return;
        try {
            const res = await axios.delete(`http://localhost:8000/api/meeting/${meetingId}/delete`, {
                withCredentials: true,
                data: { meetingId }
            });
            const updatedMeeting: Meeting = res.data.meeting || res.data;
            setMeetings(prev => prev.map(m => (m._id === meetingId ? { ...m, ...updatedMeeting } : m)));
            return updatedMeeting;
        } catch (err) {
            console.error(err);
            return undefined;
        }
    };

    // // Fetch projects when user loads
    // useEffect(() => {
    //     window.location.reload();
    //     console.log(location.pathname);
    // }, []);

    useEffect(() => {
        if (user?._id) {
            fetchProjects();
        }
    }, [user]);


    return (
        <ProjectsContext.Provider
            value={{
                projects,
                meetings,
                loading,
                setProjects,
                addProject,
                updateProject,
                fetchProjects,
                deleteProject,
                createMeeting,
                fetchMeetings,
                addParticipantToMeeting,
                deleteParticipantFromMeeting,
                deleteMeeting,
                leaveProject
            }}
        >
            {children}
        </ProjectsContext.Provider>
    );
};