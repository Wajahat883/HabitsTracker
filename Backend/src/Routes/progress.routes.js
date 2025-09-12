import { Router } from 'express';
import authMiddleware from '../Middleware/authMiddleware.js';
import { progressSummary, heatmap, habitTrend } from '../Controllers/progress.controller.js';

const router = Router();
router.use(authMiddleware);
router.get('/summary', progressSummary);
router.get('/heatmap', heatmap);
router.get('/habits/:id/trend', habitTrend);

export default router;
