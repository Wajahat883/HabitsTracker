// Authenticated Habits Management Component (moved from Home.jsx)
import React, { useState, useEffect } from 'react';
import { FaTint, FaBook, FaRunning, FaAppleAlt, FaBrain, FaBed, FaDumbbell, FaLeaf } from 'react-icons/fa';
import { useHabitContext } from '../context/useHabitContext';
import { useCompletion } from '../context/CompletionContext';
import { createHabit, updateHabit, deleteHabit } from '../api/habits';
import { showToast } from '../config/toast';
import LoadingSpinner from '../Components/Common/LoadingSpinner';
import toastError from '../utils/toastError';

// Utility functions for tracking periods
const generateTrackingDates = (habit) => {
  const today = new Date();
  const dates = [];
  
  if (habit.frequencyType === 'daily') {
    // Show last 7 days for daily habits
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
  } else if (habit.frequencyType === 'weekly') {
    // Show current week (7 days)
    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
    startOfWeek.setDate(diff);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
  } else if (habit.frequencyType === 'monthly') {
    // Show current month days
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      dates.push(date.toISOString().split('T')[0]);
    }
  }
  
  return dates;
};

const isDateInRange = (date, startDate, endDate) => {
  if (!startDate && !endDate) return true;
  const dateObj = new Date(date);
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  
  if (start && dateObj < start) return false;
  if (end && dateObj > end) return false;
  return true;
};

const HabitsManager = () => {
  const [showModal, setShowModal] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const blankForm = { title: '', description: '', reminderTime: '', frequencyType: 'daily', startDate: '', endDate: '', durationMinutes: '', targetCount: '', customConfig: '', icon: '', timesPerPeriod: 1 };
  const [form, setForm] = useState(blankForm);
  
  // Get current user data for personalized greeting
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('currentUser')) || { name: 'User' };
    } catch {
      return { name: 'User' };
    }
  });
  
  const { habits, setHabits, updateHabitLocal, deleteHabitLocal, setSelectedHabit, habitLoading, progressSummary } = useHabitContext();
  const { ensureLoaded, toggleStatus, getStatus } = useCompletion();

  // Listen for user profile updates
  useEffect(() => {
    const handleUserUpdate = (e) => {
      if (e.detail) {
        setCurrentUser(e.detail);
      }
    };
    window.addEventListener('userLoggedIn', handleUserUpdate);
    window.addEventListener('userProfileUpdated', handleUserUpdate);
    return () => {
      window.removeEventListener('userLoggedIn', handleUserUpdate);
      window.removeEventListener('userProfileUpdated', handleUserUpdate);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
  const payload = { 
    title:form.title.trim(), 
    description:form.description.trim(), 
    frequencyType:form.frequencyType, 
    reminderTime:form.reminderTime||undefined, 
    startDate:form.startDate||undefined, 
    endDate:form.endDate||undefined, 
    daysOfWeek: form.frequencyType==='weekly'? [1,2,3,4,5]: undefined, 
    timesPerPeriod: Number(form.timesPerPeriod)||1,
    icon: form.icon || undefined
  };
      if(editing){ 
        const updated = await updateHabit(editing._id, payload); 
        updateHabitLocal(updated); 
        setSelectedHabit(updated);
        showToast.success(`Updated habit "${payload.title}"`);
      }
      else { 
        const created = await createHabit(payload); 
        setHabits(p=>[created, ...p]);
        showToast.habitCreated(payload.title);
      }
      setForm(blankForm); setEditing(null); setShowModal(false); setAdvanced(false);
  } catch (error) { 
    toastError(error);
    console.error('Save habit error:', error);
  } finally { setSaving(false); }
  };

  const startEdit = (habit)=>{
    setEditing(habit);
  setForm({ title:habit.title||'', description:habit.description||'', reminderTime:habit.reminderTime||'', frequencyType:habit.frequencyType||'daily', startDate:habit.startDate?habit.startDate.substring(0,10):'', endDate:habit.endDate?habit.endDate.substring(0,10):'', durationMinutes:habit.durationMinutes||'', targetCount:habit.targetCount||'', customConfig: habit.customConfig? JSON.stringify(habit.customConfig,null,2):'', icon: habit.icon || '', timesPerPeriod: habit.timesPerPeriod || 1 });
    setShowModal(true);
  };

  const confirmDelete = async (habit)=>{ 
    try { 
      await deleteHabit(habit._id); 
      deleteHabitLocal(habit._id);
      showToast.habitDeleted(habit.title);
    } catch (error) { 
      toastError(error);
      console.error('Delete habit error:', error);
    } 
  };



  const changeFrequency = async (habit, newType) => {
    if (habit.frequencyType === newType) return;
    const optimistic = { ...habit, frequencyType: newType };
    if (newType === 'weekly' && (!optimistic.daysOfWeek || optimistic.daysOfWeek.length === 0)) {
      optimistic.daysOfWeek = [1,2,3,4,5];
    }
    updateHabitLocal(optimistic); // optimistic UI
    try {
      const payload = { frequencyType: newType };
      if (newType === 'weekly') payload.daysOfWeek = optimistic.daysOfWeek;
      const updated = await updateHabit(habit._id, payload);
      updateHabitLocal(updated);
      showToast.success(`Frequency set to ${newType}`);
    } catch (err){
      toastError(err);
      // revert
      updateHabitLocal(habit);
    }
  };

  const toggleCompletion = async (habit, date) => {
    try {
      await ensureLoaded(habit._id);
      const wasCompleted = getStatus(habit._id, date) === 'completed';
      await toggleStatus(habit._id, date);
      
      if (!wasCompleted) {
        showToast.habitCompleted(habit.title);
      }
    } catch (error) {
      console.error('Error toggling completion:', error);
      toastError(error);
    }
  };

  const isCompleted = (habitId, date) => {
    const status = getStatus(habitId, date);
    return status === 'completed';
  };

  if (habitLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading your habits..." />
      </div>
    );
  }

  const safeHabitsBase = Array.isArray(habits) ? habits : [];
  const safeHabits = safeHabitsBase.map(h => {
    const found = progressSummary?.habitStreaks?.find(x=> (x.habitId || x._id) === h._id);
    if (found) return { ...h, streak: found.streak };
    // Fallback: compute minimal streak by scanning last 30 days from today backwards using completion cache
    const today = new Date();
    let streak = 0;
    let missChain = 0;
    for (let i=0;i<30;i++) {
      const d = new Date(today); d.setDate(today.getDate()-i); const iso = d.toISOString().split('T')[0];
      const status = getStatus(h._id, iso);
      if (status === 'completed') { streak++; missChain = 0; }
      else { missChain++; if (missChain >= 2) { streak = 0; break; } }
    }
    return { ...h, streak };
  });

  const iconMap = { FaTint:<FaTint className="text-blue-400 text-2xl"/>, FaBook:<FaBook className="text-purple-400 text-2xl"/>, FaRunning:<FaRunning className="text-pink-400 text-2xl"/>, FaBed:<FaBed className="text-indigo-400 text-2xl"/>, FaBrain:<FaBrain className="text-cyan-400 text-2xl"/>, FaDumbbell:<FaDumbbell className="text-emerald-400 text-2xl"/>, FaAppleAlt:<FaAppleAlt className="text-red-400 text-2xl"/>, FaLeaf:<FaLeaf className="text-green-400 text-2xl"/> };
  const pickIcon = (title='', override) => {
    if (override) {
      if (iconMap[override]) return iconMap[override];
      // treat override as emoji if not a known key
      if (/\p{Emoji}/u.test(override) || override.length <= 4) {
        return <span className="text-2xl select-none" aria-hidden="true">{override}</span>;
      }
    }
    const t = title.toLowerCase();
    if (/water|drink/.test(t)) return <FaTint className="text-blue-400 text-2xl"/>;
    if (/read|book/.test(t)) return <FaBook className="text-purple-400 text-2xl"/>;
    if (/run|jog|walk/.test(t)) return <FaRunning className="text-pink-400 text-2xl"/>;
    if (/sleep|bed|rest/.test(t)) return <FaBed className="text-indigo-400 text-2xl"/>;
    if (/meditat|mind|focus|brain/.test(t)) return <FaBrain className="text-cyan-400 text-2xl"/>;
    if (/gym|lift|workout|exercise|dumbbell/.test(t)) return <FaDumbbell className="text-emerald-400 text-2xl"/>;
    if (/fruit|vegg|diet|eat|food/.test(t)) return <FaAppleAlt className="text-red-400 text-2xl"/>;
    if (/plant|garden|nature/.test(t)) return <FaLeaf className="text-green-400 text-2xl"/>;
    return <FaLeaf className="text-slate-400 text-2xl"/>;
  };

  const computeProgress = (habit) => {
    const dates = generateTrackingDates(habit).filter(d => isDateInRange(d, habit.startDate, habit.endDate));
    const target = Number(habit.timesPerPeriod) || dates.length || 1;
    // Determine period scope based on frequencyType
    let completedUnits = 0;
    if (habit.frequencyType === 'daily') {
      const today = new Date().toISOString().split('T')[0];
      completedUnits = isCompleted(habit._id, today) ? 1 : 0;
    } else {
      for (const d of dates) if (isCompleted(habit._id, d)) completedUnits++;
    }
    const percent = Math.min(100, target ? (completedUnits / target) * 100 : 0);
    return { completed: completedUnits, target, rawTotal: dates.length, percent };
  };

  const formatHumanDate = (iso) => {
    try { const dt = new Date(iso + 'T00:00:00'); return dt.toLocaleDateString(undefined, { month:'long', day:'numeric' }); } catch { return iso; }
  };

  // Helper function to get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Calculate progress metrics
  const totalHabits = safeHabits.length;
  const todayCompletionCount = safeHabits.filter(habit => {
    const today = new Date().toISOString().split('T')[0];
    return isCompleted(habit._id, today);
  }).length;
  const completionRate = totalHabits > 0 ? Math.round((todayCompletionCount / totalHabits) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Personal Greeting Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                {getGreeting()}, {currentUser.name || 'User'}! 👋
              </h1>
              <p className="text-gray-600">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <button 
              onClick={() => setShowModal(true)} 
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            >
              ➕ Add New Habit
            </button>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed Today</p>
                <p className="text-3xl font-bold text-green-500">{todayCompletionCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xl">✓</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Habits</p>
                <p className="text-3xl font-bold text-gray-800">{totalHabits}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xl">📋</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
                <p className="text-3xl font-bold text-orange-500">{completionRate}%</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 text-xl">📊</span>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Progress Bar */}
        <div className="mb-8 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium text-gray-800">Today's Progress</h2>
            <span className="text-sm text-gray-600">{todayCompletionCount} of {totalHabits} habits</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all duration-300" 
              style={{ width: totalHabits > 0 ? `${completionRate}%` : '0%' }}
            ></div>
          </div>
        </div>
        
        {/* Today's Habits Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Today's Habits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeHabits.length === 0 && (
              <div className="col-span-full text-center text-gray-500 text-lg py-10">
                No habits yet. Add your first habit to get started!
              </div>
            )}
            {safeHabits.map((habit, idx) => {
              const habitKey = habit._id || habit.id || habit.tempId || `h-${idx}`;
              const trackingDates = generateTrackingDates(habit);
              const validDates = trackingDates.filter(date => isDateInRange(date, habit.startDate, habit.endDate));
              const { completed, target, percent } = computeProgress(habit);
              const today = new Date().toISOString().split('T')[0];
              const isCompletedToday = isCompleted(habit._id, today);
              
              return (
                <div key={habitKey} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        {pickIcon(habit.title, habit.icon)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{habit.title}</h3>
                        <p className="text-sm text-gray-500">{habit.frequencyType}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => startEdit(habit)} 
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => confirmDelete(habit)} 
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  {habit.description && (
                    <p className="text-sm text-gray-600 mb-4">{habit.description}</p>
                  )}
                  
                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>{completed}/{target}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Action button */}
                  <button
                    onClick={() => toggleCompletion(habit, today)}
                    className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors ${
                      isCompletedToday
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isCompletedToday ? '✓ Completed' : 'Mark Complete'}
                  </button>
                  
                  {habit.reminderTime && (
                    <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                      ⏰ {habit.reminderTime}
                    </div>
                  )}
                  
                  {typeof habit.streak === 'number' && habit.streak > 0 && (
                    <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                      🔥 {habit.streak} day streak
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
                {editing ? 'Edit Habit' : 'Create New Habit'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Habit Name *
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm(p=>({...p, title: e.target.value}))}
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                    placeholder="e.g., Exercise, Read, Meditate"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm(p=>({...p, description: e.target.value}))}
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                    placeholder="Optional description..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Frequency
                    </label>
                    <select
                      value={form.frequencyType}
                      onChange={(e) => setForm(p=>({...p, frequencyType: e.target.value}))}
                      className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      value={form.reminderTime}
                      onChange={(e) => setForm(p=>({...p, reminderTime: e.target.value}))}
                      className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Target (times per period)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={form.timesPerPeriod}
                      onChange={(e)=> setForm(p=>({...p, timesPerPeriod: e.target.value}))}
                      className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                      placeholder="e.g. 4"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Custom Emoji Icon
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={form.icon}
                      onChange={(e)=> setForm(p=>({...p, icon: e.target.value}))}
                      className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                      placeholder="e.g. 💧"
                      aria-label="Custom emoji icon"
                    />
                  </div>
                </div>

                {/* Advanced Options Toggle */}
                <div className="border-t pt-4">
                  <button
                    type="button"
                    onClick={() => setAdvanced(!advanced)}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  >
                    {advanced ? '▼' : '▶'} Advanced Options
                  </button>
                </div>

                {advanced && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={form.startDate}
                          onChange={(e) => setForm(p=>({...p, startDate: e.target.value}))}
                          className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={form.endDate}
                          onChange={(e) => setForm(p=>({...p, endDate: e.target.value}))}
                          className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !form.title.trim()}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitsManager;