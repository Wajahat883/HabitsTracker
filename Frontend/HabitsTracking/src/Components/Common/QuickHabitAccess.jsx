import React, { useState, useEffect } from 'react';
import { FaFolder, FaCheckCircle, FaClock, FaChevronRight, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';

export default function QuickHabitAccess() {
  const [folders, setFolders] = useState([]);
  const [recentHabits, setRecentHabits] = useState([]);
  const [editingFolder, setEditingFolder] = useState(null);
  const [tempFolderName, setTempFolderName] = useState('');

  useEffect(() => {
  const loadFolders = () => {
      const savedFolders = localStorage.getItem('habitTracker_folders');
      if (savedFolders) {
        const foldersData = JSON.parse(savedFolders);
        setFolders(foldersData);
        
        // Get recent habits (last 5 habits from all folders)
        const allHabits = [];
        foldersData.forEach(folder => {
          folder.habits.forEach(habit => {
            allHabits.push({
              ...habit,
              folderName: folder.name,
              folderId: folder.id
            });
          });
        });
        
        // Sort by creation date and take last 5
        const recent = allHabits
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        
        setRecentHabits(recent);
      }
    };

    // Load initially
    loadFolders();

    // Listen for folder updates
    const handleFolderUpdate = () => {
      loadFolders();
    };

  window.addEventListener('foldersUpdated', handleFolderUpdate);

    return () => {
      window.removeEventListener('foldersUpdated', handleFolderUpdate);
    };
  }, []);

  const toggleHabit = (folderId, habitId) => {
    const updatedFolders = folders.map(folder => 
      folder.id === folderId 
        ? {
            ...folder,
            habits: folder.habits.map(habit => 
              habit.id === habitId 
                ? { 
                    ...habit, 
                    completed: !habit.completed,
                    completedAt: !habit.completed ? new Date().toISOString() : null
                  }
                : habit
            )
          }
        : folder
    );

    setFolders(updatedFolders);
    localStorage.setItem('habitTracker_folders', JSON.stringify(updatedFolders));
    window.dispatchEvent(new CustomEvent('foldersUpdated'));
  };

  const getTotalHabits = () => {
    return folders.reduce((total, folder) => total + folder.habits.length, 0);
  };

  const getCompletedHabits = () => {
    return folders.reduce((total, folder) => 
      total + folder.habits.filter(habit => habit.completed).length, 0
    );
  };

  const getTodayCompletedHabits = () => {
    return folders.reduce((total, folder) => {
      const todayCompleted = folder.habits.filter(habit => 
        habit.completed && habit.completedAt && 
        new Date(habit.completedAt).toDateString() === new Date().toDateString()
      );
      return total + todayCompleted.length;
    }, 0);
  };

  const startEditingFolder = (folder) => {
    setEditingFolder(folder);
    setTempFolderName(folder.name);
  };

  const saveFolderEdit = () => {
    if (!tempFolderName.trim()) return;
    const updated = folders.map(f => f.id === editingFolder.id ? { ...f, name: tempFolderName.trim() } : f);
    setFolders(updated);
    localStorage.setItem('habitTracker_folders', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('foldersUpdated'));
    setEditingFolder(null);
  };

  const cancelFolderEdit = () => {
    setEditingFolder(null);
  };

  const deleteFolder = (folderId) => {
    if (!window.confirm('Delete this folder and all its habits?')) return;
    const updated = folders.filter(f => f.id !== folderId);
    setFolders(updated);
    localStorage.setItem('habitTracker_folders', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('foldersUpdated'));
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FaFolder className="text-yellow-400 text-xl" />
          <h3 className="text-white font-semibold">Quick Habit Access</h3>
        </div>
        <div className="text-slate-400 text-sm">
          {folders.length} folders
        </div>
      </div>

      {/* Folder List with Hover Actions */}
      <div className="space-y-2 mb-6">
        {folders.length === 0 ? (
          <div className="text-slate-500 text-xs italic">No folders yet</div>
        ) : (
          folders.map(folder => (
            <div key={folder.id} className="group relative bg-slate-700/60 hover:bg-slate-700 rounded px-3 py-2 flex items-center gap-3 transition-colors">
              <FaFolder className="text-yellow-400 text-sm" />
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">{folder.name}</div>
                <div className="text-[10px] text-slate-400 tracking-wide">{folder.habits.length} habits</div>
              </div>
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEditingFolder(folder)}
                  className="p-1 rounded bg-slate-600/70 hover:bg-blue-600 text-slate-300 hover:text-white shadow-sm"
                  title="Edit Folder"
                >
                  <FaEdit className="text-[10px]" />
                </button>
                <button
                  onClick={() => deleteFolder(folder.id)}
                  className="p-1 rounded bg-slate-600/70 hover:bg-red-600 text-slate-300 hover:text-white shadow-sm"
                  title="Delete Folder"
                >
                  <FaTrash className="text-[10px]" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-700 p-3 rounded text-center">
          <div className="text-lg font-bold text-blue-400">{getTodayCompletedHabits()}</div>
          <div className="text-slate-400 text-xs">Today</div>
        </div>
        <div className="bg-slate-700 p-3 rounded text-center">
          <div className="text-lg font-bold text-green-400">{getCompletedHabits()}</div>
          <div className="text-slate-400 text-xs">Total Done</div>
        </div>
        <div className="bg-slate-700 p-3 rounded text-center">
          <div className="text-lg font-bold text-purple-400">{getTotalHabits()}</div>
          <div className="text-slate-400 text-xs">All Habits</div>
        </div>
      </div>

      {/* Recent Habits */}
      <div className="space-y-3">
        <h4 className="text-slate-300 font-medium text-sm flex items-center gap-2">
          <FaClock className="text-xs" />
          Recent Habits
        </h4>
        
        {recentHabits.length === 0 ? (
          <div className="text-slate-500 text-sm text-center py-4">
            <FaFolder className="text-2xl mx-auto mb-2 opacity-50" />
            <p>No habits yet</p>
            <p className="text-xs">Click the folder icon to create habits!</p>
          </div>
        ) : (
          recentHabits.map((habit) => (
            <div key={`${habit.folderId}-${habit.id}`} className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
              <button
                onClick={() => toggleHabit(habit.folderId, habit.id)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  habit.completed
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'border-slate-400 hover:border-blue-400'
                }`}
              >
                {habit.completed && <FaCheckCircle className="text-xs" />}
              </button>
              
              <div className="flex-1">
                <div className={`text-sm font-medium ${
                  habit.completed ? 'text-green-300 line-through' : 'text-white'
                }`}>
                  {habit.name}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{habit.folderName}</span>
                  <span>•</span>
                  {habit.completed && habit.completedAt ? (
                    <span className="text-green-400">
                      Completed {formatTime(habit.completedAt)}
                    </span>
                  ) : (
                    <span className="text-orange-400">Pending</span>
                  )}
                </div>
              </div>
              
              <div className="text-slate-500">
                <FaChevronRight className="text-xs" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="text-slate-400 text-xs text-center">
          <p>💡 <strong>Tip:</strong> Use the folder icon in navbar to manage all habits</p>
          <p className="mt-1">Create folders → Add habits → Track progress!</p>
        </div>
      </div>

      {/* Edit Folder Modal */}
      {editingFolder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={(e)=> { if (e.target === e.currentTarget) cancelFolderEdit(); }}>
          <div className="bg-slate-800 w-full max-w-sm rounded-lg border border-slate-700 p-5 shadow-xl relative animate-[fadeIn_.25s_ease]">
            <button
              className="absolute top-2 right-2 text-slate-400 hover:text-white"
              onClick={cancelFolderEdit}
              aria-label="Close edit folder modal"
            >
              <FaTimes className="text-sm" />
            </button>
            <h3 className="text-white font-semibold text-sm mb-3">Edit Folder</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wide text-slate-400 mb-1">Folder Name</label>
                <input
                  autoFocus
                  type="text"
                  value={tempFolderName}
                  onChange={(e) => setTempFolderName(e.target.value)}
                  onKeyDown={(e)=> e.key==='Enter' && saveFolderEdit()}
                  className="w-full p-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none text-sm"
                  placeholder="Enter folder name"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveFolderEdit}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                >Save</button>
                <button
                  onClick={cancelFolderEdit}
                  className="flex-1 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded text-xs"
                >Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
