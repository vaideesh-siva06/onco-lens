import Router from "express";
import { deleteUserController, getCurrentUserController, getUserByEmailController, getUserController, updateUserController } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const userRouter = Router();

userRouter.get('/user/:id', authMiddleware, getUserController);
userRouter.put('/user/:id', authMiddleware, updateUserController);
userRouter.delete('/user/:id', authMiddleware, deleteUserController);
userRouter.get('/auth/me', getCurrentUserController);
userRouter.get('/user/email/:email', authMiddleware, getUserByEmailController);

export default userRouter;