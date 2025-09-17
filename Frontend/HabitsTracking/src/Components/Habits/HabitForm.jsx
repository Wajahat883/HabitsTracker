import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaCheckCircle } from 'react-icons/fa';
// Success toasts suppressed per requirement (only errors shown)
import toastError from '../../utils/toastError';
import { createHabit, updateHabit } from '../../api/habits';
import { createGroupHabit } from '../../api/groups';
import { useHabitContext } from '../../context/useHabitContext';

const defaultForm = {
  title: '',
  description: '',
  frequencyType: 'daily',
  daysOfWeek: [],
  timesPerPeriod: 1,
  colorTag: '#3b82f6',
  groupId: '',
  durationMinutes: '',
  targetCount: '',
  customConfig: '',
  startDate: '',
  endDate: '',
  reminderTime: '',
  icon: ''
};

export default function HabitForm({ onCreated }) {
  const { groups, setHabits, setEditingHabit, setSelectedHabit, editingHabit } = useHabitContext();
  const [form, setForm] = useState(editingHabit ? { ...defaultForm, ...editingHabit } : defaultForm);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [success, setSuccess] = useState(false);

  const toggleDay = (d) => {
    setForm(f => ({ ...f, daysOfWeek: f.daysOfWeek.includes(d) ? f.daysOfWeek.filter(x => x !== d) : [...f.daysOfWeek, d] }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === 'timesPerPeriod' ? Number(value) : value }));
  };

  const handleNumber = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value ? Number(value) : '' }));
  };

  const parseCustomConfig = () => {
    if (!form.customConfig) return undefined;
    try { return JSON.parse(form.customConfig); } catch { return undefined; }
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setSuccess(false);
    try {
      // basic client validation for date ordering
      if (form.endDate && !form.startDate) throw new Error('Start Date required when End Date is set');
      if (form.startDate && form.endDate && form.endDate < form.startDate) throw new Error('End Date must be after Start Date');
      const payload = {
        ...form,
        durationMinutes: form.durationMinutes || undefined,
        targetCount: form.targetCount || undefined,
        customConfig: parseCustomConfig()
      };
      let createdOrUpdated;
      if (editingHabit) {
        createdOrUpdated = await updateHabit(editingHabit._id, payload);
        setHabits(prev => prev.map(ph => ph._id === createdOrUpdated._id ? createdOrUpdated : ph));
        setEditingHabit(null);
        setSelectedHabit(createdOrUpdated);
      } else {
        createdOrUpdated = form.groupId ? await createGroupHabit(form.groupId, payload) : await createHabit(payload);
        setHabits(prev => prev.some(h => h._id === createdOrUpdated._id) ? prev : [createdOrUpdated, ...prev]);
        setSelectedHabit(createdOrUpdated);
        if (onCreated) {
          try { onCreated(createdOrUpdated); } catch { /* no-op */ }
        }
        setForm(defaultForm);
      }
  setSuccess(true); // still show inline check icon, but no toast
    } catch (err) {
      toastError(err);
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="card max-w-lg mx-auto space-y-7 animate-fadein">
      <h3 className="text-2xl font-bold text-blue-400 mb-2 flex items-center gap-2">
        {editingHabit ? 'Edit Habit' : 'Create New Habit'}
        {success && <FaCheckCircle className="text-green-400 animate-pop" />}
      </h3>
      <div className="space-y-2">
        <label className="block text-base font-medium" htmlFor="habit-title">Title <span className="text-red-400">*</span></label>
        <input id="habit-title" name="title" value={form.title} onChange={handleChange} required minLength={3} maxLength={60}
          className="input w-full text-lg" placeholder="e.g. Drink Water" autoFocus />
      </div>
      <div className="space-y-2">
        <label className="block text-base font-medium" htmlFor="habit-desc">Description</label>
        <textarea id="habit-desc" name="description" value={form.description} onChange={handleChange} rows={2}
          className="textarea w-full text-base" placeholder="Optional details..." />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-base font-medium">Frequency</label>
          <select name="frequencyType" value={form.frequencyType} onChange={handleChange}
            className="select w-full text-base">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div>
          <label className="block text-base font-medium">Times / Period <span className="text-slate-400 text-xs">(optional)</span></label>
          <input type="number" name="timesPerPeriod" value={form.timesPerPeriod} onChange={handleChange} min={1}
            className="input w-full text-base" />
        </div>
      </div>
      {form.frequencyType === 'weekly' && (
        <div className="space-y-2">
          <label className="block text-base font-medium">Days of Week</label>
          <div className="flex gap-1 flex-wrap">
            {['S','M','T','W','T','F','S'].map((d,i) => (
              <button type="button" key={i} onClick={() => toggleDay(i)}
                className={`w-9 h-9 rounded-full text-base font-semibold transition-all duration-200 border-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${form.daysOfWeek.includes(i) ? 'bg-blue-500 text-white border-blue-400 shadow animate-pop' : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-blue-600 hover:text-white'}`}>{d}</button>
            ))}
          </div>
        </div>
      )}
      {/* Scheduling Window & Reminder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-base font-medium">Start Date <span className="text-slate-400 text-xs">(optional)</span></label>
          <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className="input w-full text-base" />
        </div>
        <div>
          <label className="block text-base font-medium">End Date <span className="text-slate-400 text-xs">(optional)</span></label>
          <input type="date" name="endDate" value={form.endDate} min={form.startDate || undefined} onChange={handleChange} className="input w-full text-base" />
        </div>
        <div>
          <label className="block text-base font-medium">Time <span className="text-slate-400 text-xs">(optional)</span></label>
          <input type="time" name="reminderTime" value={form.reminderTime} onChange={handleChange} className="input w-full text-base" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-base font-medium">Color</label>
          <input type="color" name="colorTag" value={form.colorTag} onChange={handleChange}
            className="h-10 w-16 p-1 bg-transparent rounded border-2 border-[var(--color-border)]" />
        </div>
        <div className="flex-1">
          <label className="block text-base font-medium">Icon <span className="text-slate-400 text-xs">(optional)</span></label>
          <select name="icon" value={form.icon} onChange={handleChange} className="select w-full text-base">
            <option value="">Auto</option>
            <option value="FaTint">Water</option>
            <option value="FaBook">Book</option>
            <option value="FaRunning">Run</option>
            <option value="FaBed">Sleep</option>
            <option value="FaBrain">Mind</option>
            <option value="FaDumbbell">Workout</option>
            <option value="FaAppleAlt">Food</option>
            <option value="FaLeaf">Leaf</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-base font-medium">Group <span className="text-slate-400 text-xs">(optional)</span></label>
          <select name="groupId" value={form.groupId} onChange={handleChange}
            className="select w-full text-base">
            <option value="">Individual Habit</option>
            {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
          </select>
        </div>
      </div>
      {/* Advanced Options Stepper */}
      <div className="mt-2">
        <button type="button" onClick={()=>setShowAdvanced(v=>!v)}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium focus:outline-none transition-all animate-fadein">
          {showAdvanced ? <FaChevronUp /> : <FaChevronDown />} Advanced Options
        </button>
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 animate-fadein">
            <div>
              <label className="block text-sm font-medium mb-1">Duration (mins)</label>
              <input type="number" name="durationMinutes" value={form.durationMinutes} onChange={handleNumber} min={1}
                className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Target Count</label>
              <input type="number" name="targetCount" value={form.targetCount} onChange={handleNumber} min={1}
                className="input w-full" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Custom Config (JSON)</label>
              <textarea name="customConfig" value={form.customConfig} onChange={handleChange} rows={2} placeholder='{"reminder":"evening"}'
                className="textarea w-full text-xs" />
              {form.customConfig && !parseCustomConfig() && <div className="text-xs text-red-400 mt-1">Invalid JSON</div>}
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 mt-4">
        {editingHabit && <button type="button" onClick={() => setEditingHabit(null)} className="btn bg-slate-600 hover:bg-slate-500 text-white">Cancel</button>}
        <button disabled={loading} className="btn btn-success flex items-center gap-2 animate-pop">
          {loading ? 'Saving...' : editingHabit ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
