import { Router } from 'express';
import authMiddleware from '../Middleware/authMiddleware.js';
import { progressSummary, heatmap, habitTrend, groupProgress, allUsersProgress, friendsProgress } from '../Controllers/progress.controller.js';

const router = Router();
router.use(authMiddleware);
router.get('/summary', progressSummary);
router.get('/heatmap', heatmap);
router.get('/habits/:id/trend', habitTrend);
router.get('/groups/:id', groupProgress);
router.get('/allUsers', allUsersProgress);
router.get('/friends', friendsProgress);

export default router;
