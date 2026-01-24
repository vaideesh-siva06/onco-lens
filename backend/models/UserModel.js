import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    googleAccessToken: String,
    googleRefreshToken: String,
    googleTokenExpiry: Number
})

const UserModel = mongoose.model("User", userSchema);

export default UserModel;