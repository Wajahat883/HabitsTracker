import { Router } from 'express';
import authMiddleware from '../Middleware/authMiddleware.js';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  getUnreadCount, 
  deleteNotification 
} from '../Controllers/notification.controller.js';

const router = Router();
router.use(authMiddleware);

// Get all notifications
router.get('/', getNotifications);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Mark notification as read
router.patch('/:notificationId/read', markAsRead);

// Mark all notifications as read
router.patch('/read-all', markAllAsRead);

// Delete notification
router.delete('/:notificationId', deleteNotification);

export default router;
