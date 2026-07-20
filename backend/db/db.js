import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let gfs;

const connectDB = async () => {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    gfs = new mongoose.mongo.GridFSBucket(conn.connection.db, {
        bucketName: "documents",
    });
};

export { connectDB, gfs };
