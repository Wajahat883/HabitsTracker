import { Router } from "express";
import {
    discoverUsers,
    sendFriendRequest,
    getReceivedRequests,
    getSentRequests,
    respondToFriendRequest,
    getFriends,
    removeFriend,
    getNotificationCount
} from "../Controllers/friends.controller.js";
import { verifyJWT } from "../Middleware/authMiddleware.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// User discovery
router.get("/discover", discoverUsers);

// Friend requests
router.post("/request", sendFriendRequest);
router.get("/requests/received", getReceivedRequests);
router.get("/requests/sent", getSentRequests);
router.patch("/requests/:requestId", respondToFriendRequest);

// Friends management
router.get("/", getFriends);
router.delete("/:friendId", removeFriend);

// Notifications
router.get("/notifications/count", getNotificationCount);

export default router;