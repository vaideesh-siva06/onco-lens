import Router from "express";
import { createMeetingController, endMeetingController, getMeetingById, getMeetings, startMeetingController, leaveMeetingController, addParticipantToMeetingController, removeParticipantFromMeetingController, kickUserController, deleteMeetingController } from "../controllers/meetingController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const meetingRouter = Router();

meetingRouter.post('/meeting/create', authMiddleware, createMeetingController);
meetingRouter.get('/meetings/:userId', authMiddleware, getMeetings);
meetingRouter.post('/meeting/:meetingId/start', authMiddleware, startMeetingController);
meetingRouter.post('/meeting/:meetingId/end', authMiddleware, endMeetingController);
meetingRouter.get('/meeting/:meetingId', authMiddleware, getMeetingById);
meetingRouter.post('/meeting/:meetingId/leave', authMiddleware, leaveMeetingController);
meetingRouter.put('/meeting/:meetingId/add-participant', authMiddleware, addParticipantToMeetingController);
meetingRouter.put('/meeting/:meetingId/remove-participant', authMiddleware, removeParticipantFromMeetingController);
meetingRouter.put('/meeting/:meetingId/kick-user', authMiddleware, kickUserController);
meetingRouter.delete('/meeting/:meetingId/delete', authMiddleware, deleteMeetingController);

export default meetingRouter;