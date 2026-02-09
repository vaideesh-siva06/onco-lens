import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import axios from "axios";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export interface Document {
  _id: string;
  title: string;
  documentUrl: string;
  documentId: string;
  projectId: string;
  createdBy: string;
  createdAt: string;
  author:string;
  email: string;
}

interface DocumentContextType {
  documents: Document[];
  isLoading: boolean;
  fetchDocuments: (projectId: string) => Promise<void>;
  addDocument: (doc: Document) => void;
  removeDocument: (docId: string) => void;
  updateDocument: (docId: string, updates: Partial<{ title: string; author: string }>) => void;
  updateAuthorForUser: (userId: string, newName: string) => void;
  setDocuments?: React.Dispatch<React.SetStateAction<Document[]>>;
  
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

/* ============================
   Provider
============================ */

export const DocumentProvider: React.FC<{ children: ReactNode }> = ({
  children
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /* Fetch documents for a project */
  const fetchDocuments = async (projectId: string) => {
    try {
      setIsLoading(true);
      const res = await axios.get(
        `https://onco-lens-backend-hq5x.onrender.com/api/project/${projectId}/getAllDocuments`,
        { withCredentials: true }
      );
      setDocuments(prev => {
        const newDocs = res.data.documents;
        
        // Merge or replace documents for this project
        // Remove old documents from this project
        const filteredPrev = prev.filter(doc => doc.projectId !== projectId);

        return [...filteredPrev, ...newDocs];
    });
      // console.log(documents);
      // console.log("SUCCESS1");
    } catch (err) {
      // console.error("Failed to fetch documents:", err);
    } finally {
      setIsLoading(false);
    }
  };

  /* Add document locally (optimistic update) */
  const addDocument = (doc: Document) => {
    setDocuments(prev => [doc, ...prev]);
  };

  /* Remove document */
  const removeDocument = (docId: string) => {
    setDocuments(prev => prev.filter(d => d._id !== docId));
    toast.success("Document deleted!");
  };
  
    /* Update a document locally */
    const updateDocument = (docId: string, updates: Partial<{ title: string; author: string }>) => {
        setDocuments(prev =>
            prev.map(doc =>
            doc._id === docId
                ? { ...doc, ...updates } // merge updates into the doc
                : doc
            )
        );
    };

    const updateAuthorForUser = (userId: string, newName: string) => {
        setDocuments(prev =>
            prev.map(doc =>
            doc.createdBy === userId
                ? { ...doc, author: newName } // update the author
                : doc
            )
        );
    };


  return (
    <DocumentContext.Provider
      value={{
        documents,
        isLoading,
        fetchDocuments,
        addDocument,
        removeDocument,
        setDocuments,
        updateDocument,
        updateAuthorForUser
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};

/* ============================
   Hook
============================ */

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error("useDocuments must be used within a DocumentProvider");
  }
  return context;
};
