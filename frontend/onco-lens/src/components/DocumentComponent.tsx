import { useState } from 'react'
import CreateDocumentModal from './CreateDocumentModal'

const DocumentComponent = () => {

    const [isCreateDocOpen, setIsCreateDocOpen] = useState(false);

  return (
    <div>
        <div className='flex gap-x-5 float-right'>
            <label className="px-6 py-2 bg-transparent border-orange-500 border-2 text-orange-500 rounded-md hover:bg-orange-600 hover:text-white transition cursor-pointer">
                <button onClick={() => setIsCreateDocOpen(true)}>Create Document</button>
            </label>
            {/* <label className="px-6 py-2 bg-transparent border-orange-500 border-2 text-orange-500 rounded-md hover:bg-orange-600 hover:text-white transition cursor-pointer">
                    Upload Document
                    <input
                        type="file"
                        className="hidden"
                    />
            </label> */}

            <CreateDocumentModal
                isOpen={isCreateDocOpen}
                onClose={() => setIsCreateDocOpen(false)}
            />
        </div>
    </div>
  )
}

export default DocumentComponent