import React, { useState } from 'react'

interface Props {
  onClose: () => void;
  onCreate: (meeting: { name: string; date: string; invitees: string[] }) => void;
}

const FileModal: React.FC<Props> = ({ onClose, onCreate }) => {

  const [title, setTitle] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(title);
    setTitle('');
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input type='text' placeholder='Title' required value={title} onChange={(e) => setTitle(e.target.value)} />
        <button type='submit'>Upload</button>

        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
        >
          Cancel
        </button>
      </form>
    </div>
  )
}

export default FileModal