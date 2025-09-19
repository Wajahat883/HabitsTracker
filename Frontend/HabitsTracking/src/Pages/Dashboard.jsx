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
  // Get current user data for personalized greeting
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('currentUser')) || { name: 'User' };
    } catch {
      return { name: 'User' };
    }
  });
  
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
    setFriendProgress,
  groupProgress, // may still influence compareData calculations
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
  }, [
    progressSummary,
    friendProgress,
     groupProgress,
      selectedFriend,
       setFriendData, 
       setCompareData, 
       habits,
       getStreak
      ]);

  // Friends progress (aggregate) for All Friends bar chart
  const [friendsProgress, setFriendsProgress] = useState([]);
  useEffect(() => {
    if (friends.length === 0) { setFriendsProgress([]); return; }
    let ignore = false;
    fetchFriendsProgress('30d').then(data => { if(!ignore) setFriendsProgress(data || []); }).catch(()=>{});
    return () => { ignore = true; };
  }, [friends.length]);

  // Listen for section change events from AppShell (hash navigation)
  useEffect(()=> {
    const handler = (e) => { const next = e.detail; if(next) setActiveSection(next); };
    window.addEventListener('dashboardSectionChange', handler);
    return ()=> window.removeEventListener('dashboardSectionChange', handler);
  }, []);

  // Persist areas
  useEffect(() => {
    try { localStorage.setItem('habitTracker_areas_v2', JSON.stringify(areas)); } catch { /* ignore persist errors */ }
  }, [areas]);

  // Auth/session effects removed – Dashboard assumes authenticated context via AppShell

  // ---- Derived Dashboard Metrics ----
  const todayISO = new Date().toISOString().split('T')[0];
  const totalHabits = Array.isArray(habits) ? habits.length : 0;
  const activeHabits = Array.isArray(habits) ? habits.filter(h => !h.endDate || h.endDate >= todayISO).length : 0;
  const longestStreak = (() => {
    const ps = progressSummary?.habitStreaks || [];
    let max = 0;
    for (const hs of ps) if (typeof hs.streak === 'number' && hs.streak > max) max = hs.streak;
    if (max === 0 && Array.isArray(habits)) {
      for (const h of habits) { const s = getStreak(h._id); if (s > max) max = s; }
    }
    return max;
  })();
  const friendsCount = uniqueFriends.length;
  const todayCompletionCount = progressSummary?.todayCompletions || 0; // fallback
  const completionRate = progressSummary?.overallCompletionRate != null ? Math.round(progressSummary.overallCompletionRate) : null;

  return (
    <div className="p-6 md:p-10 min-h-screen grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto text-primary animate-fadein">
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
          {/* Personal Greeting Header */}
          <div className="col-span-1 md:col-span-2 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-800 mb-2">
                  Good morning, {currentUser.name || 'User'}! 👋
                </h1>
                <p className="text-gray-600">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">{todayCompletionCount}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-800">{totalHabits}</div>
                  <div className="text-sm text-gray-600">Total Habits</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500">{completionRate != null ? `${completionRate}%` : '0%'}</div>
                  <div className="text-sm text-gray-600">Complete</div>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Progress Bar */}
          <div className="col-span-1 md:col-span-2 mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium text-gray-800">Today's Progress</h2>
              <span className="text-sm text-gray-600">{todayCompletionCount} of {totalHabits} habits</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all duration-300" 
                style={{ width: totalHabits > 0 ? `${(todayCompletionCount / totalHabits) * 100}%` : '0%' }}
              ></div>
            </div>
          </div>

          {/* Today's Habits Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Today's Habits</h2>
              <button 
                onClick={() => setShowHabitForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <span className="text-lg">+</span>
                Add Habit
              </button>
            </div>

            {/* Habit Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {habits.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <div className="text-gray-400 text-lg mb-4">No habits yet</div>
                  <button 
                    onClick={() => setShowHabitForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Create Your First Habit
                  </button>
                </div>
              ) : (
                habits.map((habit) => {
                  const streak = getStreak(habit._id);
                  const habitType = habit.durationMinutes ? 'Time-based' : habit.targetCount ? 'Goal-oriented' : 'Binary';
                  const typeColor = habitType === 'Binary' ? 'green' : habitType === 'Time-based' ? 'blue' : 'orange';
                  
                  return (
                    <div key={habit._id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">{habit.title}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm px-2 py-1 bg-${typeColor}-100 text-${typeColor}-700 rounded`}>
                            {habitType}
                          </span>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            🔥 {streak}
                          </span>
                        </div>
                      </div>

                      {/* Binary Habit */}
                      {habitType === 'Binary' && (
                        <button className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors">
                          Mark Complete
                        </button>
                      )}

                      {/* Time-based Habit */}
                      {habitType === 'Time-based' && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                            <span>Goal: {habit.durationMinutes} minutes</span>
                            <span>0 minutes</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                          </div>
                          <div className="flex gap-2">
                            <button className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium transition-colors">
                              +15m
                            </button>
                            <button className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium transition-colors">
                              +30m
                            </button>
                            <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                              min
                            </button>
                            <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                              +
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Goal-oriented Habit */}
                      {habitType === 'Goal-oriented' && (
                        <div className="mb-4">
                          <div className="text-sm text-gray-600 mb-2">
                            Goal: {habit.targetCount} {habit.title.toLowerCase().includes('water') ? 'glasses' : 'units'}
                          </div>
                          <div className="text-lg font-medium text-gray-800 mb-3">0 completed</div>
                          <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                            <span className="text-lg">+</span>
                            +1 {habit.title.toLowerCase().includes('water') ? 'glass' : 'unit'}
                          </button>
                        </div>
                      )}

                      {habit.description && (
                        <div className="mt-3 text-sm text-gray-500 border-t pt-3">
                          {habit.description}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
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
  );
};
export default Dashboard;