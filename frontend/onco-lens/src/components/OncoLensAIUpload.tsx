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
            const response = await axios.post("https://onco-lens-ml.onrender.com/predict", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                withCredentials: true
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
                            {(parseFloat((prediction?.confidence))) || "N/A"}%
                            <br />
                            <span className="font-semibold">Class:</span>{" "}
                            {prediction?.description}
                        </p>
                    </div>

                </div>
            )}

            {/* Supported Cancers */}
            <div className="flex flex-col md:flex-row gap-5 mt-5">

                {/* Scans Card */}
                <div className="flex-1 p-5 border border-orange-200 rounded-xl bg-white shadow-sm hover:shadow-lg transition">
                    <h4 className="text-xl font-semibold text-orange-600 mb-2">
                        Scans
                    </h4>
                    <p className="text-sm text-gray-500 mb-3">
                        Cancers with full MRI or CT scans used for training the model.
                    </p>
                    <ul className="text-base text-gray-700 list-none space-y-2">
                        <li>
                            <span className="inline-block bg-blue-200 text-blue-800 px-2 py-1 rounded-full mr-2 text-sm font-medium">
                                Brain
                            </span>
                            MRI scans
                        </li>
                        <li>
                            <span className="inline-block bg-blue-200 text-blue-800 px-2 py-1 rounded-full mr-2 text-sm font-medium">
                                Kidney
                            </span>
                            CT scans
                        </li>
                        <li>
                            <span className="inline-block bg-blue-200 text-blue-800 px-2 py-1 rounded-full mr-2 text-sm font-medium">
                                Lung
                            </span>
                            CT scans
                        </li>
                    </ul>
                </div>

                {/* Tumor Image Patches Card */}
                <div className="flex-1 p-5 border border-orange-200 rounded-xl bg-white shadow-sm hover:shadow-lg transition">
                    <h4 className="text-xl font-semibold text-orange-600 mb-2">
                        Model Trained on Tumor Image Patches
                    </h4>
                    <p className="text-sm text-gray-500 mb-3">
                        Cancers where the model was trained using cropped tumor image patches.
                    </p>
                    <ul className="text-base text-gray-700 list-none space-y-2">
                        <li>
                            <span className="inline-block bg-purple-200 text-purple-800 px-2 py-1 rounded-full mr-2 text-sm font-medium">
                                Lung
                            </span>
                        </li>
                        <li>
                            <span className="inline-block bg-purple-200 text-purple-800 px-2 py-1 rounded-full mr-2 text-sm font-medium">
                                Breast
                            </span>
                        </li>
                        <li>
                            <span className="inline-block bg-purple-200 text-purple-800 px-2 py-1 rounded-full mr-2 text-sm font-medium">
                                Cervix
                            </span>
                        </li>
                        <li>
                            <span className="inline-block bg-purple-200 text-purple-800 px-2 py-1 rounded-full mr-2 text-sm font-medium">
                                Colon
                            </span>
                        </li>
                    </ul>
                </div>

            </div>



        </div>
    );
};

export default OncoLensAIUpload;
