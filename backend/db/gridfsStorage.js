import { GridFsStorage } from "multer-gridfs-storage";
import dotenv from "dotenv";

dotenv.config();

const storage = new GridFsStorage({
    url: process.env.MONGO_URI, // must provide the URL
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => {
        return {
            filename: `${Date.now()}-${file.originalname}`, // unique name
            bucketName: "documents", // GridFS collection
            metadata: {
                originalName: file.originalname,
                uploadedBy: req.user?._id || "unknown",
            },
        };
    },
});

export default storage;
