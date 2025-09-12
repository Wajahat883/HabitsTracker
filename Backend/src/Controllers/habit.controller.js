import Habit from "../Models/Habit.js";
import HabitLog from "../Models/HabitLog.js";
import ApiError from "../utils/ApiErros.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Utility: calculate streak for a habit based on logs and frequency
const calculateStreak = (logs = [], frequencyType) => {
  // logs expected sorted descending by date string YYYY-MM-DD
  let streak = 0;
  let prevDate = null;
  for (const log of logs) {
    if (log.status !== "completed") break;
    if (!prevDate) {
      streak = 1; prevDate = log.date; continue;
    }
    const prev = new Date(prevDate + "T00:00:00Z");
    const cur = new Date(log.date + "T00:00:00Z");
    const diff = (prev - cur) / 86400000; // days
    if (diff === 1) { streak++; prevDate = log.date; }
    else break;
  }
  return streak;
};

export const createHabit = async (req, res, next) => {
  try {
    const { title, description, frequencyType, daysOfWeek, timesPerPeriod, colorTag, icon } = req.body;
    if (frequencyType === 'weekly' && (!daysOfWeek || daysOfWeek.length === 0)) {
      throw new ApiError(400, 'daysOfWeek required for weekly habits');
    }
    const habit = await Habit.create({ user: req.user.userId, title, description, frequencyType, daysOfWeek, timesPerPeriod, colorTag, icon });
    return res.status(201).json(new ApiResponse(201, habit, 'Habit created'));
  } catch (e) { next(e); }
};

export const listHabits = async (req, res, next) => {
  try {
    const { archived } = req.query;
    const filter = { user: req.user.userId };
    if (archived === 'true') filter.isArchived = true; else filter.isArchived = false;
    const habits = await Habit.find(filter).sort({ createdAt: -1 });
    return res.json(new ApiResponse(200, habits));
  } catch (e) { next(e); }
};

export const getHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user.userId });
    if (!habit) throw new ApiError(404, 'Habit not found');
    return res.json(new ApiResponse(200, habit));
  } catch (e) { next(e); }
};

export const updateHabit = async (req, res, next) => {
  try {
    const allowed = ['title','description','frequencyType','daysOfWeek','timesPerPeriod','colorTag','icon'];
    const updates = {};
    for (const k of allowed) if (k in req.body) updates[k] = req.body[k];
    if (updates.frequencyType === 'weekly' && (!updates.daysOfWeek || updates.daysOfWeek.length === 0)) {
      throw new ApiError(400, 'daysOfWeek required for weekly habits');
    }
    const habit = await Habit.findOneAndUpdate({ _id: req.params.id, user: req.user.userId }, updates, { new: true });
    if (!habit) throw new ApiError(404, 'Habit not found');
    return res.json(new ApiResponse(200, habit, 'Habit updated'));
  } catch (e) { next(e); }
};

export const archiveHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOneAndUpdate({ _id: req.params.id, user: req.user.userId }, { isArchived: true }, { new: true });
    if (!habit) throw new ApiError(404, 'Habit not found');
    return res.json(new ApiResponse(200, { success: true }, 'Archived'));
  } catch (e) { next(e); }
};

export const createOrUpdateLog = async (req, res, next) => {
  try {
    const { date, status, note } = req.body;
    if (!date || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)) throw new ApiError(400, 'Valid date (YYYY-MM-DD) required');
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user.userId, isArchived: false });
    if (!habit) throw new ApiError(404, 'Habit not found');
    const log = await HabitLog.findOneAndUpdate(
      { habit: habit._id, user: req.user.userId, date },
      { status, note },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.status(201).json(new ApiResponse(201, log, 'Log saved'));
  } catch (e) { next(e); }
};

export const listLogs = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user.userId });
    if (!habit) throw new ApiError(404, 'Habit not found');
    const filter = { habit: habit._id, user: req.user.userId };
    if (from && to) {
      filter.date = { $gte: from, $lte: to };
    }
    const logs = await HabitLog.find(filter).sort({ date: -1 }).limit(400);
    return res.json(new ApiResponse(200, logs));
  } catch (e) { next(e); }
};

export const streakForHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user.userId });
    if (!habit) throw new ApiError(404, 'Habit not found');
    const logs = await HabitLog.find({ habit: habit._id, user: req.user.userId }).sort({ date: -1 });
    const streak = calculateStreak(logs, habit.frequencyType);
    return res.json(new ApiResponse(200, { streak }));
  } catch (e) { next(e); }
};
