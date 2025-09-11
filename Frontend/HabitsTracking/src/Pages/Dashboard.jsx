import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const sidebarItems = [
  { label: "Analytics", icon: "📊" },
  { label: "To Do", icon: "✅" },
  { label: "Inbox", icon: "📥" },
  { label: "Attendance Calendar", icon: "🗓️" },
  { label: "Worker", icon: "👤" },
  { label: "Team", icon: "👥" },
  { label: "Payment", icon: "💳" },
  { label: "Settings", icon: "⚙️" },
  { label: "News", icon: "📰" },
  { label: "Backup Data", icon: "💾" },
];

// Example data for user, friend, and comparison
const userData = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [
    {
      label: "Your Progress",
      data: [10, 15, 12, 18, 20, 17, 22],
      backgroundColor: "#38bdf8",
      borderRadius: 8,
    },
  ],
};

const friendData = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [
    {
      label: "Friend's Progress",
      data: [8, 12, 14, 16, 19, 13, 20],
      backgroundColor: "#34d399",
      borderRadius: 8,
    },
  ],
};

const compareData = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [
    {
      label: "You",
      data: [10, 15, 12, 18, 20, 17, 22],
      backgroundColor: "#38bdf8",
      borderRadius: 8,
    },
    {
      label: "Friend",
      data: [8, 12, 14, 16, 19, 13, 20],
      backgroundColor: "#34d399",
      borderRadius: 8,
    },
  ],
};

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
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-900 via-slate-800 to-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col py-8 px-4 shadow-xl">
        <div className="text-2xl font-bold mb-8 tracking-tight text-blue-400">HabitTracker</div>
        <nav className="flex-1">
          <ul className="space-y-4">
            {sidebarItems.map((item) => (
              <li key={item.label}>
                <button className="w-full flex items-center gap-3 py-2 px-4 rounded-lg hover:bg-blue-800 transition">
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-semibold">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-blue-300 mb-4">Your Progress</h2>
          <Bar data={userData} options={chartOptions} />
        </div>
        <div className="bg-slate-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-green-300 mb-4">Friend's Progress</h2>
          <Bar data={friendData} options={chartOptions} />
        </div>
        <div className="bg-slate-800 rounded-xl shadow-lg p-8 col-span-1 md:col-span-2">
          <h2 className="text-2xl font-bold text-purple-300 mb-4">Compare Progress</h2>
          <Bar data={compareData} options={chartOptions} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
