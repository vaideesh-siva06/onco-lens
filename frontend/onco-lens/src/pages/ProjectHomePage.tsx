import React, { useEffect, useState } from 'react';
import type { Project } from './ProjectPage';
import DocumentComponent from '../components/DocumentComponent';
import { useDocuments } from '../../context/DocumentsContext';
import { useUser } from '../../context/UserContext';
import { FaTrash, FaPaperPlane } from 'react-icons/fa';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const ProjectHomePage = ({ project }: { project: Project }) => {
    const { documents, fetchDocuments, setDocuments, removeDocument } = useDocuments();
    const user = useUser();

    const [currentPage, setCurrentPage] = useState(1);
    const docsPerPage = 9;

    useEffect(() => {
        fetchDocuments(project._id);
        // console.log(project._id)
        // console.log(user.user?._id)
    }, [project._id]);

    // console.log(documents);

    // Pagination logic
    const indexOfLastDoc = currentPage * docsPerPage;
    const indexOfFirstDoc = indexOfLastDoc - docsPerPage;
    const currentDocs = documents.slice(indexOfFirstDoc, indexOfLastDoc);

    const totalPages = Math.ceil(documents.length / docsPerPage);

  const deleteDocument = async (documentId: string) => {
        // console.log(documentId);

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

            // console.log(documents);
        } catch (err) {
            // console.error("Failed to delete document:", err);
            toast.error("Failed to delete document");
        }
    };


    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
            <p className="text-gray-700 mb-4">{project.description}</p>

            <DocumentComponent />

            <div className="flex-wrap gap-2 mb-4">
                {project.focus && (
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full">{project.focus}</span>
                )}
                <div className="flex gap-2 flex-wrap mt-5">
                    {project.cancerTypes?.map(type => (
                        <span
                            key={type}
                            className="bg-green-100 text-green-800 px-2 py-1 rounded-full"
                        >
                            {type}
                        </span>
                    ))}
                </div>
                {project.status && (
                    <div className="mt-2">
                        <span>Status: </span>
                        <span className={`text-sm px-2 py-1 rounded-full ${
                            project.status === 'Planning' ? 'bg-gray-200 text-gray-800' :
                            project.status === 'Ongoing' ? 'bg-blue-100 text-blue-800' :
                            project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                        }`}>
                            {project.status}
                        </span>
                    </div>
                )}
            </div>

            <h1 className="text-xl font-bold mb-4 mt-10">Documents</h1>

            {documents.length === 0 ? (
                <p className="text-gray-500 italic">No documents found</p>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {currentDocs.map((document) => (
                            <div key={document._id} className="flex flex-col bg-white rounded-lg shadow-sm hover:shadow-md overflow-hidden transition hover:border-orange-500 border-transparent border-3">
                            
                            {/* Paper preview */}
                            <a
                                href={document.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-52 bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition"
                            >
                                {/* You can replace this with a PDF preview or icon */}
                                <img src='/google_docs_icon.png' height={90} width={90}/>
                            </a>

                            {/* Title & Author row */}
                            <div className="bg-gray-100 px-4 py-3 flex flex-col">
                                <p className="text-gray-900 font-medium truncate">{document.title}</p>

                                <div className="flex justify-between items-center mt-1">
                                <p className="text-sm text-gray-500 italic truncate">
                                    Created by: {document.author}
                                </p>

                                {(document.email === user.user?.email || user.user?.email === project?.adminEmail) && (
                                    <span className="text-black hover:text-red-500 cursor-pointer" onClick={() => deleteDocument(document._id)}>
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
                        <div className="flex justify-center items-center gap-2 mt-20">
                            <button
                                className="px-3 py-1 bg-orange-400 text-white rounded disabled:opacity-50"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                            >
                                Prev
                            </button>
                            <span>
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                className="px-3 py-1 bg-orange-400 text-white rounded disabled:opacity-50"
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
