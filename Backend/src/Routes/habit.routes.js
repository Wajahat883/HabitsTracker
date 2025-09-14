import { Router } from "express";
import authMiddleware from "../Middleware/authMiddleware.js";
import { createHabit, listHabits, getHabit, updateHabit, archiveHabit, deleteHabit, createOrUpdateLog, listLogs, streakForHabit } from "../Controllers/habit.controller.js";

const router = Router();
router.use(authMiddleware);

router.post("/", createHabit);
router.get("/", listHabits);
router.get("/:id", getHabit);
router.patch("/:id", updateHabit);
router.patch("/:id/archive", archiveHabit);
router.delete("/:id", deleteHabit); // soft delete -> archive
router.post("/:id/logs", createOrUpdateLog);
router.get("/:id/logs", listLogs);
router.get("/:id/streak", streakForHabit);

export default router;
