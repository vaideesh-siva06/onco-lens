import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { FaTimes } from 'react-icons/fa'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useParams } from 'react-router-dom'
import { useUser } from '../../context/UserContext'
import { useDocuments } from '../../context/DocumentsContext'

interface CreateDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  projectId?: string
}

const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
  isOpen = false,
  onClose = () => {},
}) => {
  const [title, setTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { id } = useParams<{ id: string }>()
      const { addDocument } = useDocuments();
  

  const user = useUser();

  const userId = user?.user?._id;


  // Disable background scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const resetForm = () => {
    setTitle('')
  }

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Document title is required')
      return
    }

    try {
        setIsLoading(true)

        const res = await axios.post(
            `http://localhost:8000/api/project/${id}/createDocument`,
            {
                title, projectId: id, userId: userId, author: user.user?.name, email: user.user?.email
            },
            { withCredentials: true }
        )

        toast.success('Document created successfully!')
        console.log(res.data);
        // window.open(res.data.documentUrl, '_blank')

        addDocument({
            documentId: res.data.document._id,
            _id: res.data.document._id,
            title: res.data.document.title,
            documentUrl: res.data.documentUrl,
            projectId: res.data.document.projectId,
            createdBy: res.data.document.createdBy,
            createdAt: res.data.document.createdAt,
            author: res.data.document.author, // ✅ use document.author
            email: res.data.document.email    // ✅ use document.email
        });

        resetForm()
        onClose()
    } catch (err: any) {
    console.error(err)

    // Check if backend says Google not connected
    if (
        err.response?.status === 401 &&
        err.response?.data?.message === 'Google account not connected'
    ) {
        toast.info('Please connect your Google account first...');
        
        // Encode both projectId and userId into state
        const state = JSON.stringify({ projectId: id, userId: userId });
        
        // Redirect to your backend OAuth route
        window.location.href = `http://localhost:8000/auth/google?state=${encodeURIComponent(state)}`;
        return;
    }

    toast.error('Failed to create document')
    } finally {
    setIsLoading(false)
    }

  }

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-xl p-6 relative">
        {/* Close */}
        <button
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
          onClick={() => {
            resetForm()
            onClose()
          }}
        >
          <FaTimes />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center">
          Create Google Document
        </h2>

        <form onSubmit={handleCreateDocument} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-gray-700 mb-1">
              Document Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Title"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-500 text-white py-2 rounded-md hover:bg-orange-600 transition disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Document'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreateDocumentModal
