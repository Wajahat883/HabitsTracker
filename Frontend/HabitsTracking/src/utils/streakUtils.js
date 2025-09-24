// Enhanced streak tracking utilities with localStorage persistence

const STORAGE_KEYS = {
  USER_STATS: 'habitTracker_userStats',
  STREAK_MILESTONES: 'habitTracker_streakMilestones',
  DAILY_PROGRESS: 'habitTracker_dailyProgress'
};

// Initialize or get user stats from localStorage
export const getUserStats = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.USER_STATS);
    const defaultStats = {
      longestOverallStreak: 0,
      currentOverallStreak: 0,
      totalHabitsCompleted: 0,
      streakHistory: [],
      milestones: [],
      lastUpdated: new Date().toISOString(),
      streakBreakHistory: [],
      weeklyStats: {
        completedThisWeek: 0,
        weekStart: getWeekStart()
      }
    };
    
    if (!saved) {
      return defaultStats;
    }
    
    const parsed = JSON.parse(saved);
    // Ensure all required arrays exist
    return {
      ...defaultStats,
      ...parsed,
      streakHistory: Array.isArray(parsed.streakHistory) ? parsed.streakHistory : [],
      milestones: Array.isArray(parsed.milestones) ? parsed.milestones : [],
      streakBreakHistory: Array.isArray(parsed.streakBreakHistory) ? parsed.streakBreakHistory : [],
      weeklyStats: parsed.weeklyStats || defaultStats.weeklyStats
    };
  } catch (error) {
    console.error('Error loading user stats:', error);
    return {
      longestOverallStreak: 0,
      currentOverallStreak: 0,
      totalHabitsCompleted: 0,
      streakHistory: [],
      milestones: [],
      lastUpdated: new Date().toISOString(),
      streakBreakHistory: [],
      weeklyStats: {
        completedThisWeek: 0,
        weekStart: getWeekStart()
      }
    };
  }
};

// Save user stats to localStorage
export const saveUserStats = (stats) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify({
      ...stats,
      lastUpdated: new Date().toISOString()
    }));
    return true;
  } catch (error) {
    console.error('Error saving user stats:', error);
    return false;
  }
};

// Get start of current week (Sunday)
export const getWeekStart = () => {
  const now = new Date();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - now.getDay());
  sunday.setHours(0, 0, 0, 0);
  return sunday.toISOString();
};

// Check if a milestone was reached
export const checkMilestones = (currentStreak, previousStreak) => {
  const milestones = [5, 10, 25, 50, 100, 200, 365, 500, 1000];
  const newMilestones = [];
  
  milestones.forEach(milestone => {
    if (currentStreak >= milestone && previousStreak < milestone) {
      newMilestones.push({
        type: 'streak',
        value: milestone,
        achieved: new Date().toISOString(),
        title: `${milestone} Day Streak!`,
        description: `Maintained your habit streak for ${milestone} consecutive days`,
        emoji: getMilestoneEmoji(milestone)
      });
    }
  });
  
  return newMilestones;
};

// Get appropriate emoji for milestone
export const getMilestoneEmoji = (streak) => {
  if (streak >= 1000) return '👑';
  if (streak >= 365) return '🏆';
  if (streak >= 200) return '💎';
  if (streak >= 100) return '🚀';
  if (streak >= 50) return '⭐';
  if (streak >= 25) return '🔥';
  if (streak >= 10) return '💪';
  if (streak >= 5) return '🎯';
  return '✅';
};

// Calculate enhanced stats with streak tracking
export const calculateEnhancedStats = (habits, dynamicProgressData, currentStats) => {
  const totalHabits = habits.length;
  const progressValues = Object.values(dynamicProgressData);
  const activeStreaks = progressValues.filter(p => p.currentStreak > 0).length;
  const weeklyProgress = progressValues.length > 0
    ? Math.round(progressValues.reduce((sum, p) => sum + p.weeklyProgress, 0) / progressValues.length)
    : 0;
  const completionRate = Math.round((activeStreaks / Math.max(totalHabits, 1)) * 100);
  const longestStreak = Math.max(0, ...progressValues.map(p => p.currentStreak));
  const todayCompleted = progressValues.filter(p => p.todayCompleted).length;
  
  // Calculate overall user streak (sum of all active habit streaks)
  const currentOverallStreak = progressValues.reduce((sum, p) => sum + p.currentStreak, 0);
  
  // Check for new milestones
  const newMilestones = checkMilestones(currentOverallStreak, currentStats.currentOverallStreak);
  
  // Check if we need to reset weekly stats
  const weekStart = getWeekStart();
  const resetWeeklyStats = weekStart !== currentStats.weeklyStats?.weekStart;
  
  // Ensure arrays exist and are valid
  const safeStreakHistory = Array.isArray(currentStats.streakHistory) ? currentStats.streakHistory : [];
  const safeMilestones = Array.isArray(currentStats.milestones) ? currentStats.milestones : [];
  const safeNewMilestones = Array.isArray(newMilestones) ? newMilestones : [];
  
  // Update stats
  const updatedStats = {
    longestOverallStreak: Math.max(currentStats.longestOverallStreak || 0, currentOverallStreak),
    currentOverallStreak,
    totalHabitsCompleted: resetWeeklyStats 
      ? todayCompleted 
      : (currentStats.totalHabitsCompleted || 0) + todayCompleted,
    streakHistory: [
      ...safeStreakHistory.slice(-29), // Keep last 30 days
      {
        date: new Date().toISOString().split('T')[0],
        streak: currentOverallStreak,
        habitsCompleted: todayCompleted,
        activeHabits: totalHabits
      }
    ],
    milestones: [...safeMilestones, ...safeNewMilestones],
    weeklyStats: {
      completedThisWeek: resetWeeklyStats ? todayCompleted : (currentStats.weeklyStats?.completedThisWeek || 0) + todayCompleted,
      weekStart: weekStart
    },
    streakBreakHistory: Array.isArray(currentStats.streakBreakHistory) ? currentStats.streakBreakHistory : [],
    lastUpdated: new Date().toISOString()
  };
  
  // Save to localStorage
  saveUserStats(updatedStats);
  
  return {
    dashboardStats: {
      totalHabits,
      activeStreaks,
      weeklyProgress,
      completionRate,
      longestStreak,
      todayCompleted
    },
    userStats: updatedStats,
    newMilestones
  };
};

// Get greeting based on time and user progress
export const getDynamicGreeting = (userStats = null) => {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  let greeting = '';
  let emoji = '';
  let subMessage = '';
  
  // Time-based greeting
  if (hour >= 5 && hour < 12) {
    greeting = 'Good Morning';
    emoji = '🌅';
    subMessage = 'Rise and shine! Time to conquer your habits';
  } else if (hour >= 12 && hour < 17) {
    greeting = 'Good Afternoon';
    emoji = '☀️';
    subMessage = 'Keep the momentum going strong';
  } else if (hour >= 17 && hour < 21) {
    greeting = 'Good Evening';
    emoji = '🌆';
    subMessage = 'Perfect time to check your progress';
  } else {
    greeting = 'Good Night';
    emoji = '🌙';
    subMessage = 'Time to wind down and reflect';
  }
  
  // Add personalization based on streak data
  if (userStats) {
    if (userStats.currentOverallStreak >= 100) {
      subMessage = `Incredible ${userStats.currentOverallStreak}-day streak! You're unstoppable! 👑`;
    } else if (userStats.currentOverallStreak >= 50) {
      subMessage = `Amazing ${userStats.currentOverallStreak}-day streak! Keep crushing it! 🚀`;
    } else if (userStats.currentOverallStreak >= 10) {
      subMessage = `Great ${userStats.currentOverallStreak}-day streak! You're on fire! 🔥`;
    } else if (userStats.currentOverallStreak > 0) {
      subMessage = `Nice ${userStats.currentOverallStreak}-day streak! Keep it up! 💪`;
    }
  }
  
  // Weekend vs weekday variation
  if (day === 0 || day === 6) {
    const dayName = dayNames[day];
    if (!userStats || userStats.currentOverallStreak < 10) {
      subMessage += ` this ${dayName}`;
    }
  }
  
  return { greeting, emoji, subMessage };
};

// Clean up old data to prevent localStorage bloat
export const cleanupOldData = () => {
  try {
    const stats = getUserStats();
    
    // Keep only last 30 days of streak history
    if (stats.streakHistory && Array.isArray(stats.streakHistory) && stats.streakHistory.length > 30) {
      stats.streakHistory = stats.streakHistory.slice(-30);
    }
    
    // Keep only recent milestones (last 100)
    if (stats.milestones && Array.isArray(stats.milestones) && stats.milestones.length > 100) {
      stats.milestones = stats.milestones.slice(-100);
    }
    
    // Remove streak breaks older than 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    if (stats.streakBreakHistory && Array.isArray(stats.streakBreakHistory)) {
      stats.streakBreakHistory = stats.streakBreakHistory.filter(
        breakRecord => new Date(breakRecord.date) > sixMonthsAgo
      );
    }
    
    saveUserStats(stats);
  } catch (error) {
    console.error('Error cleaning up old data:', error);
  }
};

// Record when a streak is broken
export const recordStreakBreak = (previousStreak, habitId, habitTitle) => {
  try {
    const stats = getUserStats();
    const breakRecord = {
      date: new Date().toISOString(),
      streakLength: previousStreak,
      habitId,
      habitTitle,
      type: 'habit_break'
    };
    
    // Ensure streakBreakHistory is an array
    const safeBreakHistory = Array.isArray(stats.streakBreakHistory) ? stats.streakBreakHistory : [];
    
    stats.streakBreakHistory = [
      ...safeBreakHistory.slice(-19), // Keep last 20 breaks
      breakRecord
    ];
    
    saveUserStats(stats);
  } catch (error) {
    console.error('Error recording streak break:', error);
  }
};

// Get streak insights and suggestions
export const getStreakInsights = (userStats, habits) => {
  const insights = [];
  
  if (userStats.currentOverallStreak === 0) {
    insights.push({
      type: 'motivation',
      message: "Every expert was once a beginner. Start your streak journey today!",
      emoji: '🌱'
    });
  } else if (userStats.currentOverallStreak < 7) {
    insights.push({
      type: 'encouragement',
      message: `You're ${7 - userStats.currentOverallStreak} days away from your first week milestone!`,
      emoji: '🎯'
    });
  } else if (userStats.currentOverallStreak >= userStats.longestOverallStreak * 0.9) {
    insights.push({
      type: 'achievement',
      message: "You're approaching your personal best! Keep pushing!",
      emoji: '🏆'
    });
  }
  
  // Suggest habit diversity
  if (habits.length < 3 && userStats.currentOverallStreak > 10) {
    insights.push({
      type: 'growth',
      message: 'Consider adding another habit to diversify your routine!',
      emoji: '🌟'
    });
  }
  
  return insights;
};

export default {
  getUserStats,
  saveUserStats,
  calculateEnhancedStats,
  getDynamicGreeting,
  cleanupOldData,
  recordStreakBreak,
  getStreakInsights,
  checkMilestones
};