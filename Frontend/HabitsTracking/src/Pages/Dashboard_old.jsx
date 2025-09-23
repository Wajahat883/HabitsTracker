import React, { useState, useEffect, useMemo } from "react";
import { useHabitContext } from "../context/useHabitContext";
import HabitForm from "../Components/Habits/HabitForm";
import HabitTracker from "../Components/Habits/HabitTracker";
import UserSearch from "../Components/Friends/UserSearch";
import AllUsersList from "../Components/Friends/AllUsersList";
import SocialFeaturesTest from "../Components/Common/SocialFeaturesTest";
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

// eslint-disable-next-line no-unused-vars
const chartOptions = {
  responsive: true,
  plugins: {
    legend: { labels: { color: "#fff" } },
    title: { display: false },
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
  
  // Areas local state
  const [areas, setAreas] = useState(() => {
    try {
      const raw = localStorage.getItem('habitTracker_areas_v2');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [editingArea, setEditingArea] = useState(null);
  const [areaNameDraft, setAreaNameDraft] = useState('');
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [showAreaManager, setShowAreaManager] = useState(false);
  
  // Dynamic Progress State
  const [dynamicProgressData, setDynamicProgressData] = useState(() => {
    try {
      const saved = localStorage.getItem('habitProgressData_v2');
      if (saved) {
        const { data, timestamp } = JSON.parse(saved);
        if (Date.now() - timestamp < 30 * 60 * 1000) {
          return data;
        }
      }
      return {};
    } catch { return {}; }
  });
  
  const [_lastProgressUpdate, setLastProgressUpdate] = useState(new Date());
  const [_compareData, setCompareData] = useState(null);
  const [_friendData, setFriendData] = useState(null);
  const [_friendsProgress, setFriendsProgress] = useState([]);

  const saveAreaEdit = () => {
    if (!areaNameDraft.trim() || !editingArea) { 
      setEditingArea(null); 
      return;
    }
    setAreas(prev => prev.map(a => a.id === editingArea.id ?
       { ...a, name: areaNameDraft.trim() } : 
       a));
    setEditingArea(null);
  };
  
  const cancelAreaEdit = () => setEditingArea(null);

  // Context data
  const {
    habits,
    groups,
    selectedFriend,
    setSelectedFriend: _setSelectedFriend,
    friendProgress,
    progressSummary,
    friends,
    loadHabits,
    fetchFriendProgressData: _fetchFriendProgressData,
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

  // Chart data setup
  useEffect(() => {
    const userLabels = habits.map(h => h.title);
    const userStreakData = habits.map(h => {
      if (selectedFriend && friendProgress?.habitStreaks) {
        const _friendHabit = friendProgress.habitStreaks.find(fh => 
          fh.title.toLowerCase().includes(h.title.toLowerCase().substring(0, 3))
        );
        return getStreak(h._id);
      }
      return getStreak(h._id);
    });

    const datasets = [{
      label: 'Your Streaks',
      data: userStreakData,
      backgroundColor: '#3B82F6',
      borderRadius: 6,
    }];

    if (selectedFriend && friendProgress?.habitStreaks) {
      const friendStreakData = habits.map(h => {
        const friendHabit = friendProgress.habitStreaks.find(fh => 
          fh.title.toLowerCase().includes(h.title.toLowerCase().substring(0, 3))
        );
        return friendHabit ? friendHabit.streak : 0;
      });

      datasets.push({
        label: selectedFriend.username || selectedFriend.name || 'Friend',
        data: friendStreakData,
        backgroundColor: '#8B5CF6',
        borderRadius: 6,
      });
    }

    const friendDatasets = [{
      label: 'Your Progress',
      data: userStreakData,
      backgroundColor: '#3B82F6',
      borderRadius: 6,
    }];

    setFriendData({
      labels: userLabels,
      datasets: friendDatasets
    });

    setCompareData({
      labels: userLabels,
      datasets: datasets
    });
  }, [friendProgress?.habitStreaks, getStreak, habits, progressSummary, selectedFriend, setCompareData, setFriendData]);

  // Friends progress loading
  useEffect(() => {
    if (friends.length === 0) { 
      setFriendsProgress([]); 
      return; 
    }
    let ignore = false;
    fetchFriendsProgress('30d').then(data => { 
      if(!ignore) setFriendsProgress(data || []); 
    }).catch(()=>{});
    return () => { ignore = true; };
  }, [friends.length]);

  // Dynamic progress loading
  useEffect(() => {
    const loadDynamicProgress = async () => {
      try {
        console.log('Loading dynamic progress data...');
        await ensureLoaded();
        
        const progressData = {};
        
        for (const habit of habits) {
          try {
            const currentStreak = getStreak(habit._id);
            const weeklyProgress = Math.min(100, Math.round((currentStreak / 7) * 100));
            const todayCompleted = false; // This would need to be calculated based on today's logs
            
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
        setLastProgressUpdate(new Date());
        
        // Persist to localStorage
        try {
          localStorage.setItem('habitProgressData_v2', JSON.stringify({
            data: progressData,
            timestamp: Date.now()
          }));
        } catch (error) {
          console.error('Failed to save progress data to localStorage:', error);
        }
        
      } catch (error) {
        console.error('Error loading dynamic progress data:', error);
      }
    };

    loadDynamicProgress();
  }, [ensureLoaded, habits, getStreak]);

  // Auto-refresh progress
  useEffect(() => {
    const interval = setInterval(() => {
      setLastProgressUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Check and load progress on mount
  useEffect(() => {
    const checkAndLoadProgress = () => {
      if (habits.length > 0 && Object.keys(dynamicProgressData).length === 0) {
        setLastProgressUpdate(new Date());
      }
    };
    const timer = setTimeout(checkAndLoadProgress, 1000);
    return () => clearTimeout(timer);
  }, [dynamicProgressData, habits.length]);

  // Listen for section changes
  useEffect(()=> {
    const handler = (e) => { 
      const next = e.detail; 
      if(next) setActiveSection(next); 
    };
    window.addEventListener('dashboardSectionChange', handler);
    return ()=> window.removeEventListener('dashboardSectionChange', handler);
  }, []);

  // Listen for habit updates
  useEffect(() => {
    const handleHabitUpdated = () => {
      setLastProgressUpdate(new Date());
    };
    
    const handleLogSaved = () => {
      setLastProgressUpdate(new Date());
    };

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
    try { 
      localStorage.setItem('habitTracker_areas_v2', JSON.stringify(areas)); 
    } catch { 
      // ignore persist errors 
    }
  }, [areas]);

  // Loading states
  const isLoading = habits.length === 0 && Object.keys(dynamicProgressData).length === 0;
  const _hasData = habits.length > 0 || Object.keys(dynamicProgressData).length > 0;

  return (
    <div className="min-h-screen" style={{background: 'var(--gradient-bg)'}}>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
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
      )}

      {/* Enhanced Navigation Header */}
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
        <div className="max-w-7xl mx-auto">
          
          {/* Modals */}
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
          
          {showAreaManager && (
            <AreaManagerModal
              areas={areas}
              onCreate={(area)=> { setAreas(prev => [area, ...prev]); setActiveSection(`AREA_${area.id}`); setShowAreaManager(false); }}
              onSelect={(area)=> { setActiveSection(`AREA_${area.id}`); setShowAreaManager(false); }}
              onClose={()=> setShowAreaManager(false)}
            />
          )}
          
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
          {activeSection === "Dashboard" && (
            <>
              {/* Hero Stats Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 stagger-children">
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
            </>
          )}

          {/* Other Sections */}
          {activeSection === "Progress" && (
            <div className="space-y-8">
              <PerHabitSummary />
              <ProgressSummary />
              <CalendarHeatmap />
            </div>
          )}

          {activeSection === "Habit Todo" && (
            <HabitTodo />
          )}

          {activeSection === "Social Hub" && (
            <div className="space-y-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-xl"></div>
                <div className="relative backdrop-blur-xl border rounded-2xl p-8" 
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
            <div className="space-y-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl"></div>
                <div className="relative backdrop-blur-xl border rounded-2xl p-8" 
                     style={{background: 'var(--glass-bg)', borderColor: 'var(--glass-border)'}}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
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
            <SocialFeaturesTest />
          )}

          {/* Area Sections */}
          {areas.map(a => (
            activeSection === `AREA_${a.id}` && (
              <div key={a.id} className="space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl"></div>
                  <div className="relative backdrop-blur-xl border rounded-2xl p-8" 
                       style={{background: 'var(--glass-bg)', borderColor: 'var(--glass-border)'}}>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl shadow-lg">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                          </svg>
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
                      <div className="flex gap-2">
                        <button onClick={()=> setShowAreaManager(true)} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-all duration-300">
                          Manage Areas
                        </button>
                        <button onClick={()=> setActiveSection('Dashboard')} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-300">
                          Back
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="backdrop-blur-sm border rounded-2xl p-6" style={{background: 'var(--glass-bg)', borderColor: 'var(--glass-border)'}}>
                          <h4 className="text-lg font-bold text-blue-400 mb-4">Create Habit in this Area</h4>
                          <HabitForm onCreated={(habit)=> {
                            setAreas(prev => prev.map(ar => ar.id === a.id ? { ...ar, habits: [habit._id, ...(ar.habits||[])] } : ar));
                          }} />
                        </div>
                        <div className="backdrop-blur-sm border rounded-2xl p-6" style={{background: 'var(--glass-bg)', borderColor: 'var(--glass-border)'}}>
                          <h4 className="text-lg font-bold text-green-400 mb-4">Create Habit Group</h4>
                          <GroupForm onCreated={(group)=> {
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