import React, { useState } from 'react';
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
  groupId: ''
};

export default function HabitForm({ onCreated }) {
  const { groups, setHabits, setEditingHabit, setSelectedHabit, editingHabit } = useHabitContext();
  const [form, setForm] = useState(editingHabit ? { ...defaultForm, ...editingHabit } : defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleDay = (d) => {
    setForm(f => ({ ...f, daysOfWeek: f.daysOfWeek.includes(d) ? f.daysOfWeek.filter(x => x !== d) : [...f.daysOfWeek, d] }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === 'timesPerPeriod' ? Number(value) : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (editingHabit) {
        const updated = await updateHabit(editingHabit._id, form);
        setHabits(prev => prev.map(ph => ph._id === updated._id ? updated : ph));
        setEditingHabit(null);
        setSelectedHabit(updated);
      } else {
        const created = form.groupId ? await createGroupHabit(form.groupId, form) : await createHabit(form);
        setHabits(prev => [created, ...prev]);
        setSelectedHabit(created);
        if (onCreated) {
          try { onCreated(created); } catch { /* no-op */ }
        }
        setForm(defaultForm);
      }
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4 bg-slate-800 p-4 rounded-lg border border-slate-700">
      <h3 className="text-lg font-semibold text-blue-300">{editingHabit ? 'Edit Habit' : 'New Habit'}</h3>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <div>
        <label className="block text-sm text-slate-300 mb-1">Title</label>
        <input name="title" value={form.title} onChange={handleChange} required minLength={3} className="w-full bg-slate-700 text-white rounded p-2" />
      </div>
      <div>
        <label className="block text-sm text-slate-300 mb-1">Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} rows={2} className="w-full bg-slate-700 text-white rounded p-2" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Frequency</label>
          <select name="frequencyType" value={form.frequencyType} onChange={handleChange} className="w-full bg-slate-700 text-white rounded p-2">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Times / Period (optional)</label>
          <input type="number" name="timesPerPeriod" value={form.timesPerPeriod} onChange={handleChange} min={1} className="w-full bg-slate-700 text-white rounded p-2" />
        </div>
      </div>
      {form.frequencyType === 'weekly' && (
        <div>
          <label className="block text-sm text-slate-300 mb-1">Days of Week</label>
          <div className="flex gap-1 flex-wrap">
            {['S','M','T','W','T','F','S'].map((d,i) => (
              <button type="button" key={i} onClick={() => toggleDay(i)} className={`w-8 h-8 rounded-full text-sm font-medium ${form.daysOfWeek.includes(i) ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>{d}</button>
            ))}
          </div>
        </div>
      )}
      <div>
        <label className="block text-sm text-slate-300 mb-1">Color</label>
        <input type="color" name="colorTag" value={form.colorTag} onChange={handleChange} className="h-10 w-16 p-1 bg-slate-700 rounded" />
      </div>
      <div>
        <label className="block text-sm text-slate-300 mb-1">Group (optional)</label>
        <select name="groupId" value={form.groupId} onChange={handleChange} className="w-full bg-slate-700 text-white rounded p-2">
          <option value="">Individual Habit</option>
          {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
        </select>
      </div>
      <div className="flex justify-end gap-2">
        {editingHabit && <button type="button" onClick={() => setEditingHabit(null)} className="px-3 py-2 text-sm bg-slate-600 rounded text-white">Cancel</button>}
        <button disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded">{loading ? 'Saving...' : editingHabit ? 'Update' : 'Create'}</button>
      </div>
    </form>
  );
}
