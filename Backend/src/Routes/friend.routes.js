import { Router } from 'express';
import authMiddleware from '../Middleware/authMiddleware.js';
// Import existing friend controllers
import { inviteFriend, acceptInvite, getFriendHabits, acceptInviteByLink } from '../Controllers/friend.controller.js';
// Import new enhanced friend controllers
import {
    discoverUsers,
    sendFriendRequest,
    getAllRequests,
    getReceivedRequests,
    getSentRequests,
    respondToFriendRequest,
    getFriends,
    removeFriend,
    getNotificationCount
} from '../Controllers/friends.controller.js';

const router = Router();

// Public route for invite links (no auth required)
router.get('/invite/:inviteId', acceptInviteByLink);

// Protected routes
router.use(authMiddleware);

// Enhanced friend discovery and management
router.get('/discover', discoverUsers);
router.post('/request', sendFriendRequest);
router.get('/requests', getAllRequests); // Combined endpoint for both sent and received
router.get('/requests/received', getReceivedRequests);
router.get('/requests/sent', getSentRequests);
router.patch('/requests/:requestId', respondToFriendRequest);
router.get('/notifications/count', getNotificationCount);

// Core friend management (enhanced)
router.get('/', getFriends);
router.delete('/:friendId', removeFriend);
router.get('/:id/habits', getFriendHabits);

// Legacy invite system (keep for backward compatibility)
router.post('/invite', inviteFriend);
router.post('/accept', acceptInvite);

export default router;
