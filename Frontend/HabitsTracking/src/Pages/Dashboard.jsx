import React, { useState, useEffect } from "react";
import { useChartData } from "../context/useChartData";
import HabitForm from "../Components/Habits/HabitForm";
import HabitList from "../Components/Habits/HabitList";
import HabitTracker from "../Components/Habits/HabitTracker";
import { fetchHabits } from "../api/habits";
import { fetchProgressSummary } from "../api/progress";
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
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const sidebarItems = [
  { label: "Dashboard", icon: <FaHome /> },
  { label: "All Habits", icon: <FaListAlt /> },
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
  const [selectedFriend, setSelectedFriend] = useState("Ali");
  const followers = ["Ali", "Sara", "Ahmed"];
  const requests = ["Bilal", "Fatima"];
  const friends = ["Ali", "Sara", "Ahmed", "Bilal", "Fatima"];
  const { userProgressData, friendData, compareData, setFriendData, setCompareData } = useChartData();
  const [habits, setHabits] = useState([]);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [editingHabit, setEditingHabit] = useState(null);
  const [habitLoading, setHabitLoading] = useState(false);

  const loadHabits = async () => {
    setHabitLoading(true);
    try { const data = await fetchHabits(); setHabits(data); }
    catch { /* could show toast */ }
    finally { setHabitLoading(false); }
  };
  useEffect(() => { loadHabits(); }, []);

  // Generate deterministic mock data per friend (placeholder until backend integration)
  const generateFriendWeeklyData = (name) => {
    const base = [8, 12, 14, 16, 19, 13, 20];
    const shift = name.charCodeAt(0) % 5; // simple deterministic variation
    return base.map((v, i) => (v + ((shift + i) % 3) - 1));
  };

  useEffect(() => {
    if (!selectedFriend) return;
    const newFriendValues = generateFriendWeeklyData(selectedFriend);
    // Update friendData chart
    setFriendData(prev => ({
      ...prev,
      datasets: [
        {
          ...prev.datasets[0],
          label: `${selectedFriend}'s Progress`,
          data: newFriendValues,
        }
      ]
    }));

    // Preserve user's dataset from existing compareData (label 'You') or create fallback
    const userDataset = (compareData.datasets || []).find(d => d.label === 'You') || {
      label: 'You',
      data: [10, 15, 12, 18, 20, 17, 22],
      backgroundColor: '#38bdf8',
      borderRadius: 8
    };

    setCompareData(prev => ({
      ...prev,
      datasets: [
        userDataset,
        {
          label: selectedFriend,
            data: newFriendValues,
            backgroundColor: '#34d399',
            borderRadius: 8
        }
      ]
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFriend]);

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
                <div className="text-lg text-blue-400 font-bold">75% Completed</div>
              </div>
              <div className="bg-slate-800 rounded-xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-green-300">Friend's Progress</h2>
                  <select
                    className="bg-slate-700 text-white px-3 py-2 rounded-lg"
                    value={selectedFriend}
                    onChange={e => setSelectedFriend(e.target.value)}
                  >
                    {friends.map(friend => (
                      <option key={friend} value={friend}>{friend}</option>
                    ))}
                  </select>
                </div>
                <Bar key={`friend-bar-${selectedFriend}`} data={friendData} options={chartOptions} />
              </div>
              <div className="bg-slate-800 rounded-xl shadow-lg p-8 col-span-1 md:col-span-2">
                <h2 className="text-2xl font-bold text-purple-300 mb-4">Compare Progress</h2>
                <Bar key="compare-bar" data={compareData} options={chartOptions} />
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
                <HabitForm
                  editing={editingHabit}
                  onCreated={(h) => { setHabits(prev => [h, ...prev]); setSelectedHabit(h); }}
                  onUpdated={(h) => {
                    if (!h) { setEditingHabit(null); return; }
                    setHabits(prev => prev.map(ph => ph._id === h._id ? h : ph));
                    setEditingHabit(null);
                    setSelectedHabit(h);
                  }}
                />
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold">Your Habits</h3>
                    <button onClick={loadHabits} className="text-xs px-2 py-1 bg-slate-600 rounded text-white">Refresh</button>
                  </div>
                  {habitLoading && <div className="text-slate-400 text-xs mb-2">Loading...</div>}
                  <HabitList
                    habits={habits}
                    onSelect={(h) => { setEditingHabit(h); setSelectedHabit(h); }}
                    onArchived={(id) => setHabits(prev => prev.filter(h => h._id !== id))}
                  />
                </div>
              </div>
              <div className="col-span-1">
                <HabitTracker habit={selectedHabit} />
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
                    {followers.map(f => (
                      <li key={f} className="bg-slate-700 rounded-lg px-4 py-2 text-white">{f}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-400 mb-2">Requests</h3>
                  <ul className="space-y-2">
                    {requests.map(r => (
                      <li key={r} className="bg-slate-700 rounded-lg px-4 py-2 text-white">{r}</li>
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