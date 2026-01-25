import { useEffect, useState } from 'react';
import { useProjects } from '../../context/ProjectsContext';
import NoProjects from './NoProjects';
import { useModal } from '../../context/ModalContext';
import { FaTrash, FaEdit, FaTh, FaBars, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';

const ProjectsComponents = () => {
    const { projects, deleteProject } = useProjects();
    const { openProjectModal, openProjectModalForEdit } = useModal();
    const { user } = useUser();
    const navigate = useNavigate();

    const [showLoading, _] = useState(false);
    const [isGrid, setIsGrid] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    // useEffect(() => {
    //     // Don't fetch here - let context handle it when user loads
    //     if (location.key !== 'default') {
    //         setShowLoading(true);
    //         const timer = setTimeout(() => setShowLoading(false), 500);
    //         return () => clearTimeout(timer);
    //     }
    // }, []);

    // Reset to page 1 when switching between grid and list view

    document.title = "OncoLens | Projects";

    useEffect(() => {
        setCurrentPage(1);
    }, [isGrid]);

    // Calculate pagination based on view type
    const projectsPerPage = isGrid ? 9 : 5;
    const totalPages = Math.ceil(projects.length / projectsPerPage);
    const indexOfLastProject = currentPage * projectsPerPage;
    const indexOfFirstProject = indexOfLastProject - projectsPerPage;
    const currentProjects = projects.slice(indexOfFirstProject, indexOfLastProject);

    // Handle page change
    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (projectId: string) => {
        await deleteProject(projectId);

        const totalPages = Math.ceil((projects.length - 1) / projectsPerPage);

        if (currentPage > totalPages) {
            setCurrentPage(Math.max(1, totalPages));
        }
    };



    // Generate page numbers to display
    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pageNumbers.push(i);
                }
                pageNumbers.push('...');
                pageNumbers.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pageNumbers.push(1);
                pageNumbers.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pageNumbers.push(i);
                }
            } else {
                pageNumbers.push(1);
                pageNumbers.push('...');
                pageNumbers.push(currentPage - 1);
                pageNumbers.push(currentPage);
                pageNumbers.push(currentPage + 1);
                pageNumbers.push('...');
                pageNumbers.push(totalPages);
            }
        }

        return pageNumbers;
    };

    if (showLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-orange-500 border-b-4 mb-2"></div>
                    <p className="text-gray-600 text-lg text-center">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col mt-14 w-full">
            {/* Header with Grid/List Toggle */}
            <div className="flex justify-between items-center mb-4 px-4 md:px-0">
                <h2 className="text-2xl font-bold">
                    Projects
                    {projects.length > 0 && (
                        <span className="text-gray-500 text-base ml-2">
                            ({projects.length})
                        </span>
                    )}
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsGrid(true)}
                        className={`p-2 rounded-lg ${isGrid ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        <FaTh />
                    </button>
                    <button
                        onClick={() => setIsGrid(false)}
                        className={`p-2 rounded-lg ${!isGrid ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        <FaBars />
                    </button>
                </div>
            </div>

            {/* Projects Grid or List */}
            {projects.length > 0 ? (
                <>
                    <div className={isGrid ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8" : "flex flex-col gap-4 mb-8"}>
                        {currentProjects.map(project => (
                            <div
                                key={`${project._id}`}
                                className={`relative flex flex-col justify-between bg-linear-to-br from-white to-orange-50 shadow-[0_4px_20px_rgba(0,0,0,0.05)] rounded-2xl p-6 border border-gray-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:scale-[1.02] transition-all duration-300 cursor-pointer ${!isGrid ? 'flex-row items-center' : ''}`}
                            >
                                {/* Floating Action Buttons */}
                                <div className="absolute top-4 right-4 flex flex-col gap-2">
                                    {/* Check by userId instead of email */}
                                    {user?._id === project.adminId && (
                                        <button
                                            className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200 transition relative group"
                                            onClick={() => openProjectModalForEdit(project)}
                                        >
                                            <FaEdit />
                                        </button>
                                    )}
                                    <button
                                        className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition relative group animate-none hover:animate-shake"
                                        onClick={() => handleDelete(project._id)}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>

                                {/* Project Content */}
                                <div className={isGrid ? '' : 'flex-1'}>
                                    <h3 className="text-xl font-semibold text-gray-800 tracking-tight">
                                        {project.name}
                                    </h3>
                                    <p className="text-gray-500 mt-3 mb-3 leading-relaxed w-[90%]">
                                        {project.description}
                                    </p>

                                    <button
                                        className="mt-2 w-fit px-5 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 active:scale-95 transition mb-6"
                                        onClick={() => navigate(`/project/${project._id}`)}
                                    >
                                        View Project →
                                    </button>

                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {project.focus && (
                                            <span className="bg-orange-100 text-orange-800 text-sm px-2 py-1 rounded-full">
                                                {project.focus}
                                            </span>
                                        )}

                                        {project.cancerTypes?.map((type, index) => (
                                            <span
                                                key={`${type}-${index}`}
                                                className="bg-green-100 text-green-800 text-sm px-2 py-1 rounded-full"
                                            >
                                                {type}
                                            </span>
                                        ))}

                                        {project.status && (
                                            <span className={`text-sm px-2 py-1 rounded-full ${project.status === 'Planning' ? 'bg-gray-200 text-gray-800' :
                                                project.status === 'Ongoing' ? 'bg-blue-100 text-blue-800' :
                                                    project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                        project.status === 'Published' ? 'bg-purple-100 text-purple-800' :
                                                            'bg-gray-200 text-gray-800'
                                                }`}>
                                                {project.status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mb-8">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${currentPage === 1
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 shadow-sm'
                                    }`}
                            >
                                <FaChevronLeft className="text-sm" />
                                <span className="hidden sm:inline">Previous</span>
                            </button>

                            <div className="flex gap-2">
                                {getPageNumbers().map((pageNumber, index) => {
                                    if (pageNumber === '...') {
                                        return (
                                            <span key={`ellipsis-${index}`} className="px-4 py-2 text-gray-500">
                                                ...
                                            </span>
                                        );
                                    }

                                    return (
                                        <button
                                            key={pageNumber}
                                            onClick={() => handlePageChange(pageNumber as number)}
                                            className={`px-4 py-2 rounded-lg font-medium transition ${currentPage === pageNumber
                                                ? 'bg-orange-500 text-white shadow-md'
                                                : 'bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 shadow-sm'
                                                }`}
                                        >
                                            {pageNumber}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => {
                                    handlePageChange(currentPage + 1)
                                }}
                                disabled={currentPage === totalPages}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${currentPage === totalPages
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 shadow-sm'
                                    }`}
                            >
                                <span className="hidden sm:inline">Next</span>
                                <FaChevronRight className="text-sm" />
                            </button>
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="text-center text-gray-500 text-sm mb-4">
                            Showing {indexOfFirstProject + 1} - {Math.min(indexOfLastProject, projects.length)} of {projects.length} projects
                        </div>
                    )}
                </>
            ) : (
                <NoProjects onCreate={openProjectModal} />
            )}

            <style>
                {`
                @keyframes shake {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-10deg); }
                    50% { transform: rotate(10deg); }
                    75% { transform: rotate(-10deg); }
                }
                .animate-shake {
                    animation: shake 0.3s ease-in-out;
                }
                `}
            </style>
        </div>
    );
};

export default ProjectsComponents;