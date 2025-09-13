import { Router } from 'express';
import authMiddleware from '../Middleware/authMiddleware.js';
import { inviteFriend, acceptInvite, listFriends, removeFriend, getFriendHabits, getFriendRequests, acceptFriendRequest, rejectFriendRequest, acceptInviteByLink } from '../Controllers/friend.controller.js';

const router = Router();

// Public route for invite links (no auth required)
router.get('/invite/:inviteId', acceptInviteByLink);

// Protected routes
router.use(authMiddleware);

router.post('/invite', inviteFriend);
router.post('/accept', acceptInvite);
router.get('/', listFriends);
router.delete('/:id', removeFriend);
router.get('/:id/habits', getFriendHabits);

// Friend requests endpoints
router.get('/requests', getFriendRequests);
router.post('/requests/accept', acceptFriendRequest);
router.post('/requests/reject', rejectFriendRequest);

export default router;
