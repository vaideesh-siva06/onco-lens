import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface ModalContextType {
    isOpen: boolean;
    openProjectModal: () => void;
    closeProjectModal: () => void;
    openProjectModalForEdit: (project: any) => void;
    editProject: any;
    isEditMode: boolean;
    openCalendarModal: () => void;
    closeCalendarModal: () => void;
    isCalendarOpen: boolean;
    openFileModal: () => void;
    closeFileModal: () => void;
    isFileOpen: boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [editProject, setEditProject] = useState<any>(null);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isFileOpen, setIsFileOpen] = useState(false);

    const openProjectModal = () => {
        setEditProject(null); // Clear edit mode
        setIsOpen(true);
    };

    const closeProjectModal = () => {
        setIsOpen(false);
        setEditProject(null); // Clear edit data when closing
    };

    const openProjectModalForEdit = (project: any) => {
        setEditProject(project);
        setIsOpen(true);
    };

    const openCalendarModal = () => {
        setIsCalendarOpen(true);
    };

    const closeCalendarModal = () => {
        setIsCalendarOpen(false);
    };

    const openFileModal = () => {
        setIsFileOpen(true);
    };

    const closeFileModal = () => {
        setIsFileOpen(false);
    };

    return (
        <ModalContext.Provider value={{
            isOpen,
            openProjectModal,
            closeProjectModal,
            openProjectModalForEdit,
            editProject,
            isEditMode: !!editProject,
            openCalendarModal,
            closeCalendarModal,
            isCalendarOpen,
            openFileModal,
            closeFileModal,
            isFileOpen
        }}>
            {children}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) throw new Error('useModal must be used within ModalProvider');
    return context;
};