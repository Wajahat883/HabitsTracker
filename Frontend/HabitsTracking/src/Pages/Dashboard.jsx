import React, { useState, useEffect } from "react";
import { useChartData } from "../context/useChartData";
import { useHabitContext } from "../context/HabitContext";
import HabitForm from "../Components/Habits/HabitForm";
import HabitList from "../Components/Habits/HabitList";
import HabitTracker from "../Components/Habits/HabitTracker";
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
import { FaHome, FaListAlt, FaSun, FaRegSun, FaMoon, FaPlus, FaInfinity, FaPause, FaCreditCard, FaCog, FaLink, FaUserFriends } from "react-icons/fa";
import image from '../assets/logo-habit-tracker.png';
import ProgressSummary from "../Components/Progress/ProgressSummary";
import HabitTrendChart from "../Components/Progress/HabitTrendChart";
import CalendarHeatmap from "../Components/Progress/CalendarHeatmap";
import GroupForm from "../Components/Groups/GroupForm";
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

  // Update charts with real data
  useEffect(() => {
    if (!progressSummary) return;
    const habitStreaks = progressSummary.habitStreaks || [];
    const labels = habitStreaks.map(h => h.title);
    const data = habitStreaks.map(h => h.streak);

    // Update friendData to show habit streaks
    setFriendData({
      labels,
      datasets: [{
        label: 'Habit Streaks',
        data,
        backgroundColor: '#38bdf8',
        borderRadius: 8
      }]
    });

    // Update compareData to show streaks
    setCompareData({
      labels,
      datasets: [{
        label: 'Streaks',
        data,
        backgroundColor: '#34d399',
        borderRadius: 8
      }]
    });
  }, [progressSummary, setFriendData, setCompareData]);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Fixed Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-slate-800 flex items-center justify-between px-8 shadow-md z-40 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <img src={image} alt="Habit Tracker Logo" className="h-10 w-10" />
          <span className="text-xl font-bold text-blue-400 tracking-tight">HabitTracker</span>
        </div>
        <div className="flex items-center gap-4">
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
              <div className="bg-slate-800 rounded-xl shadow-lg p-8 flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold text-blue-300 mb-4">Your Progress</h2>
                <div className="w-48 h-48 mb-4">
                  <Doughnut key="user-progress-doughnut" data={userProgressData} options={doughnutOptions} />
                </div>
                <div className="text-lg text-blue-400 font-bold">{progressSummary ? `${progressSummary.overallCompletion}% Completed` : 'Loading...'}</div>
              </div>
              <div className="bg-slate-800 rounded-xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-green-300">Habit Streaks</h2>
                </div>
                <div className="aspect-square">
                  <Bar key="habit-streaks-bar" data={friendData} options={chartOptions} />
                </div>
              </div>
              <div className="bg-slate-800 rounded-xl shadow-lg p-8 col-span-1 md:col-span-2">
                <h2 className="text-2xl font-bold text-purple-300 mb-4">Top Habit Streaks</h2>
                <div className="aspect-square">
                  <Bar key="top-streaks-bar" data={compareData} options={chartOptions} />
                </div>
              </div>
              <div className="col-span-1">
                <ProgressSummary />
              </div>
              <div className="col-span-1">
                <HabitTrendChart habit={selectedHabit} />
              </div>
              <div className="col-span-1 md:col-span-2">
                <CalendarHeatmap />
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
            <div className="bg-slate-800 rounded-xl shadow-lg p-8 col-span-1 md:col-span-2">
              <h2 className="text-2xl font-bold text-blue-300 mb-6">Friends</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-bold text-green-400 mb-2">Followers</h3>
                  <ul className="space-y-2">
                    {friends.map(f => (
                      <li key={f._id} className="bg-slate-700 rounded-lg px-4 py-2 text-white">{f.name}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-400 mb-2">Requests</h3>
                  <ul className="space-y-2">
                    {friends.slice(0, 2).map(r => (
                      <li key={r._id} className="bg-slate-700 rounded-lg px-4 py-2 text-white">{r.name}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
      </main>
    </div>
  );
};
export default Dashboard;