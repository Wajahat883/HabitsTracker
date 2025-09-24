import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useHabitContext } from "../context/useHabitContext";
import HabitForm from "../Components/Habits/HabitForm";
import HabitTracker from "../Components/Habits/HabitTracker";
import UserSearch from "../Components/Friends/UserSearch";
import AllUsersList from "../Components/Friends/AllUsersList";
import SocialFeaturesTest from "../Components/Common/SocialFeaturesTest";
import AreaManagerModal from "../Components/Areas/AreaManagerModal";
import MilestoneNotification from "../Components/Common/MilestoneNotification";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { FaUsers, FaFire, FaCalendarAlt, FaTrophy, FaRocket, FaBolt, FaHeart, FaStar } from "react-icons/fa";
import HabitTodo from "../Components/Habits/HabitTodo";
import ProgressSummary from "../Components/Progress/ProgressSummary";
import CalendarHeatmap from "../Components/Progress/CalendarHeatmap";
import PerHabitSummary from "../Components/Progress/PerHabitSummary";
import GroupForm from "../Components/Groups/GroupForm";
import FriendsList from "../Components/Friends/FriendsList";
import InviteFriends from "../Components/Friends/InviteFriends";
import DynamicTracker from "../Components/Habits/DynamicTracker";
import { fetchFriendsProgress } from "../api/progress";
import { useCompletion } from "../context/CompletionContext";
import { getUserStats, saveUserStats, calculateEnhancedStats, getDynamicGreeting, cleanupOldData } from "../utils/streakUtils";
// import { enhancedProgressAPI, syncStreakData } from "../services/enhancedProgressAPI"; // Disabled for now

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalHabits: 0,
    activeStreaks: 0,
    weeklyProgress: 0,
    completionRate: 0,
    longestStreak: 0,
    todayCompleted: 0
  });

  // Areas local state
  const [areas, setAreas] = useState(() => {
    try {
      const raw = localStorage.getItem('habitTracker_areas_v3');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  
  const [editingArea, setEditingArea] = useState(null);
  const [areaNameDraft, setAreaNameDraft] = useState('');
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [showAreaManager, setShowAreaManager] = useState(false);
  
  // Remove unused state
  // const [timeOfDay, setTimeOfDay] = useState(''); - removed since we use greetingData now
  
  // Dynamic Progress State
  const [dynamicProgressData, setDynamicProgressData] = useState({});
  const [friendsProgress, setFriendsProgress] = useState([]);

  // Context data
  const {
    habits = [],
    groups = [],
    selectedFriend,
    setSelectedFriend,
    friendProgress,
    progressSummary,
    friends = [],
    loadHabits,
    fetchFriendProgressData,
  } = useHabitContext();
  
  const { ensureLoaded, getStreak } = useCompletion();

  // Derived data
  const uniqueFriends = useMemo(() => {
    const seen = new Set();
    return friends.filter(friend => {
      if (seen.has(friend._id)) return false;
      seen.add(friend._id);
      return true;
    });
  }, [friends]);

  // Enhanced streak tracking system with localStorage persistence
  const [userStats, setUserStats] = useState(() => {
    try {
      return getUserStats();
    } catch (error) {
      console.error('Error initializing user stats:', error);
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
          weekStart: new Date().toISOString().split('T')[0]
        }
      };
    }
  });
  const [milestones, setMilestones] = useState([]);

  // Dynamic greeting state
  const [greetingData, setGreetingData] = useState(() => getDynamicGreeting(userStats));

  // Update greeting every minute
  useEffect(() => {
    const updateGreeting = () => setGreetingData(getDynamicGreeting(userStats));
    updateGreeting();
    
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, [userStats]);

  // Enhanced stats calculation with streak persistence and backend sync
  const calculateStats = useCallback(async () => {
    try {
      // Ensure we have valid data
      if (!habits || !Array.isArray(habits)) {
        console.warn('Habits data is not valid, skipping stats calculation');
        return;
      }

      if (!dynamicProgressData || typeof dynamicProgressData !== 'object') {
        console.warn('Dynamic progress data is not valid, skipping stats calculation');
        return;
      }

      // Get current user stats to avoid stale closure
      const currentUserStats = getUserStats();

      if (!currentUserStats) {
        console.warn('User stats is not valid, skipping stats calculation');
        return;
      }

      // First calculate using local data
      const result = calculateEnhancedStats(habits, dynamicProgressData, currentUserStats);
      
      if (!result) {
        console.error('calculateEnhancedStats returned null/undefined');
        return;
      }
      
      // Update local state immediately
      if (result.dashboardStats) {
        setDashboardStats(result.dashboardStats);
      }
      
      if (result.userStats) {
        setUserStats(result.userStats);
      }
      
      // Show milestone notifications if any new milestones were achieved
      if (result.newMilestones && Array.isArray(result.newMilestones) && result.newMilestones.length > 0) {
        setMilestones(result.newMilestones);
      }

      // Backend sync disabled - using local storage only for now
      // This prevents network errors when backend server isn't running
      
      // Future: Enable this when backend is available
      // if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      //   try {
      //     const syncedStats = await syncStreakData(result.userStats);
      //     if (syncedStats && syncedStats !== result.userStats) {
      //       setUserStats(syncedStats);
      //       saveUserStats(syncedStats);
      //     }
      //   } catch {
      //     console.log('Backend sync skipped (server not available)');
      //   }
      // }
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  }, [habits, dynamicProgressData]); // Removed userStats to prevent infinite loop

  // Cleanup old data periodically
  useEffect(() => {
    try {
      cleanupOldData();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }, []);

  // Chart data for habit progress
  const chartData = useMemo(() => {
    const labels = habits.slice(0, 6).map(h => h.title.length > 12 ? h.title.substring(0, 12) + '...' : h.title);
    const streakData = habits.slice(0, 6).map(h => getStreak(h._id));
    
    return {
      labels,
      datasets: [{
        label: 'Streak Days',
        data: streakData,
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)'
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(139, 92, 246)',
          'rgb(236, 72, 153)'
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    };
  }, [habits, getStreak]);

  // Completion rate chart data
  const completionChartData = useMemo(() => {
    const completed = dashboardStats.todayCompleted;
    const remaining = Math.max(0, dashboardStats.totalHabits - completed);
    
    return {
      labels: ['Completed', 'Remaining'],
      datasets: [{
        data: [completed, remaining],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(107, 114, 128, 0.3)'
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(107, 114, 128)'
        ],
        borderWidth: 2,
      }]
    };
  }, [dashboardStats]);

  // Weekly progress chart data
  const weeklyProgressData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const progressData = days.map(() => Math.floor(Math.random() * 100)); // Mock data - replace with real data
    
    return {
      labels: days,
      datasets: [{
        label: 'Weekly Progress',
        data: progressData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
      }]
    };
  }, []);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'var(--color-text-muted)', font: { size: 12 } },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: 'var(--color-text-muted)', font: { size: 12 } },
      },
    },
  };

  // Area management functions
  const saveAreaEdit = useCallback(() => {
    if (!areaNameDraft.trim() || !editingArea) { 
      setEditingArea(null); 
      return;
    }
    setAreas(prev => prev.map(a => a.id === editingArea.id ?
       { ...a, name: areaNameDraft.trim() } : 
       a));
    setEditingArea(null);
  }, [areaNameDraft, editingArea]);
  
  const cancelAreaEdit = useCallback(() => setEditingArea(null), []);

  // Dynamic progress loading
  useEffect(() => {
    const loadDynamicProgress = async () => {
      try {
        setIsLoading(true);
        await ensureLoaded();
        
        const progressData = {};
        
        for (const habit of habits) {
          try {
            const currentStreak = getStreak(habit._id);
            const weeklyProgress = Math.min(100, Math.round((currentStreak / 7) * 100));
            const todayCompleted = Math.random() > 0.5; // Mock - replace with real logic
            
            progressData[habit._id] = {
              habit,
              currentStreak,
              weeklyProgress,
              todayCompleted,
              totalCompleted: currentStreak,
            };
          } catch (error) {
            console.error(`Error processing habit ${habit._id}:`, error);
          }
        }
        
        setDynamicProgressData(progressData);
        
      } catch (error) {
        console.error('Error loading dynamic progress data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (habits.length > 0) {
      loadDynamicProgress();
    }
  }, [ensureLoaded, habits, getStreak]);

  // Calculate stats when data changes
  const dynamicProgressKeys = useMemo(() => Object.keys(dynamicProgressData).length, [dynamicProgressData]);
  
  useEffect(() => {
    if (habits.length > 0 && dynamicProgressKeys > 0) {
      calculateStats();
    }
  }, [habits.length, dynamicProgressKeys, calculateStats]);

  // Friends progress loading
  useEffect(() => {
    if (friends.length === 0) { 
      setFriendsProgress([]); 
      return; 
    }
    let ignore = false;
    fetchFriendsProgress('30d').then(data => { 
      if (!ignore) setFriendsProgress(data || []); 
    }).catch(() => {});
    return () => { ignore = true; };
  }, [friends.length]);

  // Enhanced time-of-day updates - removed redundant useEffect since it's handled above

  // Listen for section changes
  useEffect(() => {
    const handler = (e) => { 
      const next = e.detail; 
      if (next) setActiveSection(next); 
    };
    window.addEventListener('dashboardSectionChange', handler);
    return () => window.removeEventListener('dashboardSectionChange', handler);
  }, []);

  // Persist areas
  useEffect(() => {
    try { 
      localStorage.setItem('habitTracker_areas_v3', JSON.stringify(areas)); 
    } catch { 
      // ignore persist errors 
    }
  }, [areas]);

  const StatCard = ({ icon: IconComponent, title, value, subtitle, color, trend }) => (
    <div className="relative group">
      <div className={`absolute inset-0 bg-gradient-to-r ${color} rounded-2xl blur-xl transition-all duration-300 group-hover:blur-2xl opacity-20`}></div>
      <div className="relative backdrop-blur-xl border rounded-2xl p-6 transition-all duration-300 hover:scale-105 transform" 
           style={{background: 'var(--glass-bg)', borderColor: 'var(--glass-border)'}}>
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 bg-gradient-to-r ${color} rounded-xl shadow-lg icon-bounce`}>
            <IconComponent className="w-6 h-6 text-white" />
          </div>
          {trend && (
            <div className="text-xs text-green-500 font-medium">
              +{trend}%
            </div>
          )}
        </div>
        <div className="text-right">
          <p className={`text-3xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent count-up`}>
            {value}
          </p>
          <p className="text-sm font-medium" style={{color: 'var(--color-text)'}}>{title}</p>
          <p className="text-xs opacity-75" style={{color: 'var(--color-text-muted)'}}>{subtitle}</p>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'var(--gradient-bg)'}}>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 animate-pulse"></div>
          <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center">
            <div className="loading-shimmer w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4"></div>
            <h3 className="text-xl font-bold mb-2" style={{color: 'var(--color-text)'}}>Loading Dashboard</h3>
            <p className="text-sm opacity-75" style={{color: 'var(--color-text-muted)'}}>
              Preparing your habit data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{background: 'var(--gradient-bg)'}}>
      {/* Milestone Notifications */}
      {milestones.length > 0 && (
        <MilestoneNotification 
          milestones={milestones} 
          onDismiss={() => setMilestones([])} 
        />
      )}
      
      {/* Enhanced Navigation Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b" style={{
        background: 'var(--glass-bg)',
        borderColor: 'var(--glass-border)'
      }}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="relative float">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg animate-gradient">
                  <FaRocket className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="p-10">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-snug">
                  {greetingData.greeting}!
                </h1>
                {/* <p className="text-sm opacity-75" style={{color: 'var(--color-text-muted)'}}>
                  {greetingData.subMessage}
                </p> */}
                {/* <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span>🔥 Overall Streak: {userStats.currentOverallStreak}</span>
                  <span>📊 Best: {userStats.longestOverallStreak}</span>
                  <span>✅ Total Completed: {userStats.totalHabitsCompleted}</span>
                </div> */}
              </div>
            </div>
            {/* <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowHabitForm(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 btn-press"
              >
                <FaBolt className="w-4 h-4 inline mr-2" />
                New Habit
              </button>
            </div> */}
          </div>
          
          {/* Enhanced Navigation Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 stagger-children">
            {[
              { id: "Dashboard", label: "🏠 Overview", icon: FaRocket },
              { id: "Progress", label: "📈 Progress", icon: FaTrophy },
              { id: "Habit Todo", label: "✅ Tasks", icon: FaCalendarAlt },
              { id: "Social Hub", label: "🌍 Community", icon: FaUsers },
              { id: "Friends", label: "👥 Friends", icon: FaHeart },
              { id: "Status", label: "⚡ Status", icon: FaBolt }
            ].map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-300 transform hover:scale-105 btn-press
                  ${activeSection === section.id 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                    : 'hover:bg-white/10 backdrop-blur-sm'
                  }
                `}
                style={{
                  color: activeSection === section.id ? 'white' : 'var(--color-text)',
                  borderColor: activeSection === section.id ? 'transparent' : 'var(--color-border)'
                }}
              >
                {section.label}
              </button>
            ))}
            {/* <button
              onClick={() => setShowAreaManager(true)}
              className="px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-300 transform hover:scale-105 border-2 border-dashed btn-press"
              style={{
                color: 'var(--color-text-muted)',
                borderColor: 'var(--color-border)'
              }}
            >
              + Area
            </button> */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Modals */}
          {editingArea && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadein" onClick={(e) => { if(e.target === e.currentTarget) cancelAreaEdit(); }}>
              <div className="relative backdrop-blur-xl border rounded-2xl p-6 w-full max-w-sm animate-pop" style={{background: 'var(--glass-bg)', borderColor: 'var(--glass-border)'}}>
                <button className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-xl" onClick={cancelAreaEdit} aria-label="Close">✕</button>
                <h4 className="text-blue-400 font-bold mb-4 text-lg">Edit Area</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>Area Name</label>
                    <input
                      autoFocus
                      type="text"
                      value={areaNameDraft}
                      onChange={(e) => setAreaNameDraft(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveAreaEdit()}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Enter area name"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={saveAreaEdit} className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium hover:shadow-lg transition-all btn-press">
                      Save
                    </button>
                    <button onClick={cancelAreaEdit} className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-all btn-press">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {showAreaManager && (
            <AreaManagerModal
              areas={areas}
              onCreate={(area) => { setAreas(prev => [area, ...prev]); setActiveSection(`AREA_${area.id}`); setShowAreaManager(false); }}
              onSelect={(area) => { setActiveSection(`AREA_${area.id}`); setShowAreaManager(false); }}
              onClose={() => setShowAreaManager(false)}
            />
          )}
          
          {showHabitForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadein" onClick={(e) => { if(e.target === e.currentTarget) setShowHabitForm(false); }}>
              <div className="relative backdrop-blur-xl border rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{background: 'var(--glass-bg)', borderColor: 'var(--glass-border)'}}>
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">Create New Habit</h3>
                  <button 
                    onClick={() => setShowHabitForm(false)}
                    className="text-gray-400 hover:text-white text-2xl transition-colors btn-press"
                  >
                    ×
                  </button>
                </div>
                <div className="p-6">
                  <HabitForm onCreated={() => setShowHabitForm(false)} />
                </div>
              </div>
            </div>
          )}

          {/* Dashboard Content */}
          {activeSection === "Dashboard" && (
            <div className="space-y-8">
              {/* Hero Stats Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 stagger-children">
                <StatCard
                  icon={FaBolt}
                  title="Total Habits"
                  value={dashboardStats.totalHabits}
                  subtitle={`${dashboardStats.totalHabits > 0 ? 'Keep growing!' : 'Start your journey'}`}
                  color="from-blue-500 to-cyan-500"
                  trend={dashboardStats.totalHabits > 0 ? 5 : null}
                />
                <StatCard
                  icon={FaFire}
                  title="Active Streaks"
                  value={dashboardStats.activeStreaks}
                  subtitle="On fire today!"
                  color="from-orange-500 to-red-500"
                  trend={dashboardStats.activeStreaks > 0 ? 12 : null}
                />
                <StatCard
                  icon={FaTrophy}
                  title="Weekly Progress"
                  value={`${dashboardStats.weeklyProgress}%`}
                  subtitle="This week's avg"
                  color="from-purple-500 to-pink-500"
                  trend={dashboardStats.weeklyProgress > 50 ? 8 : null}
                />
                <StatCard
                  icon={FaStar}
                  title="Completion Rate"
                  value={`${dashboardStats.completionRate}%`}
                  subtitle="Overall success"
                  color="from-green-500 to-emerald-500"
                  trend={dashboardStats.completionRate > 70 ? 15 : null}
                />
                <StatCard
                  icon={FaRocket}
                  title="Longest Streak"
                  value={dashboardStats.longestStreak}
                  subtitle="Personal best"
                  color="from-indigo-500 to-purple-500"
                  trend={dashboardStats.longestStreak > 7 ? 25 : null}
                />
                <StatCard
                  icon={FaHeart}
                  title="Overall Streak"
                  value={userStats.currentOverallStreak}
                  subtitle={`Best: ${userStats.longestOverallStreak}`}
                  color="from-pink-500 to-rose-500"
                  trend={userStats.currentOverallStreak > userStats.longestOverallStreak * 0.8 ? 20 : null}
                />
                <StatCard
                  icon={FaCalendarAlt}
                  title="Today Done"
                  value={dashboardStats.todayCompleted}
                  subtitle={`${dashboardStats.totalHabits - dashboardStats.todayCompleted} remaining`}
                  color="from-cyan-500 to-blue-500"
                  trend={dashboardStats.todayCompleted > 0 ? 10 : null}
                />
              </div>

              {/* Main Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {/* Today's Completion Chart */}
                <div className="relative group reveal-card">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative backdrop-blur-xl border rounded-3xl p-8 card-hover" 
                       style={{background: 'var(--glass-bg)', borderColor: 'var(--glass-border)'}}>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-lg">
                        <FaTrophy className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                          Today's Progress
                        </h3>
                        <p className="text-sm opacity-75" style={{color: 'var(--color-text-muted)'}}>
                          {dashboardStats.todayCompleted} of {dashboardStats.totalHabits} completed
                        </p>
                      </div>
                    </div>
                    <div className="h-48">
                      <Doughnut data={completionChartData} options={{
                        ...chartOptions,
                        cutout: '60%',
                        plugins: {
                          ...chartOptions.plugins,
                          legend: { display: false }
                        }
                      }} />
                    </div>
                  </div>
                </div>

                {/* Habit Streaks Chart */}
                <div className="relative group reveal-card">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative backdrop-blur-xl border rounded-3xl p-8 card-hover" 
                       style={{background: 'var(--glass-bg)', borderColor: 'var(--glass-border)'}}>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
                        <FaFire className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                          Habit Streaks
                        </h3>
                        <p className="text-sm opacity-75" style={{color: 'var(--color-text-muted)'}}>
                          Current streak performance
                        </p>
                      </div>
                    </div>
                    <div className="h-48">
                      <Bar data={chartData} options={chartOptions} />
                    </div>
                  </div>
                </div>

                {/* Weekly Trend */}
                <div className="relative group reveal-card">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative backdrop-blur-xl border rounded-3xl p-8 card-hover" 
                       style={{background: 'var(--glass-bg)', borderColor: 'var(--glass-border)'}}>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                        <FaCalendarAlt className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                          Weekly Trend
                        </h3>
                        <p className="text-sm opacity-75" style={{color: 'var(--color-text-muted)'}}>
                          Progress over time
                        </p>
                      </div>
                    </div>
                    <div className="h-48">
                      <Line data={weeklyProgressData} options={chartOptions} />
                    </div>
                  </div>
                </div>

                {/* Friends Activity */}
                <div className="relative group reveal-card">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative backdrop-blur-xl border rounded-3xl p-8 card-hover" 
                       style={{background: 'var(--glass-bg)', borderColor: 'var(--glass-border)'}}>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg">
                        <FaUsers className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                          Friends Network
                        </h3>
                        <p className="text-sm opacity-75" style={{color: 'var(--color-text-muted)'}}>
                          {uniqueFriends.length} connections
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {uniqueFriends.slice(0, 3).map((friend) => (
                        <div key={friend._id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {(friend.username || friend.name || 'F')[0].toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium" style={{color: 'var(--color-text)'}}>
                              {friend.username || friend.name || 'Unknown'}
                            </span>
                          </div>
                          <div className="w-2 h-2 bg-green-400 rounded-full pulse-glow"></div>
                        </div>
                      ))}
                      {uniqueFriends.length === 0 && (
                        <div className="text-center py-4">
                          <p className="text-sm opacity-75" style={{color: 'var(--color-text-muted)'}}>
                            No friends added yet
                          </p>
                          <button 
                            onClick={() => setActiveSection('Friends')}
                            className="mt-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                          >
                            Add friends →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other Sections */}
          {activeSection === "Progress" && (
            <div className="space-y-8 stagger-children">
              <div className="reveal-card">
                <PerHabitSummary />
              </div>
              <div className="reveal-card">
                <ProgressSummary />
              </div>
              <div className="reveal-card">
                <CalendarHeatmap />
              </div>
            </div>
          )}

          {activeSection === "Habit Todo" && (
            <div className="reveal-card">
              <HabitTodo />
            </div>
          )}

          {activeSection === "Social Hub" && (
            <div className="space-y-8 stagger-children">
              <div className="relative reveal-card">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-xl"></div>
                <div className="relative backdrop-blur-xl border rounded-3xl p-8" 
                     style={{background: 'var(--glass-bg)', borderColor: 'var(--glass-border)'}}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                      <FaUsers className="text-white text-2xl" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                        Social Hub
                      </h2>
                      <p className="opacity-75" style={{color: 'var(--color-text-muted)'}}>
                        Discover and connect with the community
                      </p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <UserSearch />
                    <AllUsersList />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "Friends" && (
            <div className="space-y-8 stagger-children">
              <div className="relative reveal-card">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-3xl blur-xl"></div>
                <div className="relative backdrop-blur-xl border rounded-3xl p-8" 
                     style={{background: 'var(--glass-bg)', borderColor: 'var(--glass-border)'}}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                      <FaHeart className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                        Friends
                      </h2>
                      <p className="opacity-75" style={{color: 'var(--color-text-muted)'}}>
                        Manage your connections and network
                      </p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <FriendsList showProgress={true} />
                    <InviteFriends onInviteSent={() => loadHabits()} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "Status" && (
            <div className="reveal-card">
              <SocialFeaturesTest />
            </div>
          )}

          {/* Area Sections */}
          {areas.map(a => (
            activeSection === `AREA_${a.id}` && (
              <div key={a.id} className="space-y-6 reveal-card">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative backdrop-blur-xl border rounded-3xl p-8" 
                       style={{background: 'var(--glass-bg)', borderColor: 'var(--glass-border)'}}>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl shadow-lg">
                          <FaStar className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                            Area: {a.name}
                          </h2>
                          <p className="text-sm opacity-75" style={{color: 'var(--color-text-muted)'}}>
                            Created {new Date(a.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setShowAreaManager(true)} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-medium transition-all duration-300 btn-press">
                          Manage Areas
                        </button>
                        <button onClick={() => setActiveSection('Dashboard')} className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-medium transition-all duration-300 btn-press">
                          Back
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="backdrop-blur-sm border rounded-2xl p-6" style={{background: 'var(--glass-bg)', borderColor: 'var(--glass-border)'}}>
                          <h4 className="text-lg font-bold text-blue-400 mb-4">Create Habit in this Area</h4>
                          <HabitForm onCreated={(habit) => {
                            setAreas(prev => prev.map(ar => ar.id === a.id ? { ...ar, habits: [habit._id, ...(ar.habits||[])] } : ar));
                          }} />
                        </div>
                        <div className="backdrop-blur-sm border rounded-2xl p-6" style={{background: 'var(--glass-bg)', borderColor: 'var(--glass-border)'}}>
                          <h4 className="text-lg font-bold text-green-400 mb-4">Create Habit Group</h4>
                          <GroupForm onCreated={(group) => {
                            setAreas(prev => prev.map(ar => ar.id === a.id ? { ...ar, groups: [group._id, ...(ar.groups||[])] } : ar));
                          }} />
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="backdrop-blur-sm border rounded-2xl p-6" style={{background: 'var(--glass-bg)', borderColor: 'var(--glass-border)'}}>
                          <h5 className="text-sm font-bold text-blue-300 mb-4">Habits</h5>
                          {a.habits?.length ? (
                            <ul className="space-y-3 text-sm max-h-64 overflow-y-auto">
                              {a.habits.map(id => {
                                const habit = habits.find(h => h._id === id);
                                return (
                                  <li key={`area-${a.id}-habit-${id}`} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                                    <span className="w-3 h-3 rounded-full" style={{ background: habit?.colorTag || '#64748b' }}></span>
                                    <span style={{color: 'var(--color-text)'}}>{habit?.title || 'Unknown Habit'}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <div className="text-sm opacity-75" style={{color: 'var(--color-text-muted)'}}>No habits yet.</div>
                          )}
                        </div>
                        
                        <div className="backdrop-blur-sm border rounded-2xl p-6" style={{background: 'var(--glass-bg)', borderColor: 'var(--glass-border)'}}>
                          <h5 className="text-sm font-bold text-green-300 mb-4">Groups</h5>
                          {a.groups?.length ? (
                            <ul className="space-y-3 text-sm max-h-64 overflow-y-auto">
                              {a.groups.map(id => {
                                const group = groups.find(g => g._id === id);
                                return (
                                  <li key={`area-${a.id}-group-${id}`} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                                    <FaUsers className="text-purple-400" />
                                    <span style={{color: 'var(--color-text)'}}>{group?.name || 'Unknown Group'}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <div className="text-sm opacity-75" style={{color: 'var(--color-text-muted)'}}>No groups yet.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;