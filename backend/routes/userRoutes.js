import Router from "express";
import { deleteUserController, getCurrentUserController, getUserByEmailController, getUserController, googleOAuthCallback, reconnectGoogleAccount, updateUserController } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const userRouter = Router();

userRouter.get('/user/:id', authMiddleware, getUserController);
userRouter.put('/user/:id', authMiddleware, updateUserController);
userRouter.delete('/user/:id', authMiddleware, deleteUserController);
userRouter.get('/auth/me', getCurrentUserController);
userRouter.get('/user/email/:email', authMiddleware, getUserByEmailController);
userRouter.get("/user/auth/google/reconnect", authMiddleware, reconnectGoogleAccount);
userRouter.get("/auth/google/callback", authMiddleware, googleOAuthCallback);

export default userRouter;