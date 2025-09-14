import Habit from "../Models/Habit.js";
import HabitLog from "../Models/HabitLog.js";
import Group from "../Models/Group.js";
import ApiError from "../utils/ApiErros.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// ---------------- Frequency / Streak Helpers ----------------
const dateStrToDate = (s) => new Date(s + 'T00:00:00Z');

function countScheduledWeeklyDaysBetween(startStr, endStr, daysOfWeek = []) {
  if (!daysOfWeek.length) return 0;
  const start = dateStrToDate(startStr);
  const end = dateStrToDate(endStr);
  let count = 0;
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    if (daysOfWeek.includes(d.getUTCDay())) count++;
  }
  return count;
}

function monthKey(d) { return d.toISOString().slice(0,7); }

function computeFlexibleStreak(habit, logs, endDateStr) {
  // logs: ALL logs for habit sorted DESC by date
  const endDate = dateStrToDate(endDateStr);
  if (habit.frequencyType === 'daily') {
    let streak = 0;
    let cursor = new Date(endDate);
    // We'll examine days backwards until break
    const logMap = new Map(logs.map(l => [l.date, l]));
    while (true) {
      const key = cursor.toISOString().slice(0,10);
      const entry = logMap.get(key);
      if (!entry) break; // missing -> break streak
      if (entry.status === 'completed') streak++; else if (entry.status === 'skipped') { /* ignore skipped day but continue */ } else break;
      // Move back a day
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    return streak;
  }
  if (habit.frequencyType === 'weekly') {
    if (!habit.daysOfWeek || habit.daysOfWeek.length === 0) return 0;
    // Build scheduled dates <= endDate descending until break
    const logMap = new Map(logs.map(l => [l.date, l]));
    let streak = 0;
    let cursor = new Date(endDate);
    // Normalize cursor to last scheduled day <= endDate
    let attempts = 0;
    while (!habit.daysOfWeek.includes(cursor.getUTCDay()) && attempts < 7) { cursor.setUTCDate(cursor.getUTCDate() - 1); attempts++; }
    if (attempts >= 7) return 0;
    while (true) {
      const key = cursor.toISOString().slice(0,10);
      const entry = logMap.get(key);
      if (!entry) break;
      if (entry.status === 'completed') streak++; else if (entry.status === 'skipped') { /* ignore */ } else break;
      // move cursor back to previous scheduled day
      let moved = false;
      for (let i = 1; i <= 7; i++) {
        const nextCursor = new Date(cursor);
        nextCursor.setUTCDate(nextCursor.getUTCDate() - i);
        if (habit.daysOfWeek.includes(nextCursor.getUTCDay())) { cursor = nextCursor; moved = true; break; }
      }
      if (!moved) break;
    }
    return streak;
  }
  if (habit.frequencyType === 'monthly') {
    // Streak counts consecutive months (including current) with at least one completed log.
    const logsByMonth = logs.reduce((acc,l)=>{ if (l.status==='completed') { const m = l.date.slice(0,7); acc[m] = true; } return acc; }, {});
    let streak = 0;
    let cursor = new Date(endDate.getUTCFullYear(), endDate.getUTCMonth(), 1);
    while (true) {
      const mk = monthKey(cursor);
      if (logsByMonth[mk]) { streak++; cursor.setUTCMonth(cursor.getUTCMonth() - 1); } else break;
    }
    return streak;
  }
  // custom or unknown fallback to daily logic over provided logs
  let streak = 0; let prevDate = null;
  for (const log of logs) {
    if (log.status !== 'completed') break;
    if (!prevDate) { streak = 1; prevDate = log.date; continue; }
    const prev = dateStrToDate(prevDate); const cur = dateStrToDate(log.date);
    const diff = (prev - cur) / 86400000; if (diff === 1) { streak++; prevDate = log.date; } else break;
  }
  return streak;
}

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
    const userHabits = await Habit.find(filter).sort({ createdAt: -1 });
    // Also include group habits where user is member
    const groups = await Group.find({ members: req.user.userId });
    const groupIds = groups.map(g => g._id);
    const groupHabits = await Habit.find({ group: { $in: groupIds }, isArchived: false }).sort({ createdAt: -1 });
    const allHabits = [...userHabits, ...groupHabits];
    return res.json(new ApiResponse(200, allHabits));
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

export const restoreHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOneAndUpdate({ _id: req.params.id, user: req.user.userId }, { isArchived: false }, { new: true });
    if (!habit) throw new ApiError(404, 'Habit not found');
    return res.json(new ApiResponse(200, habit, 'Restored'));
  } catch (e) { next(e); }
};

export const deleteHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOneAndUpdate({ _id: req.params.id, user: req.user.userId }, { isArchived: true }, { new: true });
    if (!habit) throw new ApiError(404, 'Habit not found');
    return res.json(new ApiResponse(200, { success: true }, 'Soft deleted (archived)'));
  } catch (e) { next(e); }
};

export const createOrUpdateLog = async (req, res, next) => {
  try {
    const { date, status, note } = req.body;
    if (!date || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)) throw new ApiError(400, 'Valid date (YYYY-MM-DD) required');
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user.userId, isArchived: false });
    if (!habit) throw new ApiError(404, 'Habit not found');
    // Reject future dates
    const todayUTC = new Date();
    const todayStr = todayUTC.toISOString().slice(0,10);
    if (date > todayStr) throw new ApiError(400, 'Future dates not allowed');
    // Ensure not older than 90 days (optional window)
    const ninetyAgo = new Date(Date.now() - 90*86400000).toISOString().slice(0,10);
    if (date < ninetyAgo) throw new ApiError(400, 'Date older than 90-day window');
    // Weekly habit validation
    if (habit.frequencyType === 'weekly') {
      if (!habit.daysOfWeek || habit.daysOfWeek.length === 0) throw new ApiError(400, 'Weekly habit misconfigured (daysOfWeek missing)');
      const weekday = new Date(date + 'T00:00:00Z').getUTCDay();
      if (!habit.daysOfWeek.includes(weekday)) throw new ApiError(400, 'Date not in scheduled days for weekly habit');
    }
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
  // enforce max 90-day span
  const fromDate = new Date(from + 'T00:00:00Z');
  const toDate = new Date(to + 'T00:00:00Z');
  const diff = (toDate - fromDate)/86400000;
  if (diff > 90) throw new ApiError(400, 'Range exceeds 90 days');
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
    const streak = computeFlexibleStreak(habit, logs, new Date().toISOString().slice(0,10));
    return res.json(new ApiResponse(200, { streak }));
  } catch (e) { next(e); }
};

// Batch logs endpoint: GET /api/habits/logs/batch?habitIds=a,b,c&from=YYYY-MM-DD&to=YYYY-MM-DD
export const batchLogs = async (req, res, next) => {
  try {
    const { habitIds, from, to } = req.query;
    if (!habitIds) throw new ApiError(400, 'habitIds required');
    const ids = habitIds.split(',').filter(Boolean);
    if (!ids.length) throw new ApiError(400, 'No valid habit ids');
    const habits = await Habit.find({ _id: { $in: ids }, user: req.user.userId });
    const allowedIds = habits.map(h => h._id.toString());
    const filter = { habit: { $in: allowedIds }, user: req.user.userId };
    if (from && to) {
      const fromDate = new Date(from + 'T00:00:00Z');
      const toDate = new Date(to + 'T00:00:00Z');
      const diff = (toDate - fromDate)/86400000;
      if (diff > 90) throw new ApiError(400, 'Range exceeds 90 days');
      filter.date = { $gte: from, $lte: to };
    }
    const logs = await HabitLog.find(filter).sort({ date: -1 });
    const grouped = {};
    for (const l of logs) {
      const hid = l.habit.toString();
      if (!grouped[hid]) grouped[hid] = [];
      grouped[hid].push(l);
    }
    return res.json(new ApiResponse(200, grouped));
  } catch (e) { next(e); }
};
