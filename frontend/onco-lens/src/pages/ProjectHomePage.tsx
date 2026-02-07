import { useEffect, useState } from 'react';
import type { Project } from './ProjectPage';
import DocumentComponent from '../components/DocumentComponent';
import { useDocuments } from '../../context/DocumentsContext';
import { useUser } from '../../context/UserContext';
import { FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProjectHomePage = ({ project }: { project: Project }) => {
    const { documents, fetchDocuments, removeDocument } = useDocuments();
    const user = useUser();

    const [currentPage, setCurrentPage] = useState(1);
    const docsPerPage = 9;

    useEffect(() => {
        fetchDocuments(project._id);
    }, [project._id]);

    const indexOfLastDoc = currentPage * docsPerPage;
    const indexOfFirstDoc = indexOfLastDoc - docsPerPage;
    const currentDocs = documents.slice(indexOfFirstDoc, indexOfLastDoc);

    const totalPages = Math.ceil(documents.length / docsPerPage);

    const deleteDocument = async (documentId: string) => {
        try {
            await axios.delete(
                `http://localhost:8000/api/project/${project._id}/deleteDocument`,
                {
                    data: {
                        documentId,
                        userId: user.user?._id,
                    },
                    withCredentials: true,
                }
            );

            removeDocument(documentId);
        } catch (err) {
            toast.error("Failed to delete document");
        }
    };

    return (
        <div className="px-4 md:px-8 lg:px-16 py-6">
            <ToastContainer
                position="top-center"
                autoClose={2000}
                hideProgressBar
                newestOnTop
                pauseOnHover
                theme="light"
                closeButton={false}
            />

            {/* Project Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-extrabold mb-2">{project.name}</h1>
                <p className="text-gray-700 text-lg">{project.description}</p>
            </div>

            {/* Document Upload Component */}
            <div className="mb-8">
                <DocumentComponent />
            </div>

            {/* Project Tags & Status */}
            <div className="flex flex-wrap gap-3 mb-10">
                {project.focus && (
                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-medium text-sm">
                        {project.focus}
                    </span>
                )}
                {project.cancerTypes?.map(type => (
                    <span
                        key={type}
                        className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium text-sm"
                    >
                        {type}
                    </span>
                ))}
                {project.status && (
                    <span className={`mt-2 text-sm px-3 py-1 rounded-full font-medium ${
                        project.status === 'Planning' ? 'bg-gray-200 text-gray-800' :
                        project.status === 'Ongoing' ? 'bg-blue-100 text-blue-800' :
                        project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                    }`}>
                        Status: {project.status}
                    </span>
                )}
            </div>

            {/* Documents Section */}
            <h2 className="text-2xl font-bold mb-4">Documents</h2>

            {documents.length === 0 ? (
                <p className="text-gray-500 italic">No documents found</p>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {currentDocs.map((document) => (
                            <div
                                key={document._id}
                                className="flex flex-col bg-white rounded-xl shadow-lg hover:shadow-xl overflow-hidden border border-transparent hover:border-orange-500 transition-transform duration-200 transform hover:-translate-y-1"
                            >
                                {/* Paper preview */}
                                <a
                                    href={document.documentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-52 bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                >
                                    <img src='/google_docs_icon.png' height={90} width={90} className="transition-transform duration-200 hover:scale-110" />
                                </a>

                                {/* Title & Author */}
                                <div className="bg-gray-100 px-4 py-3 flex flex-col gap-1">
                                    <p className="text-gray-900 font-semibold truncate">{document.title}</p>
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-gray-500 italic truncate">
                                            Created by: {document.author}
                                        </p>
                                        {(document.email === user.user?.email || user.user?.email === project?.adminEmail) && (
                                            <span
                                                className="text-black hover:text-red-500 cursor-pointer transition-colors"
                                                onClick={() => deleteDocument(document._id)}
                                            >
                                                <FaTrash />
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-10">
                            <button
                                className="px-4 py-2 bg-orange-400 text-white rounded-lg shadow hover:shadow-md disabled:opacity-50 transition"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                            >
                                Prev
                            </button>
                            <span className="font-medium">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                className="px-4 py-2 bg-orange-400 text-white rounded-lg shadow hover:shadow-md disabled:opacity-50 transition"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ProjectHomePage;
