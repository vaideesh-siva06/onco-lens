import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

interface AuthContextType {
    isAuthenticated: boolean;
    userId: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ _id: string }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const socketRef = React.useRef<any>(null);

    // Init socket once
    useEffect(() => {
        socketRef.current = io("https://onco-lens-backend.onrender.com/", { withCredentials: true });
        return () => {
            socketRef.current.disconnect();
        };
    }, []);

    // Load session from localStorage
    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
            setIsAuthenticated(true);
            setUserId(storedUserId);
            socketRef.current?.emit("register_user", storedUserId);
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string): Promise<{ _id: string }> => {
        try {
            const res = await axios.post(
                'https://onco-lens-backend.onrender.com/auth/login',
                { email, password },
                { withCredentials: true }
            );

            const id = res.data._id;

            localStorage.setItem('userId', id); // only store userId
            setIsAuthenticated(true);
            setUserId(id);

            socketRef.current?.emit("register_user", id);

            return { _id: id };
        } catch (error) {
            alert(error);
            console.error('Login failed', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            if (!userId) return;

            await axios.post('https://onco-lens-backend.onrender.com/auth/logout', {}, { withCredentials: true });

            localStorage.removeItem('userId');
            setIsAuthenticated(false);
            setUserId(null);

            socketRef.current?.emit("disconnect_user", userId);

            localStorage.setItem('activePage', 'projects');
            localStorage.setItem('activeTab', 'Home');
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, userId, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
