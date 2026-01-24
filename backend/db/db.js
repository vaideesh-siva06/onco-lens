import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let gfs;

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("MongoDB connected");

        // Init GridFS
        gfs = new mongoose.mongo.GridFSBucket(conn.connection.db, {
            bucketName: "documents",
        });
    } catch (error) {
        console.error("MongoDB connection error", error);
    }
};

export { connectDB, gfs };
