import UserModel from "../models/UserModel.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const signupController = async (req, res) => {

    const { name, email, password } = req.body;

    try {

        const existingUser = await UserModel.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(hashedPassword);

        const user = await UserModel.create({ name, email, password: hashedPassword });
        res.status(201).json({ message: "User created successfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }



    console.log(req.body);
}

export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    // 2. Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Incorrect password" });

    // 3. Create JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // 4. Set cookie (production-ready)
    // Detect HTTPS behind Render proxy
    // const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,                  // MUST be true for HTTPS
      sameSite: "none",                   // cross-site cookie
      // domain: "onco-lens.onrender.com",   // EXACT frontend domain
      maxAge: 24 * 60 * 60 * 1000,       // 1 day
      // path: "/",
    });

    // 5. Respond with user ID (for frontend)
    return res.status(200).json({
      message: "Login successful",
      _id: user._id,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


export const logoutController = (req, res) => {
  const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";

  res.clearCookie("token", {
    httpOnly: true,
    secure: isSecure,
    sameSite: "none",
    domain: "onco-lens.onrender.com",
    path: "/",
  });

  return res.status(200).json({ message: "Logout successful" });
};



