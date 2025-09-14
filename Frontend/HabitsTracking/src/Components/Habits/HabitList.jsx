import React, { useState, useMemo } from 'react';
import { archiveHabit, deleteHabit } from '../../api/habits';
import { useHabitContext } from '../../context/HabitContext';

export default function HabitList({ showArchived = false, onArchive, onDelete }) {
  const { habits, setHabits, setEditingHabit, setSelectedHabit } = useHabitContext();
  const [filter, setFilter] = useState(showArchived ? 'archived' : 'active');

  const filtered = useMemo(() => habits.filter(h => filter === 'archived' ? h.isArchived : !h.isArchived), [habits, filter]);

  if (!habits.length) return <div className="text-slate-400 text-sm">No habits yet. Create one to get started.</div>;
  if (!filtered.length) return <div className="text-slate-400 text-sm">No {filter === 'archived' ? 'archived' : 'active'} habits.</div>;

  return (
    <div className="space-y-3">
      <div className="flex gap-2 text-xs">
        <button onClick={()=> setFilter('active')} className={`px-3 py-1 rounded-full border ${filter==='active' ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-600 text-slate-300'}`}>Active</button>
        <button onClick={()=> setFilter('archived')} className={`px-3 py-1 rounded-full border ${filter==='archived' ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-600 text-slate-300'}`}>Archived</button>
      </div>
      <ul className="space-y-2">
        {filtered.map(h => (
          <li key={h._id} className="bg-slate-800 rounded-lg p-3 flex items-center justify-between border border-slate-700">
            <div>
              <div className="font-medium text-white flex items-center gap-2" style={{ color: h.colorTag || '#fff' }}>
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: h.colorTag || '#64748b' }}></span>
                {h.title}
              </div>
              <div className="text-xs text-slate-400 capitalize">{h.frequencyType}</div>
            </div>
            <div className="flex gap-2 items-center">
              {!h.isArchived && <button onClick={() => { setEditingHabit(h); setSelectedHabit(h); }} className="text-xs px-2 py-1 bg-slate-600 hover:bg-slate-500 rounded text-white">Edit</button>}
              {!h.isArchived && <button onClick={async () => { await archiveHabit(h._id); setHabits(prev => prev.map(x => x._id===h._id ? { ...x, isArchived: true } : x)); if(onArchive) onArchive(h); }} className="text-xs px-2 py-1 bg-yellow-600 hover:bg-yellow-500 rounded text-white">Archive</button>}
              {h.isArchived && <button onClick={async () => { await deleteHabit(h._id); setHabits(prev => prev.filter(x => x._id !== h._id)); if(onDelete) onDelete(h); }} className="text-xs px-2 py-1 bg-red-700 hover:bg-red-600 rounded text-white">Delete</button>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
