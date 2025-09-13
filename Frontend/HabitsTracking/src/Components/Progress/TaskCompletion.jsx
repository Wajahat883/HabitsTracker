import React, { useState, useEffect } from 'react';
import { FaTasks, FaCheckCircle, FaClock, FaCalendarAlt, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';

export default function TaskCompletion() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Load tasks from localStorage on component mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('habitTracker_tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      // Default tasks for demonstration
      const defaultTasks = [
        {
          id: Date.now() + 1,
          title: 'Complete Epic 3: Progress Visualization',
          completed: true,
          completedAt: new Date().toISOString(),
          createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          category: 'Development'
        },
        {
          id: Date.now() + 2,
          title: 'Implement Friends & Social Features',
          completed: true,
          completedAt: new Date().toISOString(),
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          category: 'Development'
        },
        {
          id: Date.now() + 3,
          title: 'Create User Discovery System',
          completed: true,
          completedAt: new Date().toISOString(),
          createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          category: 'Development'
        },
        {
          id: Date.now() + 4,
          title: 'Build Notification System',
          completed: true,
          completedAt: new Date().toISOString(),
          createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
          category: 'Development'
        },
        {
          id: Date.now() + 5,
          title: 'Test Complete Social Platform',
          completed: false,
          createdAt: new Date().toISOString(),
          category: 'Testing'
        }
      ];
      setTasks(defaultTasks);
      localStorage.setItem('habitTracker_tasks', JSON.stringify(defaultTasks));
    }
  }, []);

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem('habitTracker_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!newTask.trim()) return;

    const task = {
      id: Date.now(),
      title: newTask.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      category: 'Personal'
    };

    setTasks(prev => [task, ...prev]);
    setNewTask('');
    setShowAddForm(false);
  };

  const toggleTask = (taskId) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            completed: !task.completed,
            completedAt: !task.completed ? new Date().toISOString() : null
          }
        : task
    ));
  };

  const deleteTask = (taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const startEdit = (task) => {
    setEditingTask({ ...task });
  };

  const saveEdit = () => {
    if (!editingTask.title.trim()) return;

    setTasks(prev => prev.map(task => 
      task.id === editingTask.id 
        ? { ...task, title: editingTask.title.trim() }
        : task
    ));
    setEditingTask(null);
  };

  const cancelEdit = () => {
    setEditingTask(null);
  };

  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} mins ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return date.toLocaleDateString();
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Development': 'bg-blue-600',
      'Testing': 'bg-green-600',
      'Personal': 'bg-purple-600',
      'Work': 'bg-orange-600'
    };
    return colors[category] || 'bg-gray-600';
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FaTasks className="text-blue-400 text-xl" />
          <h3 className="text-white font-semibold text-lg">Task Completion Progress</h3>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <FaPlus className="text-sm" />
          Add Task
        </button>
      </div>

      {/* Progress Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-700 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-400">{completedTasks.length}</div>
          <div className="text-slate-300 text-sm">Completed</div>
        </div>
        <div className="bg-slate-700 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-400">{pendingTasks.length}</div>
          <div className="text-slate-300 text-sm">Pending</div>
        </div>
        <div className="bg-slate-700 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-400">{completionRate}%</div>
          <div className="text-slate-300 text-sm">Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>Overall Progress</span>
          <span>{completionRate}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-slate-700 rounded-lg">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Enter new task..."
              className="flex-1 p-2 bg-slate-600 text-white rounded border border-slate-500 focus:border-blue-500 focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
            />
            <button
              onClick={addTask}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <FaTasks className="text-slate-500 text-3xl mx-auto mb-2" />
            <p className="text-slate-400">No tasks yet. Add your first task!</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className={`p-4 rounded-lg border transition-all ${
              task.completed 
                ? 'bg-green-900/20 border-green-700/50' 
                : 'bg-slate-700 border-slate-600 hover:border-slate-500'
            }`}>
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    task.completed
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'border-slate-400 hover:border-blue-400'
                  }`}
                >
                  {task.completed && <FaCheckCircle className="text-xs" />}
                </button>

                {/* Task Content */}
                <div className="flex-1">
                  {editingTask?.id === task.id ? (
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={editingTask.title}
                        onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                        className="flex-1 p-2 bg-slate-600 text-white rounded border border-slate-500 focus:border-blue-500 focus:outline-none"
                        onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                      />
                      <button
                        onClick={saveEdit}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`font-medium ${
                        task.completed 
                          ? 'text-green-300 line-through' 
                          : 'text-white'
                      }`}>
                        {task.title}
                      </h4>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full text-white ${getCategoryColor(task.category)}`}>
                          {task.category}
                        </span>
                        <button
                          onClick={() => startEdit(task)}
                          className="text-slate-400 hover:text-blue-400 transition-colors"
                        >
                          <FaEdit className="text-sm" />
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Task Meta */}
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <FaCalendarAlt />
                      <span>Created {formatDate(task.createdAt)}</span>
                    </div>
                    {task.completed && task.completedAt && (
                      <div className="flex items-center gap-1 text-green-400">
                        <FaCheckCircle />
                        <span>Completed {formatDate(task.completedAt)}</span>
                      </div>
                    )}
                    {!task.completed && (
                      <div className="flex items-center gap-1 text-orange-400">
                        <FaClock />
                        <span>Pending</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Stats */}
      {tasks.length > 0 && (
        <div className="mt-6 p-4 bg-slate-700 rounded-lg">
          <h4 className="text-white font-medium mb-2">Quick Stats</h4>
          <div className="text-sm text-slate-300 space-y-1">
            <div>• Today's completed tasks: {completedTasks.filter(task => 
              task.completedAt && new Date(task.completedAt).toDateString() === new Date().toDateString()
            ).length}</div>
            <div>• Most recent completion: {
              completedTasks.length > 0 
                ? formatDate(completedTasks.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0].completedAt)
                : 'None'
            }</div>
            <div>• Completion rate: {completionRate}% ({completedTasks.length}/{tasks.length})</div>
          </div>
        </div>
      )}
    </div>
  );
}
