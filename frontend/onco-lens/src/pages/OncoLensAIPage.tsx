import React, { useEffect } from 'react'
import OncoLensAIUpload from '../components/OncoLensAIUpload'

const OncoLensAIPage = () => {

    useEffect(() => {
        document.title = "OncoLens | OncoLens AI"
    }, [])

    const handleCreate = () => {
        // console.log("handleCreate");
    }

    return (
        <div>
            <h1 className='font-bold text-2xl mt-14'>OncoLens AI</h1>
            <OncoLensAIUpload onCreate={handleCreate} />
        </div>
    )
}

export default OncoLensAIPage
