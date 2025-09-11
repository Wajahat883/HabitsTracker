import React from "react";

const Dashboard = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-lg text-center">
        <h1 className="text-3xl font-bold mb-4">Welcome to Your Dashboard</h1>
        <p className="mb-6">Track your habits, view your progress, and stay motivated!</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded bg-blue-50">
            <h2 className="text-xl font-semibold mb-2">Your Habits</h2>
            <p>View, add, and track your daily habits.</p>
          </div>
          <div className="p-4 border rounded bg-green-50">
            <h2 className="text-xl font-semibold mb-2">Progress & Leaderboard</h2>
            <p>See your streaks and compare with friends.</p>
          </div>
          <div className="p-4 border rounded bg-yellow-50">
            <h2 className="text-xl font-semibold mb-2">Motivational Quotes</h2>
            <p>Get inspired every day!</p>
          </div>
          <div className="p-4 border rounded bg-purple-50">
            <h2 className="text-xl font-semibold mb-2">Profile & Settings</h2>
            <p>Manage your account and privacy.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
