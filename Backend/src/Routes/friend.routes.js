import { Router } from 'express';
import authMiddleware from '../Middleware/authMiddleware.js';
import { inviteFriend, acceptInvite, listFriends, removeFriend, getFriendHabits } from '../Controllers/friend.controller.js';

const router = Router();
router.use(authMiddleware);

router.post('/invite', inviteFriend);
router.post('/accept', acceptInvite);
router.get('/', listFriends);
router.delete('/:id', removeFriend);
router.get('/:id/habits', getFriendHabits);

export default router;
