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
      {/* Dashboard Content */}
      {/* Dashboard Section */}
      {activeSection === "Dashboard" && (
        <>
          {/* Hero / Overview Section */}
          <div className="col-span-1 md:col-span-2 relative overflow-hidden rounded-3xl p-8 md:p-10 bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700 shadow-xl text-white animate-fadein">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
            <div className="relative flex flex-col lg:flex-row lg:items-end gap-8">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Your Habit Performance</h1>
                <p className="text-sm md:text-base text-indigo-100 max-w-xl leading-relaxed">Stay consistent, track streaks, and compare with friends. This dashboard gives you a fast overview of progress and opportunities to improve.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 w-full lg:w-auto">
                <div className="backdrop-blur bg-white/10 rounded-2xl p-4 border border-white/15 shadow-inner">
                  <div className="text-[11px] uppercase tracking-wide text-indigo-200 mb-1">Habits</div>
                  <div className="text-2xl font-bold">{totalHabits}</div>
                  <div className="text-[11px] text-indigo-300">{activeHabits} active</div>
                </div>
                <div className="backdrop-blur bg-white/10 rounded-2xl p-4 border border-white/15 shadow-inner">
                  <div className="text-[11px] uppercase tracking-wide text-indigo-200 mb-1">Longest Streak</div>
                  <div className="text-2xl font-bold">{longestStreak}</div>
                  <div className="text-[11px] text-indigo-300">days</div>
                </div>
                <div className="backdrop-blur bg-white/10 rounded-2xl p-4 border border-white/15 shadow-inner hidden sm:block">
                  <div className="text-[11px] uppercase tracking-wide text-indigo-200 mb-1">Today Done</div>
                  <div className="text-2xl font-bold">{todayCompletionCount}</div>
                  <div className="text-[11px] text-indigo-300">completions</div>
                </div>
                <div className="backdrop-blur bg-white/10 rounded-2xl p-4 border border-white/15 shadow-inner">
                  <div className="text-[11px] uppercase tracking-wide text-indigo-200 mb-1">Friends</div>
                  <div className="text-2xl font-bold">{friendsCount}</div>
                  <div className="text-[11px] text-indigo-300">connected</div>
                </div>
                <div className="backdrop-blur bg-white/10 rounded-2xl p-4 border border-white/15 shadow-inner">
                  <div className="text-[11px] uppercase tracking-wide text-indigo-200 mb-1">Completion</div>
                  <div className="text-2xl font-bold">{completionRate != null ? `${completionRate}%` : '—'}</div>
                  <div className="text-[11px] text-indigo-300">overall</div>
                </div>
              </div>
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
              {/* Quick Habit Tracker section removed as per user request */}
              
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