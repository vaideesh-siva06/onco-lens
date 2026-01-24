import Router from "express";
import { addMemberController, createDocumentController, createProjectController, deleteDocumentController, deleteMemberController, deleteProjectController, getAllDocumentsController, getAllProjectsController, getProjectController, updateProjectController } from "../controllers/projectController.ts";
import { authMiddleware } from "../middleware/authMiddleware.js";

const projectRouter = Router();

projectRouter.get('/projects/', authMiddleware, getAllProjectsController);
projectRouter.get('/project/:id', authMiddleware, getProjectController);
projectRouter.post('/project/:id', authMiddleware, createProjectController);
projectRouter.delete('/project/:id', authMiddleware, deleteProjectController);
projectRouter.post('/project/:id/member', authMiddleware, addMemberController);
projectRouter.delete('/project/:id/member', authMiddleware, deleteMemberController);
projectRouter.put('/project/:id', authMiddleware, updateProjectController);
projectRouter.post('/project/:id/createDocument', authMiddleware, createDocumentController);
projectRouter.get('/project/:id/getAllDocuments', authMiddleware, getAllDocumentsController);
projectRouter.delete('/project/:id/deleteDocument', authMiddleware, deleteDocumentController);
export default projectRouter;