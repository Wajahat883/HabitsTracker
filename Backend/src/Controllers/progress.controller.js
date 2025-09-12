import Habit from "../Models/Habit.js";
import HabitLog from "../Models/HabitLog.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiErros.js";
import { calculateDailyStreak, fillDateRange } from "../utils/streak.js";

function todayStr() { return new Date().toISOString().slice(0,10); }

export const progressSummary = async (req, res, next) => {
  try {
    const { range = '30d' } = req.query;
    const days = parseInt(range) || 30;
    const endDate = todayStr();
    const startDate = new Date(Date.now() - (days-1)*86400000).toISOString().slice(0,10);

    const habits = await Habit.find({ user: req.user.userId, isArchived: false });
    const logs = await HabitLog.find({ user: req.user.userId, date: { $gte: startDate, $lte: endDate } });

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

export const habitTrend = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;
    const habit = await Habit.findOne({ _id: id, user: req.user.userId });
    if (!habit) throw new ApiError(404,'Habit not found');
    const endDate = todayStr();
    const startDate = new Date(Date.now() - (days-1)*86400000).toISOString().slice(0,10);
    const logs = await HabitLog.find({ habit: id, user: req.user.userId, date: { $gte: startDate, $lte: endDate } });
    const byDate = logs.reduce((a,l)=>{a[l.date]=l.status;return a;},{});
    const filled = fillDateRange(startDate, endDate).map(d => ({ date: d, status: byDate[d] || null }));
    return res.json(new ApiResponse(200, filled));
  } catch (e) { next(e); }
};
