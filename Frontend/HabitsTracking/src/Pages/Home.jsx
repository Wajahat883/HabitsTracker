import React, { useMemo, useState } from 'react';
import { useHabitContext } from '../context/useHabitContext';
import { createHabit, updateHabit, deleteHabit } from '../api/habits';
import { useCompletion } from '../context/CompletionContext';

function startOfWeek(date){ const d=new Date(date); const day=d.getDay(); const diff=(day===0?-6:1-day); d.setDate(d.getDate()+diff); d.setHours(0,0,0,0); return d; }
function iso(d){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export default function Home(){
  const { habits, setHabits, updateHabitLocal, deleteHabitLocal, setSelectedHabit } = useHabitContext();
  const { getStatus, toggleStatus, getStreakTolerance, getStreak } = useCompletion();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [advanced, setAdvanced] = useState(false);
  const blankForm = { title:'', frequencyType:'daily', durationMinutes:'', targetCount:'', customConfig:'' };
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const weekStart = startOfWeek(new Date());
  const days = useMemo(()=> Array.from({length:7},(_,i)=> { const d=new Date(weekStart); d.setDate(weekStart.getDate()+i); return d; }), [weekStart]);

  const submit = async (e)=> {
    e.preventDefault(); if(!form.title.trim()) return; setSaving(true);
    try {
      const payload = { 
        title: form.title.trim(), 
        description:'', 
        frequencyType: form.frequencyType, daysOfWeek:
         form.frequencyType==='weekly'? [1,2,3,4,5]:[], timesPerPeriod:1 };
      if (advanced){
        if(form.durationMinutes) payload.durationMinutes = Number(form.durationMinutes);
        if(form.targetCount) payload.targetCount = Number(form.targetCount);
        if(form.customConfig){ try { payload.customConfig = JSON.parse(form.customConfig); } catch { /* ignore invalid */ } }
      }
      if (editing) {
        const updated = await updateHabit(editing._id, payload);
        updateHabitLocal(updated);
        setSelectedHabit(updated);
      } else {
        const created = await createHabit(payload);
        setHabits(prev => [created, ...prev]);
      }
      setForm(blankForm);
      setEditing(null);
      setShowModal(false); setAdvanced(false);
  } catch { /* silent; could surface toast */ }
    finally { setSaving(false); }
  };

  const startEdit = (habit) => {
    setEditing(habit);
    setForm({
      title: habit.title || '',
      frequencyType: habit.frequencyType || 'daily',
      durationMinutes: habit.durationMinutes || '',
      targetCount: habit.targetCount || '',
      customConfig: habit.customConfig ? JSON.stringify(habit.customConfig, null, 2) : ''
    });
    setShowModal(true);
  };

  const confirmDelete = async (habit) => {
    if (!window.confirm(`Delete habit "${habit.title}" permanently? This cannot be undone.`)) return;
    try {
      await deleteHabit(habit._id);
      deleteHabitLocal(habit._id);
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-8 animate-fadein">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-blue-400 tracking-tight">Home</h1>
        <button onClick={()=> setShowModal(true)} className="btn btn-success animate-pop">Add Habit</button>
      </div>
      <div className="overflow-x-auto">
        <div className="card p-0 overflow-x-auto animate-fadein">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left text-xs font-semibold text-muted px-3 py-2 w-56">Habit</th>
                {days.map(d => (
                  <th key={d.toISOString()} className="text-center text-xs font-semibold text-muted px-2 py-2">
                    {d.toLocaleDateString(undefined,{ weekday:'short'})}<br/>
                    <span className="text-[10px] text-slate-500">{d.getDate()}</span>
                  </th>
                ))}
                <th className="text-center text-xs font-semibold text-muted px-2 py-2">Streak</th>
              </tr>
            </thead>
            <tbody>
              {habits.length === 0 && (
                <tr><td colSpan={days.length+2} className="text-center text-muted text-sm py-6">No habits yet. Add one.</td></tr>
              )}
              {habits.map(h => (
                <tr key={h._id} className="group odd:bg-slate-900/40 even:bg-slate-900/20 hover:bg-slate-800/40 transition-all duration-150 animate-fadein">
                  <td className="px-3 py-2 text-sm text-[var(--color-text)] font-medium truncate">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: h.colorTag || '#64748b' }}></span>
                      <span className="flex-1 truncate" title={h.title}>{h.title}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={()=> startEdit(h)}
                          className="btn px-2 py-1 h-6 w-6 flex items-center justify-center text-xs animate-pop"
                          aria-label={`Edit ${h.title}`}
                          title="Edit"
                        >✎</button>
                        <button
                          onClick={()=> confirmDelete(h)}
                          className="btn btn-danger px-2 py-1 h-6 w-6 flex items-center justify-center text-xs animate-pop"
                          aria-label={`Delete ${h.title}`}
                          title="Delete"
                        >🗑</button>
                      </div>
                    </div>
                  </td>
                  {days.map(d => {
                    const ds = iso(d);
                    const status = getStatus(h._id, ds);
                    const done = status==='completed';
                    const isToday = ds === iso(new Date());
                    return (
                      <td key={ds} className="px-1 py-1 text-center">
                        <button
                          disabled={!isToday}
                          onClick={()=> isToday && toggleStatus(h._id, ds)}
                          className={`habit-cell-btn h-8 w-8 rounded-md text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed animate-fadein ${done ? 'bg-green-600 text-white animate-pop' : status==='skipped' ? 'bg-yellow-600 text-white' : isToday ? 'bg-slate-700 text-slate-400 hover:bg-slate-600' : 'bg-slate-800 text-slate-600'}`}
                          aria-label={`${isToday ? 'Toggle' : 'Read-only'} ${h.title} for ${ds}`}
                          title={isToday ? 'Update today\'s status' : 'Only today can be updated'}
                        >{done? '✓' : status==='skipped' ? '—' : ''}</button>
                      </td>
                    );
                  })}
                  <td className="text-center text-xs text-muted">{getStreakTolerance(h._id)}<span className="text-[10px] text-slate-500"> ({getStreak(h._id)})</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadein" onClick={(e)=> { if(e.target===e.currentTarget) setShowModal(false); }}>
          <div className="card w-full max-w-md p-6 relative animate-pop shadow-2xl">
            <button onClick={()=> setShowModal(false)} className="absolute top-2 right-2 text-muted hover:text-blue-400 transition-colors text-xl" aria-label="Close">✕</button>
            <h2 className="text-xl font-bold text-blue-400 mb-4">{editing ? 'Edit Habit' : 'Add Habit'}</h2>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Habit Name</label>
                  <input value={form.title} onChange={e=> setForm(f=>({...f,title:e.target.value}))} className="input w-full" required minLength={2} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Frequency</label>
                  <select value={form.frequencyType} onChange={e=> setForm(f=>({...f,frequencyType:e.target.value}))} className="select w-full">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
              <button type="button" onClick={()=> setAdvanced(a=>!a)} className="text-xs text-blue-400 hover:text-blue-300 font-medium transition animate-fadein">
                {advanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
              </button>
              {advanced && (
                <div className="grid grid-cols-2 gap-4 animate-fadein">
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1">Duration (mins)</label>
                    <input type="number" value={form.durationMinutes} onChange={e=> setForm(f=>({...f,durationMinutes:e.target.value}))} min={1} className="input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1">Target Count</label>
                    <input type="number" value={form.targetCount} onChange={e=> setForm(f=>({...f,targetCount:e.target.value}))} min={1} className="input w-full" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-muted mb-1">Custom Config (JSON)</label>
                    <textarea value={form.customConfig} onChange={e=> setForm(f=>({...f,customConfig:e.target.value}))} rows={2} className="textarea w-full text-xs" placeholder='{"reminder":"evening"}' />
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={()=> setShowModal(false)} className="btn bg-slate-600 hover:bg-slate-500 text-white">Cancel</button>
                <button disabled={saving} className="btn btn-success animate-pop">{saving? 'Saving...' : editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
