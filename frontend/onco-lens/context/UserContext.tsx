import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';

interface User {
    _id: string;
    name: string;
    email: string;
}

interface UserContextType {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    logout: () => void;
    getUserInfo: (id: string) => Promise<void>;
    updateUser: (id: string, data: { name: string; email: string; password?: string }) => Promise<void>;
    loading: boolean;
    getUserByEmail: (email: string) => Promise<User | null>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
    children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const getUserByEmail = async (email: string) => {
        try {
            const res = await axios.get(
                `https://onco-lens-backend.onrender.com/api/user/email/${email}`,
                { withCredentials: true }
            );
            return res.data;    // <-- return user data
        } catch (error) {
            console.error('Error fetching user info:', error);
            return null;
        }
    };

    // Fetch user info
    const getUserInfo = async (id: string) => {
        try {
            const res = await axios.get(`https://onco-lens-backend.onrender.com/api/user/${id}`, { withCredentials: true });
            setUser(res.data);
        } catch (error) {
            console.error('Error fetching user info:', error);
            setUser(null);
            localStorage.removeItem('userId'); // cleanup if user not found
            window.location.reload();
        }
    };

    // Update user info
    const updateUser = async (id: string, data: { name: string; email: string; password?: string }) => {
        try {
            const response = await axios.put(`https://onco-lens-backend.onrender.com/api/user/${id}`, data, { withCredentials: true });
            setUser(response.data.user); // update context with the user object, not the entire response
            localStorage.setItem("userId", response.data.user._id);

            return response.data.user;
        } catch (error) {
            console.error('Error updating user info:', error);
            throw error;
        }

    };

    // Logout function
    const logout = () => {
        setUser(null);
        // localStorage.removeItem('userId');
    };

    // Fetch user on mount if stored in localStorage
    useEffect(() => {
        const storedId = localStorage.getItem('userId');
        if (storedId) {
            getUserInfo(storedId).finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, logout, getUserInfo, updateUser, loading, getUserByEmail }}>
            {children}
        </UserContext.Provider>
    );
};

// Custom hook
export const useUser = (): UserContextType => {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser must be used within a UserProvider');
    return context;
};
