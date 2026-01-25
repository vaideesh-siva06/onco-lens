import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import axios from "axios";
import { useUser } from "./UserContext";

// ------------------ Types ------------------

export interface Project {
    _id: string;
    name: string;
    description: string;
    adminId: string;
    adminEmail: string;
    teamEmails: string[];
    focus?: string;
    status?: string;
    cancerTypes?: string[];
    adminName?: string;
    adminIsOnline?: boolean;
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

// ------------------ Context Type ------------------

export interface ProjectsContextType {
    projects: Project[];
    meetings: Meeting[];
    loading: boolean;
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    addProject: (project: Project) => void;
    updateProject: (projectId: string, projectData: Partial<Project>) => Promise<void>;
    fetchProjects: () => Promise<Project[]>;
    deleteProject: (projectId: string) => Promise<void>;
    createMeeting: (meeting: Omit<Meeting, "_id" | "userId">) => Promise<Meeting | undefined>;
    fetchMeetings: () => Promise<Meeting[]>;
    addParticipantToMeeting: (meetingId: string, email: string) => Promise<Meeting | undefined>;
    deleteParticipantFromMeeting: (meetingId: string, email: string) => Promise<Meeting | undefined>;
    deleteMeeting: (meetingId: string) => Promise<Meeting | undefined>;
    leaveProject: (projectId: string) => Promise<Project | undefined>;
}

// ------------------ Context ------------------

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export const useProjects = () => {
    const context = useContext(ProjectsContext);
    if (!context) throw new Error("useProjects must be used within ProjectsProvider");
    return context;
};

// ------------------ Provider ------------------

interface ProjectsProviderProps {
    children: ReactNode;
}

export const ProjectsProvider: React.FC<ProjectsProviderProps> = ({ children }) => {
    const { user } = useUser();

    const [projects, setProjects] = useState<Project[]>([]);
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);

    // ------------------ Helper ------------------
    const normalizeProject = (project: any): Project => ({
        ...project,
        adminId: typeof project.adminId === "object" ? project.adminId._id : project.adminId,
    });

    // ------------------ Projects ------------------
    const fetchProjects = async (): Promise<Project[]> => {
        if (!user?._id) return [];
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:8000/api/projects/`, {
                params: { userId: user._id, email: user.email },
                withCredentials: true,
            });
            const normalized = res.data.map(normalizeProject);
            setProjects(normalized);
            return normalized;
        } catch {
            return [];
        } finally {
            setLoading(false);
        }
    };

    const addProject = (project: Project) => {
        setProjects(prev => [normalizeProject(project), ...prev]);
    };

    const updateProject = async (projectId: string, projectData: Partial<Project>) => {
        if (!user?._id) return;
        const res = await axios.put(
            `http://localhost:8000/api/project/${projectId}`,
            { ...projectData, userId: user._id },
            { withCredentials: true }
        );
        if (res.status === 200) {
            const normalized = normalizeProject(res.data.project);
            setProjects(prev => prev.map(p => (p._id === projectId ? normalized : p)));
        }
    };

    const deleteProject = async (projectId: string) => {
        if (!user?._id) return;
        const res = await axios.delete(`http://localhost:8000/api/project/${projectId}`, {
            data: { id: projectId, userId: user._id, userEmail: user.email },
            withCredentials: true,
        });
        if (res.status === 200) {
            setProjects(prev => prev.filter(p => p._id !== projectId));
        }
    };

    const leaveProject = async (projectId: string): Promise<Project | undefined> => {
        if (!user?._id) return;
        try {
            const res = await axios.delete(
                `http://localhost:8000/api/project/${projectId}/member`,
                {
                    withCredentials: true,
                    data: { currUserId: user._id, projectId, email: user.email },
                    headers: { "Content-Type": "application/json" },
                }
            );
            setProjects(prev => prev.filter(p => p._id !== projectId));
            return res.data;
        } catch (err) {
            console.error(err);
            return undefined;
        }
    };

    // ------------------ Meetings ------------------
    const fetchMeetings = async (): Promise<Meeting[]> => {
        if (!user?._id) return [];
        try {
            const res = await axios.get(
                `http://localhost:8000/api/meetings/${user._id}?email=${user.email}`,
                { withCredentials: true }
            );
            setMeetings(res.data);
            return res.data;
        } catch {
            return [];
        }
    };

    const createMeeting = async (meeting: Omit<Meeting, "_id" | "userId">) => {
        if (!user?._id) return;
        const res = await axios.post(
            `http://localhost:8000/api/meeting/create`,
            { ...meeting, userId: user._id, userEmail: user.email },
            { withCredentials: true }
        );
        setMeetings(prev => [res.data, ...prev]);
        return res.data;
    };

    const addParticipantToMeeting = async (meetingId: string, email: string) => {
        if (!user?._id) return;
        const res = await axios.put(
            `http://localhost:8000/api/meeting/${meetingId}/add-participant`,
            { meetingId, email },
            { withCredentials: true }
        );
        const updated = res.data.meeting || res.data;
        setMeetings(prev => prev.map(m => (m._id === meetingId ? { ...m, ...updated } : m)));
        return updated;
    };

    const deleteParticipantFromMeeting = async (meetingId: string, email: string) => {
        if (!user?._id) return;
        const res = await axios.put(
            `http://localhost:8000/api/meeting/${meetingId}/remove-participant`,
            { meetingId, email },
            { withCredentials: true }
        );
        const updated = res.data.meeting || res.data;
        setMeetings(prev => prev.map(m => (m._id === meetingId ? { ...m, ...updated } : m)));
        return updated;
    };

    const deleteMeeting = async (meetingId: string) => {
        if (!user?._id) return;
        const res = await axios.delete(
            `http://localhost:8000/api/meeting/${meetingId}/delete`,
            { withCredentials: true, data: { meetingId } }
        );
        const updated = res.data.meeting || res.data;
        setMeetings(prev => prev.map(m => (m._id === meetingId ? { ...m, ...updated } : m)));
        return updated;
    };

    // ------------------ Fetch on load ------------------
    useEffect(() => {
        if (user?._id) fetchProjects();
    }, [user]);

    // ------------------ Context Value ------------------
    const value: ProjectsContextType = {
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
    };

    return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
};
