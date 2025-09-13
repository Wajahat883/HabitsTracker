import Habit from "../Models/Habit.js";
import HabitLog from "../Models/HabitLog.js";
import Group from "../Models/Group.js";
import User from "../Models/User.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiErros.js";
import { calculateDailyStreak, fillDateRange } from "../utils/streak.js";

function todayStr() { return new Date().toISOString().slice(0,10); }

export const progressSummary = async (req, res, next) => {
  try {
    const { range = '30d', userId } = req.query;
    const targetUser = userId || req.user.userId;
    const days = parseInt(range) || 30;
    const endDate = todayStr();
    const startDate = new Date(Date.now() - (days-1)*86400000).toISOString().slice(0,10);

    const habits = await Habit.find({ user: targetUser, isArchived: false });
    const logs = await HabitLog.find({ user: targetUser, date: { $gte: startDate, $lte: endDate } });

    const logsByHabit = logs.reduce((acc,l)=>{ acc[l.habit] = acc[l.habit]||[]; acc[l.habit].push(l); return acc;},{});
    Object.values(logsByHabit).forEach(arr => arr.sort((a,b)=> b.date.localeCompare(a.date)));

  let totalRequired = 0, totalCompleted = 0, streaks = [];
  const habitStreaks = [];
    for (const h of habits) {
      // assume daily requirement for now (improve later for weekly/monthly)
      const habitLogs = logsByHabit[h._id] || [];
  const streak = calculateDailyStreak(habitLogs, 1); // allow 1 missed day tolerance
  streaks.push(streak);
  habitStreaks.push({ habitId: h._id, title: h.title, streak });
      const dateSet = new Set(habitLogs.map(l=>l.date));
      totalRequired += days; // naive daily assumption
      totalCompleted += habitLogs.filter(l => l.status === 'completed').length;
    }
    const overallCompletion = totalRequired ? Number(((totalCompleted/totalRequired)*100).toFixed(1)) : 0;
    const avgStreak = streaks.length ? Number((streaks.reduce((a,b)=>a+b,0)/streaks.length).toFixed(1)) : 0;
    const longestStreak = streaks.length ? Math.max(...streaks) : 0;
  habitStreaks.sort((a,b)=> b.streak - a.streak);
  return res.json(new ApiResponse(200, { overallCompletion, activeHabits: habits.length, avgStreak, longestStreak, habitStreaks }));
  } catch (e) { next(e); }
};

export const heatmap = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const start = `${year}-01-01`; const end = `${year}-12-31`;
    const logs = await HabitLog.find({ user: req.user.userId, date: { $gte: start, $lte: end }, status: 'completed' });
    const countMap = {};
    for (const l of logs) { countMap[l.date] = (countMap[l.date]||0) + 1; }
    const dates = Object.keys(countMap).sort();
    const data = dates.map(d => ({ date: d, completedCount: countMap[d] }));
    return res.json(new ApiResponse(200, data));
  } catch (e) { next(e); }
};

export const groupProgress = async (req, res, next) => {
  try {
    const group = await Group.findOne({ _id: req.params.id, members: req.user.userId });
    if (!group) throw new ApiError(404, 'Group not found');
    const habits = await Habit.find({ group: group._id, isArchived: false });
    const logs = await HabitLog.find({ habit: { $in: habits.map(h => h._id) }, date: { $gte: startDate, $lte: endDate } });
    // Aggregate similar to summary but for group
    const totalRequired = habits.length * days;
    const totalCompleted = logs.filter(l => l.status === 'completed').length;
    const completion = totalRequired ? Number(((totalCompleted / totalRequired) * 100).toFixed(1)) : 0;
    return res.json(new ApiResponse(200, { completion, habits: habits.length, completed: totalCompleted }));
  } catch (e) { next(e); }
};

export const allUsersProgress = async (req, res, next) => {
  try {
    const { range = '30d' } = req.query;
    const days = parseInt(range) || 30;
    const endDate = todayStr();
    const startDate = new Date(Date.now() - (days-1)*86400000).toISOString().slice(0,10);
    // Simplified: get all users' summary (in real app, limit or paginate)
    const users = await User.find({}).select('_id name');
    const summaries = [];
    for (const u of users) {
      const habits = await Habit.find({ user: u._id, isArchived: false });
      const logs = await HabitLog.find({ user: u._id, date: { $gte: startDate, $lte: endDate } });
      const streaks = habits.map(h => calculateDailyStreak(logs.filter(l => l.habit.equals(h._id)), 1));
      const avgStreak = streaks.length ? Number((streaks.reduce((a,b)=>a+b,0)/streaks.length).toFixed(1)) : 0;
      summaries.push({ userId: u._id, name: u.name, avgStreak, habits: habits.length });
    }
    return res.json(new ApiResponse(200, summaries));
  } catch (e) { next(e); }
};

export const habitTrend = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;
    const habit = await Habit.findById(id);
    if (!habit) return next(new ApiError(404, 'Habit not found'));
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - parseInt(days));
    const logs = await HabitLog.find({ habit: id, date: { $gte: startDate.toISOString().slice(0,10), $lte: endDate.toISOString().slice(0,10) } }).sort('date');
    const dates = fillDateRange(startDate, endDate);
    const trend = dates.map(d => {
      const log = logs.find(l => l.date === d);
      return { date: d, status: log ? log.status : 'missed' };
    });
    return res.json(new ApiResponse(200, trend));
  } catch (e) { next(e); }
};
