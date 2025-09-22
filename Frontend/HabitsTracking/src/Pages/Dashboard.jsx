import React, { useState, useEffect, useMemo } from "react";
import { useChartData } from "../context/useChartData";
import { useHabitContext } from "../context/useHabitContext";
import HabitForm from "../Components/Habits/HabitForm";
import HabitTracker from "../Components/Habits/HabitTracker";
import UserSearch from "../Components/Friends/UserSearch";
import AllUsersList from "../Components/Friends/AllUsersList";
import SocialFeaturesTest from "../Components/Common/SocialFeaturesTest";
// Area manager feature (re-added per new requirements)
import AreaManagerModal from "../Components/Areas/AreaManagerModal";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { FaUsers } from "react-icons/fa";
import HabitTodo from "../Components/Habits/HabitTodo";
import ProgressSummary from "../Components/Progress/ProgressSummary";
import CalendarHeatmap from "../Components/Progress/CalendarHeatmap";
import PerHabitSummary from "../Components/Progress/PerHabitSummary";
import GroupForm from "../Components/Groups/GroupForm";
import ProfilePage from "../Components/Profile/ProfilePage";
import FriendsList from "../Components/Friends/FriendsList";
import InviteFriends from "../Components/Friends/InviteFriends";
import DynamicTracker from "../Components/Habits/DynamicTracker";
import { fetchFriendsProgress } from "../api/progress";
import { useCompletion } from "../context/CompletionContext";
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// Layout & navigation handled by AppShell

// Example data for user, friend, and comparison
// ...existing code...

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { labels: { color: "#fff" } },
    title: {
      display: false,
    },
  },
  scales: {
    x: {
      grid: { color: "#334155" },
      ticks: { color: "#fff" },
    },
    y: {
      grid: { color: "#334155" },
      ticks: { color: "#fff" },
    },
  },
};


const Dashboard = () => {
  const [activeSection, setActiveSection] = useState("Dashboard");
  
  // Areas local state (persist in localStorage)
  const [areas, setAreas] = useState(() => {
    try {
      const raw = localStorage.getItem('habitTracker_areas_v2');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [editingArea, setEditingArea] = useState(null);
  const [areaNameDraft, setAreaNameDraft] = useState('');
  const [showHabitForm, setShowHabitForm] = useState(false);
  
  const saveAreaEdit = () => {
    if (!areaNameDraft.trim() || !editingArea) { 
      setEditingArea(null); 
      return;
     }
    setAreas(prev => prev.map(a => a.id === editingArea.id ?
       { ...a, name: areaNameDraft.trim() } : 
       a));
    if (activeSection === `AREA_${editingArea.id}`) {
      // trigger re-render; active section label uses area name from state
    }
    setEditingArea(null);
  };
  const cancelAreaEdit = () => setEditingArea(null);
  const [showAreaManager, setShowAreaManager] = useState(false);
  
  // Dynamic Progress State with Enhanced Persistence
  const [dynamicProgressData, setDynamicProgressData] = useState(() => {
    try {
      const saved = localStorage.getItem('habitProgressData_v2');
      if (saved) {
        const { data, timestamp } = JSON.parse(saved);
        // Use persisted data if it's less than 30 minutes old
        if (Date.now() - timestamp < 30 * 60 * 1000) {
          console.log('Loading persisted progress data:', Object.keys(data).length, 'habits');
          return data || {};
        } else {
          console.log('Progress data cache expired, will reload fresh data');
        }
      }
    } catch (error) {
      console.error('Error loading persisted progress data:', error);
    }
    return {};
  });
  
  const [lastProgressUpdate, setLastProgressUpdate] = useState(new Date());
  
  // activeArea no longer needed; derive from activeSection when needed
  const setActiveArea = () => {};
  // Layout/auth state removed – handled at higher level (AppShell / route guards)
  const { compareData, setFriendData, setCompareData } = useChartData();
  const {
    habits,
  // setHabits,
  // selectedHabit, // removed with Quick Habit Tracker
  // setSelectedHabit, // removed with Quick Habit Tracker
  // editingHabit,
  // setEditingHabit,
  // habitLoading,
    groups, // retained if used elsewhere (e.g., area sections)
  // setGroups,
    selectedFriend,
    setSelectedFriend,
    friendProgress,
    // setFriendProgress, // not used in this component
  // groupProgress, // removed - was unused
    progressSummary,
  // setProgressSummary,
    friends,
    loadHabits,
    fetchFriendProgressData,
  // fetchGroupProgressData, // removed with chart section
  } = useHabitContext();
  const { ensureLoaded, getStreak } = useCompletion();

  // Deduplicate friends by _id to avoid duplicate option keys
  const uniqueFriends = useMemo(() => {
    const arr = Array.isArray(friends) ? friends : (Array.isArray(friends?.data) ? friends.data : (Array.isArray(friends?.friends) ? friends.friends : []));
    const seen = new Set();
    return arr.filter(f => {
      if (!f || !f._id) return false;
      if (seen.has(f._id)) return false;
      seen.add(f._id);
      return true;
    });
  }, [friends]);

  // Update charts with real data including friends and groups
  useEffect(() => {
    if (!habits.length) return;
    // Ensure cache loaded for all habits (streak computation needs data)
    habits.forEach(h => ensureLoaded(h._id));
  }, [habits, ensureLoaded]);

  useEffect(() => {
    if (!progressSummary && !habits.length) return;
    const summaryStreaks = progressSummary?.habitStreaks || [];
    const summaryIds = new Set(summaryStreaks.map(h => h.habitId || h._id));

    // Fallback: for habits missing in summary, compute streak from completion cache
    const fallback = habits
      .filter(h => !summaryIds.has(h._id))
      .map(h => ({ habitId: h._id, title: h.title, streak: getStreak(h._id) }));

    const combined = [...summaryStreaks, ...fallback];
    const userLabels = combined.map(h => h.title);
    const userData = combined.map(h => h.streak);

    // Prepare datasets for comparison chart
    const datasets = [
      {
        label: 'Your Streaks',
        data: userData,
        backgroundColor: '#38bdf8',
        borderRadius: 8
      }
    ];

    // Add friend data if available
    if (friendProgress?.habitStreaks) {
  // const friendLabels = friendProgress.habitStreaks.map(h => h.title); // unused
      const friendData = friendProgress.habitStreaks.map(h => h.streak);
      datasets.push({
        label: 'Friend\'s Streaks',
        data: friendData,
        backgroundColor: '#f59e0b',
        borderRadius: 8
      });
    }


    // Update friendData chart to show comparison
    const friendDatasets = [
      {
        label: 'Your Streaks',
        data: userData,
        backgroundColor: '#38bdf8',
        borderRadius: 8
      }
    ];

    // Add friend data to second chart if selected
    if (selectedFriend && friendProgress?.habitStreaks) {
      const friendData = friendProgress.habitStreaks.map(h => h.streak);
      friendDatasets.push({
        label: 'Friend\'s Streaks',
        data: friendData,
        backgroundColor: '#f59e0b',
        borderRadius: 8
      });
    }


    setFriendData({
      labels: userLabels,
      datasets: friendDatasets
    });

    // Update compareData to show comparison with friends/groups
    setCompareData({
      labels: userLabels, // Use your habit names as base
      datasets: datasets
    });
  }, [friendProgress?.habitStreaks, getStreak, habits, progressSummary, selectedFriend, setCompareData, setFriendData]);

  // Friends progress (aggregate) for All Friends bar chart
  const [friendsProgress, setFriendsProgress] = useState([]);
  useEffect(() => {
    if (friends.length === 0) { setFriendsProgress([]); return; }
    let ignore = false;
    fetchFriendsProgress('30d').then(data => { if(!ignore) setFriendsProgress(data || []); }).catch(()=>{});
    return () => { ignore = true; };
  }, [friends.length]);

  // Enhanced Dynamic Progress Data Loading with Better Persistence
  useEffect(() => {
    const loadDynamicProgress = async () => {
      if (!habits.length) {
        console.log('No habits found, clearing progress data');
        setDynamicProgressData({});
        return;
      }

      console.log('Loading dynamic progress for', habits.length, 'habits');

      // Always load fresh data to ensure accuracy

      try {
        // Get date range for the last 7 days
        const today = new Date().toISOString().slice(0, 10);
        const dates = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          dates.push(date.toISOString().slice(0, 10));
        }
        const dateRange = { from: dates[0], to: dates[dates.length - 1] };

        // Load progress for all habits
        const newProgressData = {};
        
        for (const habit of habits) {
          await ensureLoaded(habit._id);
          
          // Import fetchBatchLogs at the top if not already imported
          const { fetchBatchLogs } = await import('../api/habits');
          const weeklyLogs = await fetchBatchLogs([habit._id], dateRange);
          const habitLogs = weeklyLogs[habit._id] || [];
          
          const completedDays = habitLogs.filter(log => log.status === 'completed').length;
          const totalDays = Math.min(7, habitLogs.length || 1);
          const weeklyProgress = Math.round((completedDays / totalDays) * 100);
          
          // Calculate current streak
          let currentStreak = 0;
          const sortedLogs = habitLogs.sort((a, b) => b.date.localeCompare(a.date));
          
          for (const log of sortedLogs) {
            if (log.status === 'completed') {
              currentStreak++;
            } else {
              break;
            }
          }

          newProgressData[habit._id] = {
            habit,
            weeklyProgress,
            currentStreak,
            totalCompleted: habitLogs.filter(log => log.status === 'completed').length,
            todayCompleted: habitLogs.some(log => log.date === today && log.status === 'completed'),
            recentLogs: habitLogs
          };
        }

        setDynamicProgressData(newProgressData);
        setLastProgressUpdate(new Date());
        
        // Enhanced persistence with better error handling
        try {
          const progressPayload = {
            data: newProgressData,
            timestamp: Date.now(),
            version: 'v2',
            habitCount: Object.keys(newProgressData).length
          };
          localStorage.setItem('habitProgressData_v2', JSON.stringify(progressPayload));
          console.log('Progress data saved to localStorage:', Object.keys(newProgressData).length, 'habits');
        } catch (error) {
          console.error('Failed to save progress data to localStorage:', error);
        }
        
      } catch (error) {
        console.error('Error loading dynamic progress data:', error);
      }
    };

    loadDynamicProgress();
  }, [ensureLoaded, habits]);

  // Auto-refresh dynamic progress every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing progress data...');
      setLastProgressUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Backup: Ensure progress data is loaded when component mounts
  useEffect(() => {
    const checkAndLoadProgress = () => {
      if (habits.length > 0 && Object.keys(dynamicProgressData).length === 0) {
        console.log('No progress data found on mount, triggering reload...');
        // Trigger a reload by updating the lastProgressUpdate
        setLastProgressUpdate(new Date());
      }
    };

    // Check after a short delay to allow habits to load
    const timer = setTimeout(checkAndLoadProgress, 1000);
    return () => clearTimeout(timer);
  }, [dynamicProgressData, habits.length]);

  // Listen for section change events from AppShell (hash navigation)
  useEffect(()=> {
    const handler = (e) => { const next = e.detail; if(next) setActiveSection(next); };
    window.addEventListener('dashboardSectionChange', handler);
    return ()=> window.removeEventListener('dashboardSectionChange', handler);
  }, []);

  // Listen for habit creation/completion events to refresh progress
  useEffect(() => {
    const handleHabitUpdated = () => {
      console.log('Habit updated, refreshing progress data...');
      setLastProgressUpdate(new Date());
      // Clear existing data to force fresh load
      setDynamicProgressData({});
    };

    const handleLogSaved = () => {
      console.log('Habit log saved, refreshing progress data...');
      setLastProgressUpdate(new Date());
      // Clear existing data to force fresh load
      setDynamicProgressData({});
    };

    // Listen for custom events from other parts of the app
    window.addEventListener('habitCreated', handleHabitUpdated);
    window.addEventListener('habitUpdated', handleHabitUpdated);
    window.addEventListener('logSaved', handleLogSaved);

    return () => {
      window.removeEventListener('habitCreated', handleHabitUpdated);
      window.removeEventListener('habitUpdated', handleHabitUpdated);
      window.removeEventListener('logSaved', handleLogSaved);
    };
  }, []);



  // Persist areas
  useEffect(() => {
    try { localStorage.setItem('habitTracker_areas_v2', JSON.stringify(areas)); } catch { /* ignore persist errors */ }
  }, [areas]);

  // Auth/session effects removed – Dashboard assumes authenticated context via AppShell

  // ---- Derived Dashboard Metrics ----

  return (
    <div className="min-h-screen" style={{background: 'var(--gradient-bg)'}}>
      {/* Modern Navigation Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b" style={{
        background: 'var(--glass-bg)',
        borderColor: 'var(--glass-border)'
      }}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Habit Tracker
                </h1>
                <p className="text-sm opacity-75" style={{color: 'var(--color-text-muted)'}}>
                  Track your progress, achieve your goals
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowHabitForm(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                + New Habit
              </button>
            </div>
          </div>
          
          {/* Enhanced Navigation Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {[
              { id: "Dashboard", label: "🏠 Overview", icon: "📊" },
              { id: "Progress", label: "📈 Progress", icon: "📈" },
              { id: "Habit Todo", label: "✅ Tasks", icon: "✅" },
              { id: "Social Hub", label: "🌍 Community", icon: "🌍" },
              { id: "Friends", label: "👥 Friends", icon: "👥" },
              { id: "Status", label: "⚡ Status", icon: "⚡" }
            ].concat(areas.map(a => ({ 
              id: `AREA_${a.id}`, 
              label: `📁 ${a.name}`, 
              icon: "📁" 
            }))).map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-300 transform hover:scale-105
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
            <button
              onClick={() => setShowAreaManager(true)}
              className="px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-300 transform hover:scale-105 border-2 border-dashed"
              style={{
                color: 'var(--color-text-muted)',
                borderColor: 'var(--color-border)'
              }}
            >
              + Area
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8">
        {/* Main Dashboard Grid */}
        <div className="max-w-7xl mx-auto">
          {editingArea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadein" onClick={(e)=> { if(e.target===e.currentTarget) cancelAreaEdit(); }}>
          <div className="card w-full max-w-sm p-5 relative animate-pop">
            <button className="absolute top-2 right-2 text-muted hover:text-blue-400 transition-colors text-xl" onClick={cancelAreaEdit} aria-label="Close">✕</button>
            <h4 className="text-blue-400 font-bold mb-4 text-sm">Edit Area</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wide text-muted mb-1">Area Name</label>
                <input
                  autoFocus
                  type="text"
                  value={areaNameDraft}
                  onChange={(e)=> setAreaNameDraft(e.target.value)}
                  onKeyDown={(e)=> e.key==='Enter' && saveAreaEdit()}
                  className="input w-full text-sm"
                  placeholder="Enter area name"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={saveAreaEdit} className="btn btn-success flex-1 animate-pop">Save</button>
                <button onClick={cancelAreaEdit} className="btn flex-1 animate-pop">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Area Manager Modal */}
      {showAreaManager && (
        <AreaManagerModal
          areas={areas}
          onCreate={(area)=> { setAreas(prev => [area, ...prev]); setActiveArea(area); setActiveSection(`AREA_${area.id}`); setShowAreaManager(false); }}
          onSelect={(area)=> { setActiveArea(area); setActiveSection(`AREA_${area.id}`); setShowAreaManager(false); }}
          onClose={()=> setShowAreaManager(false)}
        />
      )}
      
      {/* Habit Form Modal */}
      {showHabitForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadein" onClick={(e)=> { if(e.target===e.currentTarget) setShowHabitForm(false); }}>
          <div className="rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{background: 'var(--glass-bg)', border: '1px solid var(--glass-border)'}}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">Create New Habit</h3>
              <button 
                onClick={() => setShowHabitForm(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
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
      {/* Dashboard Section */}
      {activeSection === "Dashboard" && (
        <>
          {/* Hero Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Total Habits */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl transition-all duration-300 group-hover:blur-2xl"></div>
              <div className="relative backdrop-blur-xl border rounded-2xl p-6 transition-all duration-300 hover:scale-105 transform" 
                   style={{background: 'var(--glass-bg)', borderColor: 'var(--glass-border)'}}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                      {habits.length}
                    </p>
                    <p className="text-sm opacity-75" style={{color: 'var(--color-text-muted)'}}>Total Habits</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-1000 ease-out" 
                       style={{width: `${Math.min(100, (habits.length / 10) * 100)}%`}}>
                  </div>
                </div>
                <p className="text-xs mt-2 opacity-60" style={{color: 'var(--color-text-muted)'}}>
                  {habits.length >= 10 ? 'Great collection!' : `${10 - habits.length} more to reach 10`}
                </p>
              </div>
            </div>

            {/* Active Streaks */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-2xl blur-xl transition-all duration-300 group-hover:blur-2xl"></div>
              <div className="relative backdrop-blur-xl border rounded-2xl p-6 transition-all duration-300 hover:scale-105 transform" 
                   style={{background: 'var(--glass-bg)', borderColor: 'var(--glass-border)'}}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text text-transparent">
                      {Object.values(dynamicProgressData).filter(p => p.currentStreak > 0).length}
                    </p>
                    <p className="text-sm opacity-75" style={{color: 'var(--color-text-muted)'}}>Active Streaks</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-1000 ease-out" 
                       style={{width: `${habits.length > 0 ? (Object.values(dynamicProgressData).filter(p => p.currentStreak > 0).length / habits.length) * 100 : 0}%`}}>
                  </div>
                </div>
                <p className="text-xs mt-2 opacity-60" style={{color: 'var(--color-text-muted)'}}>
                  Keep the momentum going!
                </p>
              </div>
            </div>

            {/* Weekly Progress */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl transition-all duration-300 group-hover:blur-2xl"></div>
              <div className="relative backdrop-blur-xl border rounded-2xl p-6 transition-all duration-300 hover:scale-105 transform" 
                   style={{background: 'var(--glass-bg)', borderColor: 'var(--glass-border)'}}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                      {Object.values(dynamicProgressData).length > 0 
                        ? Math.round(Object.values(dynamicProgressData).reduce((sum, p) => sum + p.weeklyProgress, 0) / Object.values(dynamicProgressData).length)
                        : 0}%
                    </p>
                    <p className="text-sm opacity-75" style={{color: 'var(--color-text-muted)'}}>Weekly Avg</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out" 
                       style={{width: `${Object.values(dynamicProgressData).length > 0 
                         ? Object.values(dynamicProgressData).reduce((sum, p) => sum + p.weeklyProgress, 0) / Object.values(dynamicProgressData).length
                         : 0}%`}}>
                  </div>
                </div>
                <p className="text-xs mt-2 opacity-60" style={{color: 'var(--color-text-muted)'}}>
                  This week's performance
                </p>
              </div>
            </div>

            {/* Friends Count */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-2xl blur-xl transition-all duration-300 group-hover:blur-2xl"></div>
              <div className="relative backdrop-blur-xl border rounded-2xl p-6 transition-all duration-300 hover:scale-105 transform" 
                   style={{background: 'var(--glass-bg)', borderColor: 'var(--glass-border)'}}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                      {uniqueFriends.length}
                    </p>
                    <p className="text-sm opacity-75" style={{color: 'var(--color-text-muted)'}}>Friends</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-1000 ease-out" 
                       style={{width: `${Math.min(100, (uniqueFriends.length / 5) * 100)}%`}}>
                  </div>
                </div>
                <p className="text-xs mt-2 opacity-60" style={{color: 'var(--color-text-muted)'}}>
                  Building connections
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Tracker Section */}
          <div className="mb-12">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl blur-xl"></div>
              <div className="relative backdrop-blur-xl border rounded-3xl p-8" 
                   style={{background: 'var(--glass-bg)', borderColor: 'var(--glass-border)'}}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                      Today's Progress
                    </h2>
                    <p className="opacity-75" style={{color: 'var(--color-text-muted)'}}>
                      Track and complete your daily habits
                    </p>
                  </div>
                </div>
                <DynamicTracker />
              </div>
            </div>
          </div>

          {/* Analytics Charts Section */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                Analytics & Insights
              </h2>
              <div className="text-sm opacity-75" style={{color: 'var(--color-text-muted)'}}>
                Last updated: {lastProgressUpdate.toLocaleTimeString()}
              </div>
            </div>
            
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Chart 1: My Progress - Enhanced with Dynamic Progress */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-xl transition-all duration-300 group-hover:blur-2xl"></div>
                <div className="relative backdrop-blur-xl border rounded-3xl p-8 transition-all duration-300 hover:scale-[1.02] transform" 
                     style={{background: 'var(--glass-bg)', borderColor: 'var(--glass-border)'}}>
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                          My Progress
                        </h3>
                        <p className="text-sm opacity-75" style={{color: 'var(--color-text-muted)'}}>
                          Personal habit tracking
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <div className="text-xs font-medium text-green-600">Live</div>
                    </div>
                  </div>
                
                {/* Dynamic Progress Bars */}
                <div className="space-y-4 mb-6">
                  {Object.values(dynamicProgressData).length > 0 ? (
                    Object.values(dynamicProgressData).map((progress) => (
                      <div key={progress.habit._id} className="bg-slate-800/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{progress.habit.icon || '📋'}</span>
                            <span className="font-medium text-white">{progress.habit.title}</span>
                            {progress.todayCompleted && (
                              <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">✓ Done Today</span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-white">{progress.weeklyProgress}%</div>
                            <div className="text-xs text-slate-400">{progress.currentStreak} day streak</div>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-400">
                            <span>Weekly Progress</span>
                            <span>{progress.totalCompleted} completed</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-1000 ease-out ${
                                progress.weeklyProgress >= 80 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                                progress.weeklyProgress >= 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                                progress.weeklyProgress >= 40 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                                'bg-gradient-to-r from-red-500 to-red-600'
                              }`}
                              style={{ width: `${progress.weeklyProgress}%` }}
                            >
                              <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">📈</div>
                      <p className="text-slate-400">Loading progress data...</p>
                    </div>
                  )}
                </div>

                {/* Traditional Chart for Streaks */}
                <div className="border-t border-slate-700/30 pt-4">
                  <h4 className="text-sm font-medium text-slate-300 mb-3">Streak Comparison</h4>
                  <div className="h-48">
                    <Bar 
                      data={{
                        labels: Object.values(dynamicProgressData).map(p => p.habit.title) || 
                                progressSummary?.habitStreaks?.map(h => h.title) || ['No Data'],
                        datasets: [{
                          label: 'Current Streaks (Days)',
                          data: Object.values(dynamicProgressData).map(p => p.currentStreak) || 
                                progressSummary?.habitStreaks?.map(h => h.streak) || [0],
                          backgroundColor: Object.values(dynamicProgressData).map(p => 
                            p.weeklyProgress >= 80 ? '#10B981' :
                            p.weeklyProgress >= 60 ? '#F59E0B' :
                            p.weeklyProgress >= 40 ? '#F97316' : '#EF4444'
                          ),
                          borderRadius: 8,
                          borderSkipped: false,
                        }]
                      }}
                      options={{
                        ...chartOptions,
                        plugins: {
                          ...chartOptions.plugins,
                          legend: { display: false }
                        },
                        scales: {
                          ...chartOptions.scales,
                          x: { grid: { color: "#374151" }, ticks: { color: "#9CA3AF", fontSize: 10 } },
                          y: { grid: { color: "#374151" }, ticks: { color: "#9CA3AF" } }
                        }
                      }} 
                    />
                  </div>
                </div>
                </div>
              </div>

              {/* Chart 2: Friend's Progress - Enhanced with Dynamic Visualization */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl blur-xl transition-all duration-300 group-hover:blur-2xl"></div>
                <div className="relative backdrop-blur-xl border rounded-3xl p-8 transition-all duration-300 hover:scale-[1.02] transform" 
                     style={{background: 'var(--glass-bg)', borderColor: 'var(--glass-border)'}}>
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                          Friend's Progress  
                        </h3>
                        <p className="text-sm opacity-75" style={{color: 'var(--color-text-muted)'}}>
                          Compare and inspire each other
                        </p>
                      </div>
                    </div>
                    <select 
                      value={selectedFriend?._id || ''} 
                      onChange={(e) => {
                        const friendId = e.target.value;
                        const friend = uniqueFriends.find(f => f._id === friendId);
                        setSelectedFriend(friend || null);
                        if (friend) fetchFriendProgressData(friendId);
                      }}
                      className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-white/20 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      style={{color: 'var(--color-text)'}}
                    >
                      <option value="">Select a friend</option>
                      {uniqueFriends.map(friend => (
                        <option key={friend._id} value={friend._id}>
                          {friend.username || friend.name || 'Unknown'}
                        </option>
                      ))}
                    </select>
                  </div>

                {selectedFriend && friendProgress?.habitStreaks ? (
                  <>
                    {/* Friend Stats Header */}
                    <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">
                              {(selectedFriend.username || selectedFriend.name || 'F')[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{selectedFriend.username || selectedFriend.name}</h4>
                            <p className="text-slate-400 text-sm">{friendProgress.habitStreaks.length} active habits</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">
                            {Math.round(friendProgress.habitStreaks.reduce((sum, h) => sum + h.streak, 0) / friendProgress.habitStreaks.length)} avg
                          </div>
                          <div className="text-xs text-slate-400">streak days</div>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Tracker Section */}
                    <div className="mt-8 mb-8">
                      <DynamicTracker />
                    </div>

                    {/* Dynamic Friend Progress Bars */}
                    <div className="space-y-3 mb-6">
                      {friendProgress.habitStreaks.map((habit, index) => {
                        // Simulate progress percentage based on streak (for demonstration)
                        const progressPercentage = Math.min(100, Math.round((habit.streak / 30) * 100));
                        
                        return (
                          <div key={index} className="bg-slate-800/30 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm">🎯</span>
                                <span className="font-medium text-white text-sm">{habit.title}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-purple-400">{habit.streak} days</div>
                                <div className="text-xs text-slate-400">{progressPercentage}% progress</div>
                              </div>
                            </div>
                            
                            {/* Friend Progress Bar */}
                            <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-1000 ease-out"
                                style={{ width: `${progressPercentage}%` }}
                              >
                                <div className="w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Traditional Streak Chart */}
                    <div className="border-t border-slate-700/30 pt-4">
                      <h4 className="text-sm font-medium text-slate-300 mb-3">Streak Comparison</h4>
                      <div className="h-40">
                        <Bar 
                          data={{
                            labels: friendProgress.habitStreaks.map(h => h.title),
                            datasets: [{
                              label: `${selectedFriend.username || selectedFriend.name || 'Friend'}'s Streaks`,
                              data: friendProgress.habitStreaks.map(h => h.streak),
                              backgroundColor: friendProgress.habitStreaks.map(h => {
                                const progress = Math.min(100, Math.round((h.streak / 30) * 100));
                                return progress >= 80 ? '#8B5CF6' : 
                                       progress >= 60 ? '#3B82F6' :
                                       progress >= 40 ? '#06B6D4' : '#6366F1';
                              }),
                              borderRadius: 6,
                              borderSkipped: false,
                            }]
                          }}
                          options={{
                            ...chartOptions,
                            plugins: {
                              ...chartOptions.plugins,
                              legend: { display: false }
                            },
                            scales: {
                              ...chartOptions.scales,
                              x: { grid: { color: "#374151" }, ticks: { color: "#9CA3AF", fontSize: 10 } },
                              y: { grid: { color: "#374151" }, ticks: { color: "#9CA3AF" } }
                            }
                          }} 
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                    <div className="text-4xl mb-3">👤</div>
                    <p className="text-lg mb-2">
                      {selectedFriend ? 'Loading friend data...' : 'Select a friend to view their progress'}
                    </p>
                    {!selectedFriend && (
                      <p className="text-sm opacity-75">Choose from your friends list above</p>
                    )}
                  </div>
                )}

              </div>
              

              {/* Chart 3: Comparison Chart - Enhanced with Dynamic Progress */}
              <div className="rounded-xl shadow-lg p-6" style={{background: 'var(--glass-bg)', border: '1px solid var(--glass-border)'}}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold" style={{color: 'var(--color-text)'}}>⚔️ You vs Friend</h3>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm" style={{color: 'var(--color-text-muted)'}}>
                      {selectedFriend ? `vs ${selectedFriend.username || selectedFriend.name}` : 'Select friend above'}
                    </div>
                    {selectedFriend && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedFriend && compareData ? (
                  <>
                    {/* Comparison Header Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gradient-to-r from-blue-900/40 to-blue-800/40 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-blue-300 text-sm font-medium">You</h4>
                            <p className="text-2xl font-bold text-white">
                              {Object.values(dynamicProgressData).length > 0 ? 
                                Math.round(Object.values(dynamicProgressData).reduce((sum, p) => sum + p.weeklyProgress, 0) / Object.values(dynamicProgressData).length) 
                                : '0'}%
                            </p>
                            <p className="text-xs text-slate-400">avg progress</p>
                          </div>
                          <div className="text-3xl">🏆</div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-purple-900/40 to-purple-800/40 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-purple-300 text-sm font-medium">
                              {selectedFriend.username || selectedFriend.name || 'Friend'}
                            </h4>
                            <p className="text-2xl font-bold text-white">
                              {friendProgress?.habitStreaks ? 
                                Math.round(friendProgress.habitStreaks.reduce((sum, h) => sum + Math.min(100, (h.streak / 30) * 100), 0) / friendProgress.habitStreaks.length)
                                : '0'}%
                            </p>
                            <p className="text-xs text-slate-400">avg progress</p>
                          </div>
                          <div className="text-3xl">🎯</div>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Comparison Progress Bars */}
                    <div className="space-y-4 mb-6">
                      {Object.values(dynamicProgressData).slice(0, 3).map((myProgress, index) => {
                        const friendHabit = friendProgress?.habitStreaks?.find(h => 
                          h.title.toLowerCase().includes(myProgress.habit.title.toLowerCase().substring(0, 3))
                        ) || friendProgress?.habitStreaks?.[index];
                        
                        const friendProgressPercent = friendHabit ? 
                          Math.min(100, Math.round((friendHabit.streak / 30) * 100)) : 0;

                        return (
                          <div key={myProgress.habit._id} className="bg-slate-800/30 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-white font-medium text-sm">
                                {myProgress.habit.title} vs {friendHabit?.title || 'Similar Habit'}
                              </h4>
                              <div className="text-xs text-slate-400">
                                {myProgress.weeklyProgress > friendProgressPercent ? '🏆 You lead' : 
                                 friendProgressPercent > myProgress.weeklyProgress ? '🎯 Friend leads' : 
                                 '⚔️ Tied'}
                              </div>
                            </div>
                            
                            {/* Your Progress */}
                            <div className="mb-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-blue-300">You</span>
                                <span className="text-xs text-blue-300">{myProgress.weeklyProgress}%</span>
                              </div>
                              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-1000 ease-out"
                                  style={{ width: `${myProgress.weeklyProgress}%` }}
                                >
                                  <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Friend Progress */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-purple-300">
                                  {selectedFriend.username || selectedFriend.name}
                                </span>
                                <span className="text-xs text-purple-300">{friendProgressPercent}%</span>
                              </div>
                              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-1000 ease-out"
                                  style={{ width: `${friendProgressPercent}%` }}
                                >
                                  <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Traditional Comparison Chart */}
                    <div className="border-t border-slate-700/30 pt-4">
                      <h4 className="text-sm font-medium text-slate-300 mb-3">Streak Showdown</h4>
                      <div className="h-40">
                        <Bar 
                          data={compareData}
                          options={{
                            ...chartOptions,
                            plugins: {
                              ...chartOptions.plugins,
                              legend: { 
                                display: true,
                                labels: { color: "#9CA3AF", fontSize: 12 }
                              }
                            },
                            scales: {
                              ...chartOptions.scales,
                              x: { grid: { color: "#374151" }, ticks: { color: "#9CA3AF", fontSize: 10 } },
                              y: { grid: { color: "#374151" }, ticks: { color: "#9CA3AF" } }
                            }
                          }} 
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                    <div className="text-4xl mb-3">⚔️</div>
                    <p className="text-lg mb-2">Ready for a challenge?</p>
                    <p className="text-sm opacity-75">Select a friend above to compare your progress</p>
                  </div>
                )}
              </div>

              {/* Chart 4: All Friends Progress - Enhanced with Dynamic Visualization */}
              <div className="rounded-xl shadow-lg p-6" style={{background: 'var(--glass-bg)', border: '1px solid var(--glass-border)'}}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold" style={{color: 'var(--color-text)'}}>🌟 All Friends Progress</h3>
                  <div className="flex items-center space-x-3">
                    <div className="text-sm" style={{color: 'var(--color-text-muted)'}}>{uniqueFriends.length} friends</div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-slate-400">Live</span>
                    </div>
                  </div>
                </div>

                {friendsProgress.length > 0 ? (
                  <>
                    {/* Friends Leaderboard */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-slate-300 mb-4">📈 Friends Leaderboard</h4>
                      <div className="space-y-3">
                        {friendsProgress
                          .sort((a, b) => (b.averageCompletion || 0) - (a.averageCompletion || 0))
                          .slice(0, 5)
                          .map((friend, index) => {
                            const colors = [
                              'bg-gradient-to-r from-yellow-500 to-yellow-600', // Gold
                              'bg-gradient-to-r from-gray-400 to-gray-500',   // Silver
                              'bg-gradient-to-r from-orange-600 to-orange-700', // Bronze
                              'bg-gradient-to-r from-blue-500 to-blue-600',   // Regular
                              'bg-gradient-to-r from-purple-500 to-purple-600' // Regular
                            ];
                            
                            const medals = ['🥇', '🥈', '🥉', '🏆', '⭐'];
                            const progress = friend.averageCompletion || 0;
                            
                            return (
                              <div key={friend._id || index} className="bg-slate-800/30 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-lg">{medals[index]}</span>
                                    <div className="flex items-center space-x-2">
                                      <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">
                                          {(friend.username || friend.name || 'F')[0].toUpperCase()}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="font-medium text-white text-sm">
                                          {friend.username || friend.name || 'Unknown'}
                                        </span>
                                        <div className="text-xs text-slate-400">
                                          #{index + 1} • {friend.totalHabits || '0'} habits
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-white">{progress.toFixed(1)}%</div>
                                    <div className="text-xs text-slate-400">completion</div>
                                  </div>
                                </div>
                                
                                {/* Dynamic Progress Bar */}
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs text-slate-400">
                                    <span>Overall Progress</span>
                                    <span>{friend.activeStreaks || 0} active streaks</span>
                                  </div>
                                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                                    <div 
                                      className={`h-full transition-all duration-1000 ease-out ${colors[index]}`}
                                      style={{ width: `${progress}%` }}
                                    >
                                      <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Community Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-gradient-to-r from-green-900/30 to-green-800/30 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-green-400">
                          {Math.round(friendsProgress.reduce((sum, f) => sum + (f.averageCompletion || 0), 0) / friendsProgress.length)}%
                        </div>
                        <div className="text-xs text-slate-400">Community Avg</div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/30 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-blue-400">
                          {friendsProgress.filter(f => (f.averageCompletion || 0) >= 70).length}
                        </div>
                        <div className="text-xs text-slate-400">High Performers</div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/30 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-purple-400">
                          {friendsProgress.reduce((sum, f) => sum + (f.activeStreaks || 0), 0)}
                        </div>
                        <div className="text-xs text-slate-400">Total Streaks</div>
                      </div>
                    </div>

                    {/* Traditional Chart */}
                    <div className="border-t border-slate-700/30 pt-4">
                      <h4 className="text-sm font-medium text-slate-300 mb-3">Friends Comparison Chart</h4>
                      <div className="h-48">
                        <Bar 
                          data={{
                            labels: friendsProgress.map(f => (f.username || f.name || 'Unknown').substring(0, 8)),
                            datasets: [{
                              label: 'Average Completion %',
                              data: friendsProgress.map(f => f.averageCompletion || 0),
                              backgroundColor: friendsProgress.map((_, index) => {
                                const colors = [
                                  '#EF4444', '#F97316', '#F59E0B', '#EAB308', 
                                  '#84CC16', '#22C55E', '#10B981', '#14B8A6',
                                  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
                                  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899'
                                ];
                                return colors[index % colors.length];
                              }),
                              borderRadius: 6,
                              borderSkipped: false,
                            }]
                          }}
                          options={{
                            ...chartOptions,
                            plugins: {
                              ...chartOptions.plugins,
                              legend: { display: false }
                            },
                            scales: {
                              ...chartOptions.scales,
                              x: { grid: { color: "#374151" }, ticks: { color: "#9CA3AF", fontSize: 10 } },
                              y: { 
                                grid: { color: "#374151" }, 
                                ticks: { color: "#9CA3AF" },
                                beginAtZero: true,
                                max: 100
                              }
                            }
                          }} 
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                    <div className="text-4xl mb-3">👥</div>
                    <p className="text-lg mb-2">
                      {uniqueFriends.length === 0 ? 'No friends added yet' : 'Loading friends progress...'}
                    </p>
                    {uniqueFriends.length === 0 && (
                      <p className="text-sm opacity-75">Add friends to see community progress</p>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </>
      )}

          {/* Progress Section (Summary Only) */}
          {activeSection === "Progress" && (
            <>
              <div className="col-span-1 md:col-span-2">
                <PerHabitSummary />
              </div>
              <div className="col-span-1 md:col-span-2">
                <ProgressSummary />
              </div>
              <div className="col-span-1 md:col-span-2">
                <CalendarHeatmap />
              </div>
            </>
          )}
          {/* Habit Todo Section */}
          {activeSection === "Habit Todo" && (
            <>
              <HabitTodo />
            </>
          )}
          {/* Area Sections */}
          {areas.map(a => (
            activeSection === `AREA_${a.id}` && (
              <React.Fragment key={a.id}>
                <div className="col-span-1 md:col-span-2 flex items-center justify-between bg-surface rounded-xl p-5 border border-app">
                  <div>
                    <h2 className="text-primary font-semibold text-lg">Area: {a.name}</h2>
                    <div className="text-xs text-muted">Created {new Date(a.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=> setShowAreaManager(true)} className="px-3 py-2 rounded bg-app-alt hover:bg-surface text-xs text-primary border border-app">Manage Areas</button>
                    <button onClick={()=> setActiveSection('Dashboard')} className="px-3 py-2 rounded bg-app-alt hover:bg-surface text-xs text-primary border border-app">Back</button>
                  </div>
                </div>
                <div className="col-span-1 md:col-span-1 space-y-4">
                  <div className="bg-surface p-4 rounded-lg border border-app">
                    <h4 className="text-sm font-semibold text-blue-300 mb-3">Create Habit in this Area</h4>
                    <HabitForm onCreated={(habit)=> {
                      setAreas(prev => prev.map(ar => ar.id === a.id ? { ...ar, habits: [habit._id, ...(ar.habits||[])] } : ar));
                    }} />
                  </div>
                  <div className="bg-surface p-4 rounded-lg border border-app">
                    <h4 className="text-sm font-semibold text-green-300 mb-3">Create Habit Group</h4>
                    <GroupForm onCreated={(group)=> {
                      setAreas(prev => prev.map(ar => ar.id === a.id ? { ...ar, groups: [group._id, ...(ar.groups||[])] } : ar));
                    }} />
                  </div>
                </div>
                <div className="col-span-1 md:col-span-1 space-y-4">
                  <div className="bg-surface p-4 rounded-lg border border-app">
                    <h5 className="text-xs uppercase tracking-wide text-muted mb-2">Habits</h5>
                    {a.habits?.length ? (
                      <ul className="space-y-1 text-sm text-primary max-h-64 overflow-y-auto pr-2">
                        {a.habits.map(id => {
                          const habit = habits.find(h => h._id === id);
                          return <li key={`area-${a.id}-habit-${id}`} className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: habit?.colorTag || '#64748b' }}></span>{habit?.title || 'Unknown Habit'}</li>;
                        })}
                      </ul>
                    ) : <div className="text-xs text-muted">No habits yet.</div>}
                  </div>
                  <div className="bg-surface p-4 rounded-lg border border-app">
                    <h5 className="text-xs uppercase tracking-wide text-muted mb-2">Groups</h5>
                    {a.groups?.length ? (
                      <ul className="space-y-1 text-sm text-primary max-h-64 overflow-y-auto pr-2">
                        {a.groups.map(id => {
                          const group = groups.find(g => g._id === id);
                          return <li key={`area-${a.id}-group-${id}`} className="flex items-center gap-2"><FaUsers className="text-muted" />{group?.name || 'Unknown Group'}</li>;
                        })}
                      </ul>
                    ) : <div className="text-xs text-muted">No groups yet.</div>}
                  </div>
                </div>
              </React.Fragment>
            )
          ))}
          {/* Social Hub Section - Community Only */}
          {activeSection === "Social Hub" && (
            <div className="col-span-1 md:col-span-2">
              <div className="space-y-8">
                {/* Header Section with Gradient */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-xl"></div>
                  <div className="relative bg-[var(--color-bg-alt)]/80 backdrop-blur border border-[var(--color-border)]/50 rounded-2xl p-8 shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-4">
                        <div className="relative float">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-20"></div>
                          <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg glow animate-gradient">
                            <FaUsers className="text-white text-xl" />
                          </div>
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold text-[var(--color-text)] tracking-tight">Social Hub</h2>
                          <p className="text-[var(--color-text-muted)] mt-1">Discover and connect with the community</p>
                        </div>
                      </div>
                      <div className="hidden md:flex items-center gap-3">
                        <div className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-500/30">
                          <span className="text-sm font-medium text-blue-400">Community</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative mb-6 stagger-child reveal-card">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 rounded-xl blur-lg"></div>
                  <div className="relative bg-[var(--color-bg)]/90 backdrop-blur border border-[var(--color-border)]/50 rounded-xl p-4 shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-[var(--color-text)]">Search Community</h3>
                    </div>
                    <UserSearch />
                  </div>
                </div>

                {/* Community Section */}
                <div className="relative stagger-child reveal-card">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-2xl blur-xl"></div>
                  <div className="relative bg-[var(--color-bg)]/90 backdrop-blur border border-[var(--color-border)]/50 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 15.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 19.288 0M15 7a3 3 0 11-6 0 3 3 0 0 16 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 0 14 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-[var(--color-text)]">Community</h3>
                        <p className="text-sm text-[var(--color-text-muted)]">Discover and connect with users</p>
                      </div>
                    </div>
                    <div className="bg-[var(--color-bg-alt)]/30 rounded-xl p-4 border border-[var(--color-border)]/30 max-h-96 overflow-y-auto app-scrollbar">
                      <AllUsersList />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Friends Section - With Progress Indicators */}
          {activeSection === "Friends" && (
            <div className="col-span-1 md:col-span-2">
              <div className="space-y-8">
                {/* Header Section with Gradient */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 rounded-2xl blur-xl"></div>
                  <div className="relative bg-[var(--color-bg-alt)]/80 backdrop-blur border border-[var(--color-border)]/50 rounded-2xl p-8 shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-4">
                        <div className="relative float">
                          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl blur opacity-20"></div>
                          <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg glow animate-gradient">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                          </div>
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold text-[var(--color-text)] tracking-tight">Friends</h2>
                          <p className="text-[var(--color-text-muted)] mt-1">Manage your connections and network</p>
                        </div>
                      </div>
                      <div className="hidden md:flex items-center gap-3">
                        <div className="px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full border border-green-500/30">
                          <span className="text-sm font-medium text-green-400">Connected</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Friends List with Progress Indicators */}
                <div className="relative stagger-child reveal-card mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl"></div>
                  <div className="relative bg-[var(--color-bg)]/90 backdrop-blur border border-[var(--color-border)]/50 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 15.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 19.288 0M15 7a3 3 0 11-6 0 3 3 0 0 16 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 0 14 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-[var(--color-text)]">My Friends</h3>
                        <p className="text-sm text-[var(--color-text-muted)]">Your connected friends with their progress</p>
                      </div>
                    </div>
                    <div className="bg-[var(--color-bg-alt)]/30 rounded-xl p-4 border border-[var(--color-border)]/30 max-h-80 overflow-y-auto app-scrollbar">
                      <FriendsList showProgress={true} />
                    </div>
                  </div>
                </div>

                {/* Invite Friends Section */}
                <div className="relative stagger-child reveal-card">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-2xl blur-xl"></div>
                  <div className="relative bg-[var(--color-bg)]/90 backdrop-blur border border-[var(--color-border)]/50 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-[var(--color-text)]">Invite Friends</h3>
                        <p className="text-sm text-[var(--color-text-muted)]">Share your experience and grow your network</p>
                      </div>
                    </div>
                    <div className="bg-[var(--color-bg-alt)]/30 rounded-xl p-4 border border-[var(--color-border)]/30">
                      <InviteFriends onInviteSent={() => {
                        loadHabits(); // This also loads friends in the context
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status Section - Implementation Summary */}
          {activeSection === "Status" && (
            <div className="col-span-1 md:col-span-2">
              <SocialFeaturesTest />
            </div>
          )}

          {/* Dynamic Folder Sections (handled within conditional sections above) */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;