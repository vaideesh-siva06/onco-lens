import { FaBrain } from 'react-icons/fa';
import axios from 'axios';
import React, { useState } from 'react';

interface OncoLensAIUploadProps {
    onCreate?: (data: any) => void; // optional callback
}

const OncoLensAIUpload: React.FC<OncoLensAIUploadProps> = ({ onCreate }) => {
    const [_, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [prediction, setPrediction] = useState<any>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];
        setSelectedFile(file);

        // Show image preview
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result as string);
        reader.readAsDataURL(file);

        // Upload to backend
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await axios.post("http://localhost:8001/predict", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            console.log("Server response:", response.data);
            setPrediction(response.data);
            if (onCreate) onCreate(response.data);
        } catch (err: any) {
            console.error("Upload error:", err.response?.data || err.message);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-orange-300 rounded-lg bg-orange-50 mt-6 text-center">

            {/* Hero: either icon + text or preview image */}
            {previewUrl ? (
                <img
                    src={previewUrl}
                    alt="Uploaded preview"
                    className="w-100 h-100 object-contain rounded-lg mb-4"
                />
            ) : (
                <>
                    <FaBrain className="text-orange-500 text-5xl mb-4" />
                    <h3 className="text-xl font-bold text-orange-600 mb-2">
                        OncoLens AI Prediction Model
                    </h3>
                    <p className="text-orange-500 mb-4">
                        Upload an image to get a prediction!
                    </p>
                </>
            )}

            {/* Upload button */}
            <label className="px-6 py-2 bg-transparent border-orange-500 border-2 text-orange-500 rounded-md hover:bg-orange-600 hover:text-white transition cursor-pointer">
                Upload Image
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </label>

            {/* Optional: prediction result */}
            {prediction && (
                <div className="mt-8 space-y-6 max-w-md">

                    {/* Prediction Result */}
                    <div className="p-5 border border-orange-400 rounded-xl bg-orange-50 shadow-md">
                        <h3 className="text-2xl font-bold text-orange-700 mb-3">
                            Prediction Result
                        </h3>
                        <p className="text-lg text-orange-800">
                            <span className="font-semibold">Class:</span>{" "}
                            {prediction?.prediction || "N/A"}
                            <br /><br /><br />
                            <span className="font-semibold">Confidence:</span>{" "}
                            {(parseFloat((prediction?.confidence_percent).toFixed(2))) || "N/A"}%
                            <br />
                            <span className="font-semibold">Confidence Level:</span>{" "}
                            {prediction?.confidence_level}
                        </p>
                    </div>

                </div>
            )}

            {/* Supported Cancers */}
            <div className="p-5 border border-orange-200 rounded-xl bg-white shadow-sm mt-5">
                <h4 className="text-xl font-semibold text-orange-600 mb-2">
                    Supported Cancers
                </h4>
                <p className="text-base text-gray-700 leading-relaxed">
                    Brain, Breast, Cervix, Colon, Kidney, Lung
                </p>
            </div>
        </div>
    );
};

export default OncoLensAIUpload;
