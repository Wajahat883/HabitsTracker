import React, { useState, useEffect } from "react";
import { useChartData } from "../context/useChartData";
import { useHabitContext } from "../context/HabitContext";
import HabitForm from "../Components/Habits/HabitForm";
import HabitList from "../Components/Habits/HabitList";
import HabitTracker from "../Components/Habits/HabitTracker";
import NotificationBell from "../Components/Notifications/NotificationBell";
import UserSearch from "../Components/Friends/UserSearch";
import AllUsersList from "../Components/Friends/AllUsersList";
import SocialFeaturesTest from "../Components/Common/SocialFeaturesTest";
import { Bar, Doughnut } from "react-chartjs-2";
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
import { FaHome, FaListAlt, FaSun, FaRegSun, FaMoon, FaPlus, FaInfinity, FaPause, FaCreditCard, FaCog, FaLink, FaUserFriends, FaCheckCircle } from "react-icons/fa";
import image from '../assets/logo-habit-tracker.png';
import ProgressSummary from "../Components/Progress/ProgressSummary";
import HabitTrendChart from "../Components/Progress/HabitTrendChart";
import CalendarHeatmap from "../Components/Progress/CalendarHeatmap";
import GroupForm from "../Components/Groups/GroupForm";
import FriendsList from "../Components/Friends/FriendsList";
import InviteFriends from "../Components/Friends/InviteFriends";
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const sidebarItems = [
  { label: "Dashboard", icon: <FaHome /> },
  { label: "All Habits", icon: <FaListAlt /> },
  { label: "Progress", icon: <FaRegSun /> },
  { label: "Morning", icon: <FaSun /> },
  { label: "Afternoon", icon: <FaRegSun /> },
  { label: "Evening", icon: <FaMoon /> },
  { label: "New Area", icon: <FaPlus /> },
  { label: "Habits", icon: <FaInfinity /> },
  { label: "Off Mode", icon: <FaPause /> },
  { label: "Payment", icon: <FaCreditCard /> },
  { label: "App Settings", icon: <FaCog /> },
  { label: "Resources", icon: <FaLink /> },
  { label: "Friends", icon: <FaUserFriends /> },
  { label: "Status", icon: <FaCheckCircle /> },
];

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

const doughnutOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true },
  },
};

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState("Dashboard");
  const { userProgressData, friendData, compareData, setFriendData, setCompareData } = useChartData();
  const {
    habits,
    setHabits,
    selectedHabit,
    setSelectedHabit,
    editingHabit,
    setEditingHabit,
    habitLoading,
    groups,
    setGroups,
    selectedGroup,
    setSelectedGroup,
    selectedFriend,
    setSelectedFriend,
    friendProgress,
    setFriendProgress,
    groupProgress,
    setGroupProgress,
    allUsersProgress,
    progressSummary,
    setProgressSummary,
    friends,
    loadHabits,
    fetchFriendProgressData,
    fetchGroupProgressData,
  } = useHabitContext();

  // Update charts with real data including friends and groups
  useEffect(() => {
    if (!progressSummary) return;
    const habitStreaks = progressSummary.habitStreaks || [];
    const userLabels = habitStreaks.map(h => h.title);
    const userData = habitStreaks.map(h => h.streak);

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
      const friendLabels = friendProgress.habitStreaks.map(h => h.title);
      const friendData = friendProgress.habitStreaks.map(h => h.streak);
      datasets.push({
        label: 'Friend\'s Streaks',
        data: friendData,
        backgroundColor: '#f59e0b',
        borderRadius: 8
      });
    }

    // Add group data if available
    if (groupProgress?.habitStreaks) {
      const groupLabels = groupProgress.habitStreaks.map(h => h.title);
      const groupData = groupProgress.habitStreaks.map(h => h.streak);
      datasets.push({
        label: 'Group Streaks',
        data: groupData,
        backgroundColor: '#10b981',
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

    // Add group data to second chart if selected
    if (selectedGroup && groupProgress?.habitStreaks) {
      const groupData = groupProgress.habitStreaks.map(h => h.streak);
      friendDatasets.push({
        label: 'Group Streaks',
        data: groupData,
        backgroundColor: '#10b981',
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
  }, [progressSummary, friendProgress, groupProgress, selectedFriend, selectedGroup, setFriendData, setCompareData]);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Fixed Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-slate-800 flex items-center justify-between px-8 shadow-md z-40 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <img src={image} alt="Habit Tracker Logo" className="h-10 w-10" />
          <span className="text-xl font-bold text-blue-400 tracking-tight">HabitTracker</span>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <span className="text-white font-semibold">Guest</span>
          <div className="h-10 w-10 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold">G</div>
        </div>
      </nav>
      {/* Fixed Sidebar */}
      <aside className="fixed top-16 left-0 bottom-0 w-72 bg-slate-900 text-white flex flex-col py-6 px-4 shadow-xl border-r border-slate-800 overflow-y-auto z-30">
        <nav className="flex-1">
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.label}>
                <button
                  className={`w-full flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-blue-800 transition font-semibold ${activeSection === item.label ? "bg-blue-700 text-white" : ""}`}
                  onClick={() => setActiveSection(item.label)}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      {/* Scrollable Content Area */}
      <main className="pt-20 ml-72 p-10 min-h-screen grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto">
        {/* Dashboard Section */}
          {activeSection === "Dashboard" && (
            <>
              {/* Friend Selection Control */}
              <div className="col-span-1 md:col-span-2 bg-slate-800 rounded-xl shadow-lg p-6">
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
                      className="w-full bg-slate-700 text-white p-3 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Select a friend to compare...</option>
                      {friends.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
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

              {/* Chart 1: Your Progress */}
              <div className="bg-slate-800 rounded-xl shadow-lg p-8 flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold text-blue-300 mb-4">Your Progress</h2>
                <div className="w-48 h-48 mb-4">
                  <Doughnut key="user-progress-doughnut" data={userProgressData} options={doughnutOptions} />
                </div>
                <div className="text-lg text-blue-400 font-bold">{progressSummary ? `${progressSummary.overallCompletion}% Completed` : 'Loading...'}</div>
                <div className="mt-2 text-sm text-slate-300">
                  Active Habits: {progressSummary?.activeHabits || 0}
                </div>
                <div className="text-sm text-slate-300">
                  Avg Streak: {progressSummary?.avgStreak || 0} days
                </div>
              </div>

              {/* Chart 2: Friend's Progress (with selection) */}
              <div className="bg-slate-800 rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-yellow-300 mb-4">Friend's Progress</h2>
                
                {/* Friend Selection Dropdown */}
                <div className="mb-6">
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
                    className="w-full bg-slate-700 text-white p-3 rounded-lg border border-slate-600 focus:border-yellow-500 focus:outline-none"
                  >
                    <option value="">Select a friend to view progress...</option>
                    {friends.map(f => (
                      <option key={f._id} value={f._id}>
                        {f.name || f.username || 'Unknown Friend'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Progress Display */}
                <div className="flex flex-col items-center justify-center">
                  {selectedFriend && friendProgress ? (
                    <>
                      <div className="w-48 h-48 mb-4">
                        <Doughnut 
                          key="friend-progress-doughnut" 
                          data={{
                            labels: ['Completed', 'Remaining'],
                            datasets: [{
                              data: [friendProgress.overallCompletion || 0, 100 - (friendProgress.overallCompletion || 0)],
                              backgroundColor: ['#f59e0b', '#374151'],
                              borderWidth: 0
                            }]
                          }} 
                          options={doughnutOptions} 
                        />
                      </div>
                      <div className="text-lg text-yellow-400 font-bold">{friendProgress.overallCompletion || 0}% Completed</div>
                      <div className="mt-2 text-sm text-slate-300">
                        Active Habits: {friendProgress.activeHabits || 0}
                      </div>
                      <div className="text-sm text-slate-300">
                        Avg Streak: {friendProgress.avgStreak || 0} days
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-400 text-center py-8">
                      {selectedFriend ? 'Loading friend\'s progress...' : 'Select a friend above to view their progress'}
                      {friends.length === 0 && (
                        <div className="mt-2 text-sm">
                          <p>No friends added yet.</p>
                          <p>Go to Friends section to add friends!</p>
                        </div>
                      )}
                    </div>
                  )}
              </div>

              {/* Chart 3: All Friends Progress */}
              <div className="bg-slate-800 rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-green-300 mb-4">All Friends Progress</h2>
                <div className="aspect-square">
                  <Bar 
                    key="all-friends-bar" 
                    data={{
                      labels: friends.map(f => f.name || 'Unknown'),
                      datasets: [{
                        label: 'Friend\'s Avg Streak',
                        data: friends.map(() => Math.floor(Math.random() * 20)), // This will be replaced with real data
                        backgroundColor: '#10b981',
                        borderRadius: 8
                      }]
                    }} 
                    options={chartOptions} 
                  />
                </div>
                {friends.length === 0 && (
                  <div className="text-slate-400 text-center py-4">
                    No friends added yet. Add friends to see their progress here.
                  </div>
                )}
              </div>

              {/* Chart 4: Your vs Selected Friend Comparison */}
              <div className="bg-slate-800 rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-purple-300 mb-4">
                  {selectedFriend ? `You vs ${friends.find(f => f._id === selectedFriend)?.name}` : 'Select Friend for Comparison'}
                </h2>
                <div className="aspect-square">
                  <Bar key="comparison-bar" data={compareData} options={chartOptions} />
                </div>
                <div className="mt-4 flex flex-wrap gap-4 justify-center">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-400 rounded"></div>
                    <span className="text-slate-300 text-sm">Your Streaks</span>
                  </div>
                  {selectedFriend && friendProgress && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                      <span className="text-slate-300 text-sm">{friends.find(f => f._id === selectedFriend)?.name}'s Streaks</span>
                    </div>
                  )}
                </div>
                {!selectedFriend && (
                  <div className="text-slate-400 text-center py-4">
                    Select a friend above to compare your progress with theirs.
                  </div>
                )}
              </div>
              
              {/* Quick Habit Tracker */}
              <div className="col-span-1 md:col-span-2 bg-slate-800 rounded-xl shadow-lg p-6">
                <h3 className="text-white font-semibold mb-4">Quick Habit Tracker</h3>
                <p className="text-slate-400 text-sm mb-4">Select a habit to track your daily progress and see streaks in charts above</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-slate-300 text-sm mb-2">Select Habit to Track</label>
                    <select
                      value={selectedHabit?._id || ""}
                      onChange={(e) => {
                        const habitId = e.target.value;
                        const habit = habits.find(h => h._id === habitId);
                        setSelectedHabit(habit || null);
                      }}
                      className="w-full bg-slate-700 text-white p-3 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Select a habit to track...</option>
                      {habits.map(h => <option key={h._id} value={h._id}>{h.title}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end">
                    {selectedHabit ? (
                      <div className="text-green-400 text-sm">
                        ✓ Tracking: <span className="font-semibold">{selectedHabit.title}</span>
                      </div>
                    ) : (
                      <div className="text-slate-400 text-sm">
                        No habit selected for tracking
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <HabitTracker />
                </div>
              </div>
              </div>
            </>
          )}
          {activeSection === "All Habits" && (
            <>
              <div className="col-span-1 space-y-4">
                <HabitForm />
                <GroupForm />
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold">Your Habits</h3>
                    <button onClick={loadHabits} className="text-xs px-2 py-1 bg-slate-600 rounded text-white">Refresh</button>
                  </div>
                  {habitLoading && <div className="text-slate-400 text-xs mb-2">Loading...</div>}
                  <HabitList />
                </div>
              </div>
              <div className="col-span-1">
                <HabitTracker />
              </div>
            </>
          )}
          {/* Progress Section */}
          {activeSection === "Progress" && (
            <>
              <div className="col-span-2 space-y-4">
                <ProgressSummary />
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <h3 className="text-white font-semibold mb-4">Progress Charts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-slate-300 text-sm mb-1">Select Friend</label>
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
                        className="w-full bg-slate-700 text-white p-2 rounded border border-slate-600"
                      >
                        <option value="">None</option>
                        {friends.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm mb-1">Select Group</label>
                      <select
                        value={selectedGroup || ""}
                        onChange={(e) => {
                          const groupId = e.target.value;
                          setSelectedGroup(groupId);
                          if (groupId) {
                            fetchGroupProgressData(groupId);
                          } else {
                            setGroupProgress(null);
                          }
                        }}
                        className="w-full bg-slate-700 text-white p-2 rounded border border-slate-600"
                      >
                        <option value="">None</option>
                        {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-700 p-4 rounded border border-slate-600">
                      <h4 className="text-white font-medium mb-2">Your Progress</h4>
                      <HabitTrendChart data={progressSummary?.habitStreaks || []} />
                    </div>
                    <div className="bg-slate-700 p-4 rounded border border-slate-600">
                      <h4 className="text-white font-medium mb-2">Friend's Progress</h4>
                      {selectedFriend && friendProgress ? (
                        <HabitTrendChart data={friendProgress.habitStreaks || []} />
                      ) : (
                        <div className="text-slate-400 text-sm">Select a friend to view progress</div>
                      )}
                    </div>
                    <div className="bg-slate-700 p-4 rounded border border-slate-600">
                      <h4 className="text-white font-medium mb-2">Group Progress</h4>
                      {selectedGroup && groupProgress ? (
                        <HabitTrendChart data={groupProgress.habitStreaks || []} />
                      ) : (
                        <div className="text-slate-400 text-sm">Select a group to view progress</div>
                      )}
                    </div>
                    <div className="bg-slate-700 p-4 rounded border border-slate-600">
                      <h4 className="text-white font-medium mb-2">All Users Progress</h4>
                      <HabitTrendChart data={allUsersProgress?.habitStreaks || []} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-span-1">
                <CalendarHeatmap />
              </div>
            </>
          )}
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
      </main>
    </div>
  );
};
export default Dashboard;