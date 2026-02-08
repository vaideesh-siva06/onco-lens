import axios from 'axios';
import React, { useEffect, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { FaTimes } from 'react-icons/fa';
import { useUser } from '../../context/UserContext';
import { useProjects } from '../../context/ProjectsContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    editMode?: boolean;
    projectData?: any; // Pass the project to edit
}

const CANCER_TYPES = [
    'Brain Cancer',
    'Lung Cancer',
    'Breast Cancer',
    'Cervical Cancer',
    'Colon Cancer',
    'Kidney Cancer',
    'Other',
];

const STATUSES = ['Planning', 'Ongoing', 'Completed', 'Published'];

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
    isOpen = false,
    onClose = () => { },
    editMode = false,
    projectData = null
}) => {
    const [showModal, setShowModal] = useState(isOpen);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [focus, setFocus] = useState('');
    const [customFocus, setCustomFocus] = useState('');
    const [cancerTypes, setCancerTypes] = useState<string[]>([]);
    const [status, setStatus] = useState('');
    const [teamEmails, setTeamEmails] = useState<string[]>([]);
    const [emailInput, setEmailInput] = useState('');
    const { user } = useUser();
    const { addProject, updateProject } = useProjects();
    const [animate, setAnimate] = useState(false);


    // Pre-fill form when in edit mode
    useEffect(() => {
        if (editMode && projectData) {
            setName(projectData.name || '');
            setDescription(projectData.description || '');

            // Check if focus is a predefined option
            const predefinedFocus = ['Immunotherapy', 'Genomics', 'Clinical Trial', 'Data Analysis', 'Drug Development', 'Epidemiology'];
            if (predefinedFocus.includes(projectData.focus)) {
                setFocus(projectData.focus);
                setCustomFocus('');
            } else if (projectData.focus) {
                setFocus('Other');
                setCustomFocus(projectData.focus);
            } else {
                setFocus('');
                setCustomFocus('');
            }

            setCancerTypes(projectData.cancerTypes || []);
            setStatus(projectData.status || '');
            setTeamEmails(projectData.teamEmails || []);
        }
    }, [editMode, projectData]);
    

    // Disable scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setShowModal(true);       // mount the modal
            setTimeout(() => setAnimate(true), 10); // trigger open animation
        } else {
            setAnimate(false);        // trigger close animation
            const timeout = setTimeout(() => setShowModal(false), 300);
            return () => clearTimeout(timeout);
        }
    }, [isOpen]);


    if (!showModal) return null;

    const resetForm = () => {
        setName('');
        setDescription('');
        setFocus('');
        setCustomFocus('');
        setCancerTypes([]);
        setStatus('');
        setTeamEmails([]);
        setEmailInput('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            if (!user?._id) return;

            const finalFocus = focus === 'Other' ? customFocus : focus;

            try {
                if (editMode && projectData) {
                    // Updating an existing project
                    await updateProject(projectData._id, {
                        name,
                        description,
                        focus: finalFocus,
                        cancerTypes,
                        status,
                        teamEmails,
                    });
                    toast.success("Project updated successfully");
                } else {
                    // CREATE new project
                    const res = await axios.post(
                        `https://onco-lens-backend.onrender.com/api/project/${user._id}`,
                        {
                            name,
                            description,
                            focus: finalFocus,
                            cancerTypes,
                            status,
                            teamEmails,
                            adminEmail: user.email,
                            adminName: user.name
                        },
                        { withCredentials: true }
                    );

                    // ------------------ Google OAuth redirect ------------------
                    if (res.data.requiresGoogleAuth && res.data.redirect) {
                        toast.info("Please connect your Google account first...");
                        window.location.href = res.data.redirect; // redirect to backend OAuth
                        
                    }

                    // ------------------ Project created successfully ------------------
                    addProject(res.data);
                    toast.success("Project created successfully");
                }

                resetForm();
                onClose();

            } catch (error: any) {
                console.error("Error saving project", error);
                toast.error(editMode ? "Failed to update project" : "Failed to create project");
            }
        };



    const toggleCancerType = (type: string) => {
        if (cancerTypes.includes(type)) {
            setCancerTypes(cancerTypes.filter(t => t !== type));
        } else {
            setCancerTypes([...cancerTypes, type]);
        }
    };

    const handleAddEmail = () => {
        const trimmed = emailInput.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!trimmed) return;

        if (!emailRegex.test(trimmed)) {
            toast.error('Please enter a valid email');
            return;
        }

        if (emailInput == user?.email) {
            toast.error('You cannot add yourself to the team');
            return;
        }

        if (!teamEmails.includes(trimmed)) {
            setTeamEmails([...teamEmails, trimmed]);
        }

        setEmailInput('');
    };

    const handleEmailKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddEmail();
        }
    };

    const handleRemoveEmail = (email: string) => {
        setTeamEmails(teamEmails.filter(e => e !== email));
    };

    return (
        <div
    className={`fixed inset-0 flex items-center justify-center z-50
        bg-black/20 transition-opacity duration-300
        ${animate ? 'opacity-100' : 'opacity-0'}`}
>
    <div
        className={`bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 relative max-h-[90vh] overflow-y-auto
            transform transition-all duration-300
            ${animate ? 'translate-y-0 opacity-100' : '-translate-y-6 opacity-0'}`}
    >
                {/* Close Button */}
                <button
                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
                    onClick={() => {
                        resetForm();
                        onClose();
                    }}
                >
                    <FaTimes />
                </button>

                <h2 className="text-2xl font-bold mb-6 text-center">
                    {editMode ? 'Edit Project' : 'Create Project'}
                </h2>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Project Name */}
                    <div className="col-span-1">
                        <label className="block text-gray-700 mb-1">
                            Project Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                            required
                        />
                    </div>

                    {/* Focus Dropdown */}
                    <div className="col-span-1">
                        <label className="block text-gray-700 mb-1">
                            Focus <span className="text-gray-500 italic">(Optional)</span>
                        </label>
                        <select
                            value={focus}
                            onChange={(e) => setFocus(e.target.value)}
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                        >
                            <option value="">Select focus (optional)</option>
                            <option value="Immunotherapy">Immunotherapy</option>
                            <option value="Genomics">Genomics</option>
                            <option value="Clinical Trial">Clinical Trial</option>
                            <option value="Data Analysis">Data Analysis</option>
                            <option value="Drug Development">Drug Development</option>
                            <option value="Epidemiology">Epidemiology</option>
                            <option value="Other">Other</option>
                        </select>

                        {focus === 'Other' && (
                            <input
                                type="text"
                                value={customFocus}
                                onChange={(e) => setCustomFocus(e.target.value)}
                                placeholder="Enter custom focus"
                                className="mt-2 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                            />
                        )}
                    </div>

                    {/* Status Dropdown */}
                    <div className="col-span-1">
                        <label className="block text-gray-700 mb-1">
                            Status <span className="text-gray-500 italic">(Optional)</span>
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                        >
                            <option value="">Select status</option>
                            {STATUSES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    {/* Team Members */}
                    <div className="col-span-1">
                        <label className="block text-gray-700 mb-1">
                            Team Members (Email – <i className="text-gray-500">Optional</i>)
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {teamEmails.map(email => (
                                <div
                                    key={email}
                                    className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                                >
                                    {email}
                                    <button
                                        type="button"
                                        className="ml-1 hover:text-blue-900"
                                        onClick={() => handleRemoveEmail(email)}
                                    >
                                        <FaTimes size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <input
                            type="email"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            onKeyDown={handleEmailKeyDown}
                            placeholder="Type email and press Enter"
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                    </div>

                    {/* Cancer Types Multi-select */}
                    <div className="col-span-1 sm:col-span-2 md:col-span-2">
                        <label className="block text-gray-700 mb-1">
                            Cancer Type(s) <span className="text-gray-500 italic">(Optional)</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {CANCER_TYPES.map((type) => (
                                <button
                                    type="button"
                                    key={type}
                                    className={`px-3 py-1 border rounded-full text-sm ${cancerTypes.includes(type)
                                        ? 'bg-orange-500 text-white border-orange-500'
                                        : 'bg-white text-gray-700 border-gray-300'
                                        } hover:bg-orange-200 transition`}
                                    onClick={() => toggleCancerType(type)}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="col-span-1 sm:col-span-2 md:col-span-2">
                        <label className="block text-gray-700 mb-1">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                            rows={6}
                            placeholder="Describe the project..."
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="col-span-1 sm:col-span-2 md:col-span-2">
                        <button
                            type="submit"
                            className="w-full bg-orange-500 text-white py-2 rounded-md hover:bg-orange-600 transition"
                        >
                            {editMode ? 'Update Project' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectModal;
