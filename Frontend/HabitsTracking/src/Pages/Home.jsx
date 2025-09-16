import React, { useEffect, useState } from 'react';

// Local storage keys
const HABITS_KEY = 'simple_habits_v1';
// Each habit: { id, title, createdAt, week:{ '2025-09-15': true/false } }

function startOfWeek(date) { // Monday start
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun -> need Monday start
  const diff = (day === 0 ? -6 : 1 - day); // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  return d;
}

function formatISO(d) { return d.toISOString().slice(0,10); }

export default function Home() {
  const [habits, setHabits] = useState(() => {
    try { return JSON.parse(localStorage.getItem(HABITS_KEY)) || []; } catch { return []; }
  });
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  // Persist
  useEffect(()=> { localStorage.setItem(HABITS_KEY, JSON.stringify(habits)); }, [habits]);

  const weekStart = startOfWeek(new Date());
  const days = Array.from({ length:7 }, (_,i) => { const d = new Date(weekStart); d.setDate(weekStart.getDate()+i); return d; });

  const addHabit = (e) => {
    e.preventDefault();
    if(!newTitle.trim()) return;
    const habit = { id: crypto.randomUUID(), title: newTitle.trim(), createdAt: Date.now(), week: {} };
    setHabits(prev => [habit, ...prev]);
    setNewTitle('');
    setShowModal(false);
  };

  const toggle = (habitId, dateStr) => {
    setHabits(prev => prev.map(h => h.id === habitId ? { ...h, week: { ...h.week, [dateStr]: !h.week[dateStr] } } : h));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Home</h1>
        <button onClick={()=> setShowModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium">Add New Habit</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-slate-700 rounded-lg overflow-hidden">
          <thead className="bg-slate-800">
            <tr>
              <th className="text-left text-xs font-semibold text-slate-300 px-3 py-2 w-56">Habit</th>
              {days.map(d => (
                <th key={d.toISOString()} className="text-center text-xs font-semibold text-slate-300 px-2 py-2">
                  {d.toLocaleDateString(undefined,{ weekday:'short'})}<br/>
                  <span className="text-[10px] text-slate-500">{d.getDate()}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habits.length === 0 && (
              <tr><td colSpan={8} className="text-center text-slate-500 text-sm py-6">No habits yet. Add one.</td></tr>
            )}
            {habits.map(h => (
              <tr key={h.id} className="odd:bg-slate-900/40 even:bg-slate-900/20 hover:bg-slate-800/40">
                <td className="px-3 py-2 text-sm text-slate-200 font-medium truncate">{h.title}</td>
                {days.map(d => {
                  const ds = formatISO(d);
                  const done = !!h.week[ds];
                  return (
                    <td key={ds} className="px-1 py-1 text-center">
                      <button
                        onClick={()=> toggle(h.id, ds)}
                        className={`h-8 w-8 rounded-md text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${done ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                        aria-label={`Mark ${h.title} ${done? 'incomplete':'complete'} for ${ds}`}
                      >{done ? '✓' : ''}</button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e)=> { if(e.target===e.currentTarget) setShowModal(false); }}>
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-sm p-6 relative">
            <button onClick={()=> setShowModal(false)} className="absolute top-2 right-2 text-slate-400 hover:text-white" aria-label="Close">✕</button>
            <h2 className="text-lg font-semibold text-white mb-4">Add Habit</h2>
            <form onSubmit={addHabit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Title</label>
                <input value={newTitle} onChange={e=> setNewTitle(e.target.value)} className="w-full bg-slate-700 text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Drink Water" required minLength={2} />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={()=> setShowModal(false)} className="px-3 py-2 text-sm bg-slate-600 rounded text-white">Cancel</button>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
