import React, { useState, useEffect } from 'react';
import { FaTasks, FaCheckCircle, FaClock } from 'react-icons/fa';

export default function TaskProgressWidget() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const loadTasks = () => {
      const savedTasks = localStorage.getItem('habitTracker_tasks');
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }
    };

    // Load tasks initially
    loadTasks();

    // Listen for storage changes (when tasks are updated in other components)
    const handleStorageChange = (e) => {
      if (e.key === 'habitTracker_tasks') {
        loadTasks();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events for same-tab updates
    const handleTaskUpdate = () => {
      loadTasks();
    };

    window.addEventListener('tasksUpdated', handleTaskUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tasksUpdated', handleTaskUpdate);
    };
  }, []);

  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const todayCompletedTasks = completedTasks.filter(task => 
    task.completedAt && new Date(task.completedAt).toDateString() === new Date().toDateString()
  );

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
      <div className="flex items-center gap-3 mb-4">
        <FaTasks className="text-blue-400 text-xl" />
        <h3 className="text-white font-semibold">Task Progress</h3>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{todayCompletedTasks.length}</div>
          <div className="text-slate-400 text-sm">Today</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{completionRate}%</div>
          <div className="text-slate-400 text-sm">Overall</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-slate-400 mb-1">
          <span>Progress</span>
          <span>{completedTasks.length}/{tasks.length}</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="space-y-2">
        <h4 className="text-slate-300 font-medium text-sm">Recent Tasks</h4>
        {tasks.length === 0 ? (
          <div className="text-slate-500 text-sm text-center py-2">
            No tasks yet. Go to Progress to add tasks!
          </div>
        ) : (
          tasks.slice(0, 3).map((task) => (
            <div key={task.id} className="flex items-center gap-2 text-sm">
              {task.completed ? (
                <FaCheckCircle className="text-green-400 text-xs" />
              ) : (
                <FaClock className="text-orange-400 text-xs" />
              )}
              <span className={`truncate ${task.completed ? 'text-green-300 line-through' : 'text-white'}`}>
                {task.title}
              </span>
            </div>
          ))
        )}
        {tasks.length > 3 && (
          <div className="text-slate-400 text-xs text-center">
            +{tasks.length - 3} more tasks
          </div>
        )}
      </div>

      {/* Quick Action */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="text-slate-400 text-xs text-center">
          Go to <span className="text-blue-400 font-medium">Progress</span> section to manage tasks
        </div>
      </div>
    </div>
  );
}
