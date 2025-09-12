import { Router } from 'express';
import authMiddleware from '../Middleware/authMiddleware.js';
import { createGroup, listGroups, getGroup, addMember, createGroupHabit, listGroupHabits } from '../Controllers/group.controller.js';

const router = Router();
router.use(authMiddleware);

router.post("/", createGroup);
router.get("/", listGroups);
router.get("/:id", getGroup);
router.patch("/:id/addMember", addMember);
router.post("/:id/habits", createGroupHabit);
router.get("/:id/habits", listGroupHabits);

export default router;
