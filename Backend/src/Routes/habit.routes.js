import { Router } from "express";
import authMiddleware from "../Middleware/authMiddleware.js";
import { createHabit, listHabits, getHabit, updateHabit, archiveHabit, deleteHabit, createOrUpdateLog, listLogs, streakForHabit, restoreHabit, batchLogs, forceRollover, updateHabitProgress, simulateHabitActivity } from "../Controllers/habit.controller.js";

const router = Router();
router.use(authMiddleware);

router.post("/", createHabit);
router.get("/", listHabits);
router.get("/:id", getHabit);
router.patch("/:id", updateHabit);
router.patch("/:id/archive", archiveHabit);
router.patch("/:id/restore", restoreHabit);
router.delete("/:id", deleteHabit); // soft delete -> archive
router.post("/:id/logs", createOrUpdateLog);
router.get("/:id/logs", listLogs);
router.get("/:id/streak", streakForHabit);
router.get("/logs/batch/all", batchLogs); // expects habitIds query param
router.post("/rollover/force", forceRollover); // Force rollover for testing
router.post("/progress/update", updateHabitProgress); // Dynamic progress update
router.post("/activity/simulate", simulateHabitActivity); // Simulate habit activity for testing

export default router;
