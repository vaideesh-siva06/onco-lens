import Router from "express";
import { loginController, logoutController, signupController } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const authRouter = Router();

authRouter.post('/auth/signup', signupController)
authRouter.post('/auth/login', loginController)
authRouter.post('/auth/logout', authMiddleware, logoutController)

export default authRouter;