import React, { useEffect, useState, useCallback } from 'react';
import { useHabitContext } from '../../context/useHabitContext';
import { useCompletion } from '../../context/CompletionContext';

// Status sequencing handled by CompletionContext.toggleStatus

export default function HabitTracker() {
  const { selectedHabit } = useHabitContext();
  const { ensureLoaded, getStatus, toggleStatus } = useCompletion();
  const [loading, setLoading] = useState(false);
  const [range] = useState(() => {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 13);
    const to = today;
  const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return { from: fmt(from), to: fmt(to) };
  });

  useEffect(() => {
    let ignore = false;
    if (!selectedHabit) return;
    (async () => {
      setLoading(true);
      try { await ensureLoaded(selectedHabit._id); } catch { /* silent */ }
      finally { if(!ignore) setLoading(false); }
    })();
    return () => { ignore = true; };
  }, [selectedHabit, ensureLoaded]);
  const toggle = useCallback(async (dateStr) => {
    if (!selectedHabit) return;
    await toggleStatus(selectedHabit._id, dateStr);
  }, [selectedHabit, toggleStatus]);

  if (!selectedHabit) return <div className="text-slate-400 text-sm">Select a habit to track.</div>;

  const days = [];
  const [sy,sm,sd] = range.from.split('-').map(Number);
  const [ey,em,ed] = range.to.split('-').map(Number);
  const start = new Date(sy, sm-1, sd);
  const end = new Date(ey, em-1, ed);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
      <h4 className="text-white font-semibold mb-3">Tracker (Last 14 Days)</h4>
      {loading && <div className="text-slate-400 text-xs mb-2">Loading...</div>}
  <div className="grid grid-cols-7 gap-2" role="grid" aria-label="Habit tracker last 14 days">
        {days.map(d => {
          const ds = fmt(d);
          const status = selectedHabit ? getStatus(selectedHabit._id, ds) : 'incomplete';
          const now = new Date();
          const isToday = ds === `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
          let color = isToday ? 'bg-slate-700' : 'bg-slate-800';
            if (status === 'completed') color = isToday ? 'bg-green-600' : 'bg-green-900';
            else if (status === 'skipped') color = isToday ? 'bg-yellow-600' : 'bg-yellow-900';
          return (
    <button key={ds} onClick={() => isToday && toggle(ds)} title={ds}
      disabled={!isToday}
      aria-label={`${isToday ? 'Toggle' : 'Read-only'} day ${ds} status ${status}`}
      className={`habit-cell-btn h-10 w-10 rounded text-xs text-white flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed ${color}`}>{d.getDate()}</button>
          );
        })}
      </div>
    </div>
  );
}
