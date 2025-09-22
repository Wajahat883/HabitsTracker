import React, { useState } from 'react';
import { updateHabitProgress, simulateHabitActivity } from '../../api/habits';
import { toast } from 'react-toastify';

const DynamicTracker = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleUpdateProgress = async () => {
    setIsUpdating(true);
    try {
      const result = await updateHabitProgress();
      toast.success(`✅ Updated ${result.updatedHabits} habits dynamically!`);
      
      // Trigger a page refresh to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast.error('Failed to update habit progress');
      console.error('Progress update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSimulateActivity = async () => {
    setIsSimulating(true);
    try {
      const result = await simulateHabitActivity();
      toast.success(`🎯 Simulated activity for ${result.simulatedHabits} habits!`);
      
      // Trigger a page refresh to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast.error('Failed to simulate habit activity');
      console.error('Simulation error:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 p-6 rounded-xl border border-blue-500/20 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">🚀 Dynamic Habit Tracker</h3>
          <p className="text-sm text-gray-300">Auto-update and simulate habit progress</p>
        </div>
        <div className="flex items-center space-x-1 text-green-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Update Progress Button */}
        <button
          onClick={handleUpdateProgress}
          disabled={isUpdating}
          className="group relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
        >
          <div className="flex items-center justify-center space-x-2">
            {isUpdating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium">Updating...</span>
              </>
            ) : (
              <>
                <span className="text-lg">⚡</span>
                <span className="text-sm font-medium">Update Progress</span>
              </>
            )}
          </div>
          <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        </button>

        {/* Simulate Activity Button */}
        <button
          onClick={handleSimulateActivity}
          disabled={isSimulating}
          className="group relative bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
        >
          <div className="flex items-center justify-center space-x-2">
            {isSimulating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium">Simulating...</span>
              </>
            ) : (
              <>
                <span className="text-lg">🎯</span>
                <span className="text-sm font-medium">Simulate Activity</span>
              </>
            )}
          </div>
          <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        </button>
      </div>

      {/* Info Section */}
      <div className="mt-4 p-3 bg-black/20 rounded-lg border border-gray-700">
        <div className="text-xs text-gray-400 space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-blue-400">⚡</span>
            <span>Auto-updates incomplete habits and applies smart completion</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-purple-400">🎯</span>
            <span>Simulates realistic habit completion patterns for testing</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicTracker;