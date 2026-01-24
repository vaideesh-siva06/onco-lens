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
    const socket = io("http://localhost:8000");

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUserId = localStorage.getItem('userId');

        if (token && storedUserId) {
            setIsAuthenticated(true);
            setUserId(storedUserId);
            localStorage.setItem('token', 'true');
            localStorage.setItem('userId', storedUserId);
        }
        else {
            logout();
        }

        setLoading(false);
    }, []);

    const login = async (email: string, password: string): Promise<{ _id: string }> => {
        try {
            const res = await axios.post(
                'http://localhost:8000/auth/login',
                { email, password },
                { withCredentials: true }
            );

            const id = res.data._id;

            // Save session
            localStorage.setItem('token', 'true');
            localStorage.setItem('userId', id);

            // Update state
            setIsAuthenticated(true);
            setUserId(id);
            socket.emit("register_user", id);

            return { _id: id };   // <-- RETURN correct ID
        } catch (error) {
            console.error('Login failed', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            if (!socket || !isAuthenticated || !userId) return;

            await axios.post('http://localhost:8000/auth/logout', {}, { withCredentials: true });

            localStorage.removeItem('token');
            localStorage.removeItem('userId');

            setIsAuthenticated(false);
            setUserId(null);

            socket.emit("disconnect_user", userId);

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
