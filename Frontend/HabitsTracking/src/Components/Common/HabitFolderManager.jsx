import React, { useState, useEffect } from 'react';
import { 
  FaFolder, 
  FaFolderOpen, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaCheckCircle,
  FaChevronRight,
  FaChevronDown,
  FaSave,
  FaTimes,
  FaCog,
  FaUsers
} from 'react-icons/fa';
import HabitForm from '../Habits/HabitForm';
import GroupForm from '../Groups/GroupForm';
import HabitList from '../Habits/HabitList';
import HabitTracker from '../Habits/HabitTracker';

export default function HabitFolderManager() {
  const [folders, setFolders] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [editingFolder, setEditingFolder] = useState(null);
  const [editingHabit, setEditingHabit] = useState(null);
  const [newHabitName, setNewHabitName] = useState('');
  const [addingHabitToFolder, setAddingHabitToFolder] = useState(null);
  const [showManagementTools, setShowManagementTools] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);

  // Load folders from localStorage on component mount
  useEffect(() => {
    const savedFolders = localStorage.getItem('habitTracker_folders');
    if (savedFolders) {
      setFolders(JSON.parse(savedFolders));
    } else {
      // Default folders for demonstration
      const defaultFolders = [
        {
          id: Date.now() + 1,
          name: 'Health & Fitness',
          createdAt: new Date().toISOString(),
          habits: [
            {
              id: Date.now() + 10,
              name: 'Morning Exercise',
              completed: true,
              completedAt: new Date().toISOString(),
              createdAt: new Date(Date.now() - 86400000).toISOString()
            },
            {
              id: Date.now() + 11,
              name: 'Drink 8 Glasses Water',
              completed: false,
              createdAt: new Date(Date.now() - 43200000).toISOString()
            }
          ]
        },
        {
          id: Date.now() + 2,
          name: 'Personal Development',
          createdAt: new Date().toISOString(),
          habits: [
            {
              id: Date.now() + 12,
              name: 'Read 30 Minutes',
              completed: true,
              completedAt: new Date().toISOString(),
              createdAt: new Date(Date.now() - 21600000).toISOString()
            }
          ]
        },
        {
          id: Date.now() + 3,
          name: 'Work & Productivity',
          createdAt: new Date().toISOString(),
          habits: []
        }
      ];
      setFolders(defaultFolders);
      localStorage.setItem('habitTracker_folders', JSON.stringify(defaultFolders));
    }
  }, []);

  // Save folders to localStorage whenever folders change
  useEffect(() => {
    console.log('Saving folders to localStorage:', folders);
    localStorage.setItem('habitTracker_folders', JSON.stringify(folders));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('foldersUpdated'));
    console.log('Dispatched foldersUpdated event');
  }, [folders]);

  const createFolder = () => {
    if (!newFolderName.trim()) return;

    const folder = {
      id: Date.now(),
      name: newFolderName.trim(),
      createdAt: new Date().toISOString(),
      habits: []
    };

    setFolders(prev => [...prev, folder]);
    setNewFolderName('');
    setShowAddFolder(false);
    
    // Auto-expand the new folder and show management tools
    setExpandedFolders(prev => new Set([...prev, folder.id]));
    setSelectedFolder(folder);
    setShowManagementTools(true);
  };

  const deleteFolder = (folderId) => {
    if (window.confirm('Are you sure you want to delete this folder and all its habits?')) {
      setFolders(prev => prev.filter(folder => folder.id !== folderId));
    }
  };

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(folderId)) {
        newExpanded.delete(folderId);
        // Hide management tools when folder is collapsed
        if (selectedFolder?.id === folderId) {
          setShowManagementTools(false);
          setSelectedFolder(null);
        }
      } else {
        newExpanded.add(folderId);
        // Show management tools when folder is expanded
        const folder = folders.find(f => f.id === folderId);
        setSelectedFolder(folder);
        setShowManagementTools(true);
      }
      return newExpanded;
    });
  };

  const startEditingFolder = (folder) => {
    setEditingFolder({ ...folder });
  };

  const saveEditFolder = () => {
    if (!editingFolder.name.trim()) return;

    setFolders(prev => prev.map(folder => 
      folder.id === editingFolder.id 
        ? { ...folder, name: editingFolder.name.trim() }
        : folder
    ));
    setEditingFolder(null);
  };

  const cancelEditFolder = () => {
    setEditingFolder(null);
  };

  const addHabitToFolder = (folderId) => {
    if (!newHabitName.trim()) return;

    const habit = {
      id: Date.now(),
      name: newHabitName.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };

    setFolders(prev => prev.map(folder => 
      folder.id === folderId 
        ? { ...folder, habits: [...folder.habits, habit] }
        : folder
    ));

    setNewHabitName('');
    setAddingHabitToFolder(null);
  };

  const toggleHabit = (folderId, habitId) => {
    setFolders(prev => prev.map(folder => 
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
    ));
  };

  const deleteHabit = (folderId, habitId) => {
    if (window.confirm('Are you sure you want to delete this habit?')) {
      setFolders(prev => prev.map(folder => 
        folder.id === folderId 
          ? { ...folder, habits: folder.habits.filter(habit => habit.id !== habitId) }
          : folder
      ));
    }
  };

  const startEditingHabit = (folderId, habit) => {
    setEditingHabit({ ...habit, folderId });
  };

  const saveEditHabit = () => {
    if (!editingHabit.name.trim()) return;

    setFolders(prev => prev.map(folder => 
      folder.id === editingHabit.folderId 
        ? {
            ...folder,
            habits: folder.habits.map(habit => 
              habit.id === editingHabit.id 
                ? { ...habit, name: editingHabit.name.trim() }
                : habit
            )
          }
        : folder
    ));
    setEditingHabit(null);
  };

  const cancelEditHabit = () => {
    setEditingHabit(null);
  };

  const getTotalHabits = () => {
    return folders.reduce((total, folder) => total + folder.habits.length, 0);
  };

  const getCompletedHabits = () => {
    return folders.reduce((total, folder) => 
      total + folder.habits.filter(habit => habit.completed).length, 0
    );
  };



  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-base">Habit Folders</h3>
          <button
            onClick={() => setShowAddFolder(!showAddFolder)}
            className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            title="Create New Folder"
          >
            <FaPlus className="text-xs" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-800 p-2 rounded text-center">
            <div className="text-blue-400 font-bold text-sm">{folders.length}</div>
            <div className="text-slate-400">Folders</div>
          </div>
          <div className="bg-slate-800 p-2 rounded text-center">
            <div className="text-green-400 font-bold text-sm">{getCompletedHabits()}/{getTotalHabits()}</div>
            <div className="text-slate-400">Done</div>
          </div>
        </div>
      </div>

      {/* Add Folder Form */}
      {showAddFolder && (
        <div className="mb-4 p-3 bg-slate-800 rounded">
          <div className="space-y-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name..."
              className="w-full p-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none text-xs"
              onKeyPress={(e) => e.key === 'Enter' && createFolder()}
            />
            <div className="flex gap-1">
              <button
                onClick={createFolder}
                className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => setShowAddFolder(false)}
                className="flex-1 px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folders List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {folders.length === 0 ? (
          <div className="text-center py-4">
            <FaFolder className="text-slate-500 text-2xl mx-auto mb-2" />
            <p className="text-slate-400 text-xs">No folders yet</p>
            <p className="text-slate-500 text-xs">Click + to create</p>
          </div>
        ) : (
          folders.map((folder) => (
            <div key={folder.id} className="bg-slate-800 rounded border border-slate-700 group relative overflow-hidden">
              {/* Folder Header */}
              <div className="p-2 flex items-center gap-2 relative">
                <button
                  onClick={() => toggleFolder(folder.id)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {expandedFolders.has(folder.id) ? 
                    <FaChevronDown className="text-xs" /> : 
                    <FaChevronRight className="text-xs" />
                  }
                </button>
                {expandedFolders.has(folder.id) ? 
                  <FaFolderOpen className="text-yellow-400" /> : 
                  <FaFolder className="text-yellow-400" />
                }
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium text-xs truncate">{folder.name}</div>
                  <div className="text-slate-400 text-[10px] tracking-wide">{folder.habits.length} habits</div>
                </div>
                {/* Hover Action Buttons (Edit / Delete) */}
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEditingFolder(folder)}
                    className="p-1 rounded bg-slate-700/70 hover:bg-blue-600 text-slate-300 hover:text-white shadow-sm"
                    title="Edit Folder"
                  >
                    <FaEdit className="text-[10px]" />
                  </button>
                  <button
                    onClick={() => deleteFolder(folder.id)}
                    className="p-1 rounded bg-slate-700/70 hover:bg-red-600 text-slate-300 hover:text-white shadow-sm"
                    title="Delete Folder"
                  >
                    <FaTrash className="text-[10px]" />
                  </button>
                </div>
              </div>

              {/* Add Habit Form */}
              {addingHabitToFolder === folder.id && (
                <div className="px-3 pb-3">
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      placeholder="Enter habit name..."
                      className="w-full p-2 bg-slate-600 text-white rounded border border-slate-500 focus:border-blue-500 focus:outline-none text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && addHabitToFolder(folder.id)}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => addHabitToFolder(folder.id)}
                        className="flex-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors"
                      >
                        Add Habit
                      </button>
                      <button
                        onClick={() => setAddingHabitToFolder(null)}
                        className="flex-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Habits List */}
              {expandedFolders.has(folder.id) && (
                <div className="px-2 pb-2 space-y-1">
                  {/* Add Habit trigger inside expanded content */}
                  {addingHabitToFolder !== folder.id && (
                    <div className="flex justify-end mb-1">
                      <button
                        onClick={() => setAddingHabitToFolder(folder.id)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] uppercase tracking-wide"
                      >Add Habit</button>
                    </div>
                  )}
                  {folder.habits.length === 0 ? (
                    <div className="text-slate-500 text-xs text-center py-2">
                      No habits in this folder yet
                    </div>
                  ) : (
                    folder.habits.map((habit) => (
                      <div key={habit.id} className="flex items-center gap-2 p-1.5 bg-slate-700 rounded text-xs">
                        <button
                          onClick={() => toggleHabit(folder.id, habit.id)}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                            habit.completed
                              ? 'bg-green-600 border-green-600 text-white'
                              : 'border-slate-400 hover:border-blue-400'
                          }`}
                        >
                          {habit.completed && <FaCheckCircle className="text-xs" />}
                        </button>

                        {editingHabit?.id === habit.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={editingHabit.name}
                              onChange={(e) => setEditingHabit({...editingHabit, name: e.target.value})}
                              className="flex-1 p-1 bg-slate-700 text-white rounded border border-slate-500 focus:border-blue-500 focus:outline-none text-xs"
                              onKeyPress={(e) => e.key === 'Enter' && saveEditHabit()}
                            />
                            <button
                              onClick={saveEditHabit}
                              className="text-green-400 hover:text-green-300 transition-colors"
                            >
                              <FaSave className="text-xs" />
                            </button>
                            <button
                              onClick={cancelEditHabit}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <FaTimes className="text-xs" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1">
                              <div className={`text-xs ${habit.completed ? 'text-green-300 line-through' : 'text-white'}`}>
                                {habit.name}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEditingHabit(folder.id, habit)}
                                className="text-slate-400 hover:text-blue-400 transition-colors"
                                title="Edit Habit"
                              >
                                <FaEdit className="text-xs" />
                              </button>
                              <button
                                onClick={() => deleteHabit(folder.id, habit.id)}
                                className="text-slate-400 hover:text-red-400 transition-colors"
                                title="Delete Habit"
                              >
                                <FaTrash className="text-xs" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Habit Management Tools - Show when folder is selected */}
      {showManagementTools && selectedFolder && (
        <div className="mt-4 p-3 bg-slate-800 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-600">
            <FaCog className="text-blue-400" />
            <h3 className="text-white font-semibold text-sm">
              Manage "{selectedFolder.name}" Habits
            </h3>
            <button
              onClick={() => {
                setShowManagementTools(false);
                setSelectedFolder(null);
              }}
              className="ml-auto text-slate-400 hover:text-white transition-colors"
            >
              <FaTimes className="text-xs" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Habit Creation Form */}
            <div className="bg-slate-700 p-3 rounded">
              <h4 className="text-white text-xs font-medium mb-2 flex items-center gap-2">
                <FaPlus className="text-green-400" />
                Create New Habit
              </h4>
              <HabitForm />
            </div>

            {/* Group Creation Form */}
            <div className="bg-slate-700 p-3 rounded">
              <h4 className="text-white text-xs font-medium mb-2 flex items-center gap-2">
                <FaUsers className="text-blue-400" />
                Create Habit Group
              </h4>
              <GroupForm />
            </div>

            {/* All Habits List */}
            <div className="bg-slate-700 p-3 rounded">
              <h4 className="text-white text-xs font-medium mb-2">Your All Habits</h4>
              <HabitList />
            </div>

            {/* Habit Tracker */}
            <div className="bg-slate-700 p-3 rounded">
              <h4 className="text-white text-xs font-medium mb-2">Habit Tracker</h4>
              <HabitTracker />
            </div>
          </div>
        </div>
      )}
      {/* Edit Folder Modal */}
      {editingFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onKeyDown={(e)=> e.key==='Escape' && cancelEditFolder()}>
          <div className="bg-slate-800 w-full max-w-sm rounded-lg border border-slate-700 p-5 shadow-xl relative">
            <button
              className="absolute top-2 right-2 text-slate-400 hover:text-white"
              onClick={cancelEditFolder}
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
                  value={editingFolder.name}
                  onChange={(e) => setEditingFolder({...editingFolder, name: e.target.value})}
                  onKeyPress={(e)=> e.key==='Enter' && saveEditFolder()}
                  className="w-full p-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none text-sm"
                  placeholder="Enter folder name"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveEditFolder}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                >Save</button>
                <button
                  onClick={cancelEditFolder}
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
