import React from 'react';
import { archiveHabit } from '../../api/habits';
import { useHabitContext } from '../../context/HabitContext';

export default function HabitList() {
  const { habits, setHabits, setEditingHabit, setSelectedHabit } = useHabitContext();
  if (!habits.length) {
    return <div className="text-slate-400 text-sm">No habits yet.</div>;
  }
  return (
    <ul className="space-y-2">
      {habits.map(h => (
        <li key={h._id} className="bg-slate-800 rounded-lg p-3 flex items-center justify-between border border-slate-700">
          <div>
            <div className="font-medium text-white" style={{ color: h.colorTag || '#fff' }}>{h.title}</div>
            <div className="text-xs text-slate-400">{h.frequencyType}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setEditingHabit(h); setSelectedHabit(h); }} className="text-xs px-2 py-1 bg-slate-600 rounded text-white">Edit</button>
            {!h.isArchived && <button onClick={async () => { await archiveHabit(h._id); setHabits(prev => prev.filter(hh => hh._id !== h._id)); }} className="text-xs px-2 py-1 bg-red-600 rounded text-white">Archive</button>}
          </div>
        </li>
      ))}
    </ul>
  );
}
