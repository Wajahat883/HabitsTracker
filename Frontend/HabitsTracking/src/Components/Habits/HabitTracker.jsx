import React, { useEffect, useState } from 'react';
import { fetchLogs, saveLog } from '../../api/habits';
import { useHabitContext } from '../../context/HabitContext';

const STATUSES = ['incomplete','completed','skipped'];

function nextStatus(current) {
  if (!current || current === 'incomplete') return 'completed';
  if (current === 'completed') return 'skipped';
  return 'incomplete';
}

export default function HabitTracker() {
  const { selectedHabit } = useHabitContext();
  const [logs, setLogs] = useState({});
  const [loading, setLoading] = useState(false);
  const [range] = useState(() => {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 13);
    const to = today;
    const fmt = d => d.toISOString().slice(0,10);
    return { from: fmt(from), to: fmt(to) };
  });

  useEffect(() => {
    if (!selectedHabit) return;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchLogs(selectedHabit._id, range);
        const map = {}; data.forEach(l => { map[l.date] = l; });
        setLogs(map);
  } catch { /* handle silently */ }
      finally { setLoading(false); }
    })();
  }, [selectedHabit, range]);

  if (!selectedHabit) return <div className="text-slate-400 text-sm">Select a habit to track.</div>;

  const days = [];
  const start = new Date(range.from + 'T00:00:00Z');
  const end = new Date(range.to + 'T00:00:00Z');
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  const toggle = async (dateStr) => {
    const current = logs[dateStr]?.status || 'incomplete';
    const status = nextStatus(current);
    // optimistic
    setLogs(prev => ({ ...prev, [dateStr]: { ...(prev[dateStr]||{}), date: dateStr, status } }));
    try { await saveLog(selectedHabit._id, { date: dateStr, status }); }
    catch { /* revert */ }
  };

  const fmt = d => d.toISOString().slice(0,10);

  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
      <h4 className="text-white font-semibold mb-3">Tracker (Last 14 Days)</h4>
      {loading && <div className="text-slate-400 text-xs mb-2">Loading...</div>}
      <div className="grid grid-cols-7 gap-2">
        {days.map(d => {
          const ds = fmt(d);
          const status = logs[ds]?.status || 'incomplete';
          let color = 'bg-slate-700';
            if (status === 'completed') color = 'bg-green-600';
            else if (status === 'skipped') color = 'bg-yellow-600';
          return (
            <button key={ds} onClick={() => toggle(ds)} title={ds}
              className={`h-10 w-10 rounded text-xs text-white flex items-center justify-center ${color}`}>{d.getDate()}</button>
          );
        })}
      </div>
    </div>
  );
}
