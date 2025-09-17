// Authenticated Habits Management Component (moved from Home.jsx)
import React, { useState } from 'react';
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
  
  const blankForm = { title: '', description: '', reminderTime: '', frequencyType: 'daily', startDate: '', endDate: '', durationMinutes: '', targetCount: '', customConfig: '' };
  const [form, setForm] = useState(blankForm);
  
  const { habits, setHabits, updateHabitLocal, deleteHabitLocal, setSelectedHabit, habitLoading, progressSummary } = useHabitContext();
  const { ensureLoaded, toggleStatus, getStatus } = useCompletion();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
  const payload = { title:form.title.trim(), description:form.description.trim(), frequencyType:form.frequencyType, reminderTime:form.reminderTime||undefined, startDate:form.startDate||undefined, endDate:form.endDate||undefined, daysOfWeek: form.frequencyType==='weekly'? [1,2,3,4,5]: undefined, timesPerPeriod:1 };
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
  setForm({ title:habit.title||'', description:habit.description||'', reminderTime:habit.reminderTime||'', frequencyType:habit.frequencyType||'daily', startDate:habit.startDate?habit.startDate.substring(0,10):'', endDate:habit.endDate?habit.endDate.substring(0,10):'', durationMinutes:habit.durationMinutes||'', targetCount:habit.targetCount||'', customConfig: habit.customConfig? JSON.stringify(habit.customConfig,null,2):'' });
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
    if (override && iconMap[override]) return iconMap[override];
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
    // Simplified: number of completed dates in generated window / total dates
    const dates = generateTrackingDates(habit).filter(d => isDateInRange(d, habit.startDate, habit.endDate));
    let completed = 0;
    for (const d of dates) if (isCompleted(habit._id, d)) completed++;
    return { completed, total: dates.length, percent: dates.length ? (completed / dates.length) * 100 : 0 };
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">Manage Your Habits</h1>
            <p className="text-[var(--color-text-muted)]">Track your daily progress and build lasting habits</p>
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
          >
            ➕ Add New Habit
          </button>
        </div>
        
        <div className="space-y-5">
          {safeHabits.length===0 && <div className="text-center text-muted text-lg py-10">No habits yet. Add one.</div>}
          {safeHabits.map((habit, idx)=> {
            const habitKey = habit._id || habit.id || habit.tempId || `h-${idx}`;
            const trackingDates = generateTrackingDates(habit);
            const validDates = trackingDates.filter(date => isDateInRange(date, habit.startDate, habit.endDate));
            const { completed, total, percent } = computeProgress(habit);
            const today = new Date().toISOString().split('T')[0];
            const weekDates = (()=>{ // last 7 days including today
              const arr=[]; const base = new Date();
              for (let i=6;i>=0;i--){ const d=new Date(base); d.setDate(base.getDate()-i); arr.push(d.toISOString().split('T')[0]); }
              return arr;
            })();
            
            return (
              <div key={habitKey} className="relative rounded-2xl border border-slate-800/60 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 px-6 py-5 shadow-lg overflow-hidden group">
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_85%_15%,rgba(56,189,248,0.15),transparent_60%)]" />
                <div className="flex gap-4 items-start relative">
                  <div className="mt-1 shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/70">
                    {pickIcon(habit.title, habit.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-semibold text-white tracking-tight leading-snug">{habit.title}</h3>
                        {habit.description && <p className="text-sm text-slate-400 mt-0.5 line-clamp-2">{habit.description}</p>}
                        {habit.reminderTime && <div className="text-[11px] text-slate-500 mt-1">⏰ {habit.reminderTime}</div>}
                        {typeof habit.streak === 'number' && habit.streak > 0 && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                            🔥 {habit.streak}d
                          </div>
                        )}
                      </div>
                      <span className="px-2 py-1 rounded-full text-[10px] font-semibold tracking-wide bg-slate-800 text-slate-300 border border-slate-700 uppercase">{habit.frequencyType}</span>
                    </div>
                    {/* Progress */}
                    <div className="mt-4">
                      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden relative">
                        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.05)_75%,transparent_75%,transparent)] bg-[length:12px_12px] opacity-20" />
                        <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-fuchsia-500 transition-[width] duration-700 ease-out will-change-[width]" style={{width: `${percent.toFixed(0)}%`}} />
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-[11px] font-medium text-slate-400">
                        <span className="px-2 py-1 rounded-md bg-slate-800/70 border border-slate-700 text-slate-300">{completed}/{total}</span>
                        <div className="flex gap-1 rounded-xl overflow-hidden border border-slate-700 bg-slate-800">
                          {['daily','weekly','monthly'].map(ft => (
                            <button key={ft} type="button" onClick={()=>changeFrequency(habit, ft)} className={`px-2.5 py-1 text-[10px] font-semibold tracking-wide transition-colors ${habit.frequencyType===ft ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-blue-700/40'}`}>{ft[0].toUpperCase()+ft.slice(1)}</button>
                          ))}
                        </div>
                      </div>
                      {/* Mini Weekly Heatmap */}
                      <div className="mt-3 flex gap-1">
                        {weekDates.map(d => {
                          const done = isCompleted(habit._id, d);
                          return <div key={d} className={`w-5 h-3 rounded-sm ${done ? 'bg-blue-500' : 'bg-slate-700'} ${d===today ? 'ring-1 ring-blue-400 ring-offset-1 ring-offset-slate-900' : ''}`}></div>;
                        })}
                      </div>
                    </div>
                    {/* Quick today toggle */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {validDates.map(date => {
                        const done = isCompleted(habit._id, date);
                        const isToday = date === new Date().toISOString().split('T')[0];
                        if (!isToday) return null; // only show today bubble in new design
                        return (
                          <button key={`${habitKey}-${date}`} onClick={()=>toggleCompletion(habit, date)} className={`px-3 h-8 rounded-lg text-xs font-medium border transition-all ${done ? 'bg-green-500/90 border-green-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-blue-500 hover:text-white'}`}>{done ? 'Completed' : 'Mark Done'}</button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-2">
                    <button onClick={()=> startEdit(habit)} className="px-3 h-9 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-sm border border-slate-700">Edit</button>
                    <button onClick={()=> confirmDelete(habit)} className="px-3 h-9 rounded-lg bg-slate-800 text-slate-300 hover:text-red-200 hover:bg-red-600/60 text-sm border border-slate-700">Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
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