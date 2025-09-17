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
  // Areas local state (persist in localStorage)
  const [areas, setAreas] = useState(() => {
    try {
      const raw = localStorage.getItem('habitTracker_areas_v2');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [editingArea, setEditingArea] = useState(null);
  const [areaNameDraft, setAreaNameDraft] = useState('');
  const saveAreaEdit = () => {
    if (!areaNameDraft.trim() || !editingArea) { setEditingArea(null); return; }
    setAreas(prev => prev.map(a => a.id === editingArea.id ? { ...a, name: areaNameDraft.trim() } : a));
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
    selectedHabit,
    setSelectedHabit,
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
    const seen = new Set();
    return (friends || []).filter(f => {
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
  }, [progressSummary, friendProgress, groupProgress, selectedFriend, setFriendData, setCompareData, habits, getStreak]);

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

  return (
    <div className="p-10 min-h-screen grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto text-primary">
      {editingArea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e)=> { if(e.target===e.currentTarget) cancelAreaEdit(); }}>
          <div className="bg-surface border border-app rounded-xl w-full max-w-sm p-5 relative">
            <button className="absolute top-2 right-2 text-muted hover:text-primary" onClick={cancelAreaEdit}>✕</button>
            <h4 className="text-primary font-semibold mb-4 text-sm">Edit Area</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wide text-muted mb-1">Area Name</label>
                <input
                  autoFocus
                  type="text"
                  value={areaNameDraft}
                  onChange={(e)=> setAreaNameDraft(e.target.value)}
                  onKeyDown={(e)=> e.key==='Enter' && saveAreaEdit()}
                  className="w-full bg-app-alt border border-app rounded-lg p-3 text-primary focus:outline-none focus:border-accent text-sm"
                  placeholder="Enter area name"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={saveAreaEdit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-xs">Save</button>
                <button onClick={cancelAreaEdit} className="flex-1 bg-app-alt hover:bg-surface border border-app text-primary font-medium py-2 rounded-lg text-xs">Cancel</button>
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
      {/* Dashboard Content */}
        {/* Dashboard Section */}
          {activeSection === "Dashboard" && (
            <>
              {/* Friend Selection Control */}
              <div className="col-span-1 md:col-span-2 bg-surface rounded-xl shadow-lg p-6 border border-app">
                <h3 className="text-white font-semibold mb-4">Select Friend for Comparison</h3>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <select
                      value={selectedFriend || ""}
                      onChange={(e) => {
                        const friendId = e.target.value;
                        setSelectedFriend(friendId);
                        if (friendId) {
                          fetchFriendProgressData(friendId);
                        } else {
                          setFriendProgress(null);
                        }
                      }}
                      className="w-full bg-app-alt text-primary p-3 rounded-lg border border-app focus:border-accent focus:outline-none"
                    >
                      <option value="">Select a friend to compare...</option>
                      {uniqueFriends.map(f => <option key={`friend-opt-${f._id}`} value={f._id}>{f.name}</option>)}
                    </select>
                  </div>
                  {selectedFriend && (
                    <button
                      onClick={() => {
                        setSelectedFriend(null);
                        setFriendProgress(null);
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Four Bar Charts Layout */}
              {/* 1. Your Progress (Bar) */}
              <div className="bg-surface rounded-xl shadow-lg p-6 border border-app">
                <h2 className="text-xl font-bold text-blue-300 mb-4">Your Progress</h2>
                <Bar 
                  key="your-progress-bar" 
                  data={{
                    labels: (progressSummary?.habitStreaks||[]).map(h=>h.title),
                    datasets: [{
                      label: 'Streak (days)',
                      data: (progressSummary?.habitStreaks||[]).map(h=>h.streak),
                      backgroundColor: '#38bdf8',
                      borderRadius: 6
                    }]
                  }}
                  options={chartOptions}
                />
                {!progressSummary && <div className="text-muted text-sm mt-4">Loading your progress...</div>}
              </div>

              {/* 2. Selected Friend Progress (Bar) */}
              <div className="bg-surface rounded-xl shadow-lg p-6 border border-app">
                <h2 className="text-xl font-bold text-yellow-300 mb-4">Friend's Progress</h2>
                <div className="mb-3">
                  <select
                    value={selectedFriend || ''}
                    onChange={(e)=> {
                      const id = e.target.value; setSelectedFriend(id); if (id) fetchFriendProgressData(id); else setFriendProgress(null);
                    }}
                    className="w-full bg-app-alt text-primary p-2 rounded border border-app text-sm focus:border-accent focus:outline-none"
                  >
                    <option value="">Select Friend...</option>
                    {uniqueFriends.map(f=> <option key={`friend-sel-${f._id}`} value={f._id}>{f.name||'Friend'}</option>)}
                  </select>
                </div>
                {selectedFriend && friendProgress ? (
                  <Bar
                    key="friend-progress-bar"
                    data={{
                      labels: (friendProgress.habitStreaks||[]).map(h=>h.title),
                      datasets: [{
                        label: `${friends.find(f=>f._id===selectedFriend)?.name||'Friend'} Streak`,
                        data: (friendProgress.habitStreaks||[]).map(h=>h.streak),
                        backgroundColor: '#f59e0b',
                        borderRadius: 6
                      }]
                    }}
                    options={chartOptions}
                  />
                ) : (
                  <div className="text-muted text-sm">Select a friend to view their progress.</div>
                )}
              </div>

              {/* 3. Comparison (You vs Friend) */}
              <div className="bg-surface rounded-xl shadow-lg p-6 border border-app">
                <h2 className="text-xl font-bold text-purple-300 mb-4">Comparison</h2>
                <Bar key="comparison-bar" data={compareData} options={chartOptions} />
                {!selectedFriend && <div className="text-muted text-xs mt-3">Select a friend to populate comparison chart.</div>}
              </div>

              {/* 4. All Friends Aggregate */}
              <div className="bg-surface rounded-xl shadow-lg p-6 border border-app">
                <h2 className="text-xl font-bold text-green-300 mb-4">All Friends</h2>
                <Bar
                  key="all-friends-progress-bar"
                  data={{
                    labels: friendsProgress.map(fp => fp.name),
                    datasets: [{
                      label: 'Completion %',
                      data: friendsProgress.map(fp => fp.overallCompletion),
                      backgroundColor: '#10b981',
                      borderRadius: 6
                    }]
                  }}
                  options={chartOptions}
                />
                {friendsProgress.length === 0 && <div className="text-muted text-sm mt-3">No friend progress yet.</div>}
              </div>
              
              {/* Your Folders Section */}
              {/* Removed old habit folder grid */}

              {/* Quick Habit Tracker */}
              <div className="col-span-1 md:col-span-2 bg-surface rounded-xl shadow-lg p-6 border border-app">
                <h3 className="text-white font-semibold mb-4">Quick Habit Tracker</h3>
                <p className="text-muted text-sm mb-4">Select a habit to track your daily progress and see streaks in charts above</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-secondary text-sm mb-2">Select Habit to Track</label>
                    <select
                      value={selectedHabit?._id || ""}
                      onChange={(e) => {
                        const habitId = e.target.value;
                        const habit = habits.find(h => h._id === habitId);
                        setSelectedHabit(habit || null);
                      }}
                      className="w-full bg-app-alt text-primary p-3 rounded-lg border border-app focus:border-accent focus:outline-none"
                    >
                      <option value="">Select a habit to track...</option>
                      {habits.map(h => <option key={`habit-opt-${h._id}`} value={h._id}>{h.title}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end">
                    {selectedHabit ? (
                      <div className="text-green-400 text-sm">
                        ✓ Tracking: <span className="font-semibold">{selectedHabit.title}</span>
                      </div>
                    ) : (
                      <div className="text-muted text-sm">
                        No habit selected for tracking
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <HabitTracker />
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
          {/* Friends Section */}
          {activeSection === "Friends" && (
            <>
              {/* Current Friends List */}
              <div className="col-span-1">
                <FriendsList />
              </div>
              
              {/* Invite by Email/Link */}
              <div className="col-span-1">
                <InviteFriends onInviteSent={() => {
                  // Refresh friends list when invite is sent
                  loadHabits(); // This also loads friends in the context
                }} />
              </div>
              
              {/* Search Existing Users */}
              <div className="col-span-1">
                <UserSearch />
              </div>
              
              {/* All Users List with Pagination */}
              <div className="col-span-1">
                <AllUsersList />
              </div>
            </>
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