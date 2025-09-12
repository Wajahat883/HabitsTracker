import React, { useEffect, useState } from 'react';
import { fetchHabitTrend } from '../../api/progress';

export default function HabitTrendChart({ habit }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!habit) return;
    (async () => {
      setLoading(true);
      try { setData(await fetchHabitTrend(habit._id, 14)); }
      finally { setLoading(false); }
    })();
  }, [habit]);

  if (!habit) return null;

  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
      <h3 className="text-white font-semibold mb-2">Trend (14d) - {habit.title}</h3>
      {loading && <div className="text-slate-400 text-xs">Loading...</div>}
      <div className="flex items-end gap-1 h-32">
        {data.map(d => {
          const status = d.status;
          let h = 4; let color = 'bg-slate-700';
          if (status === 'completed') { h = 60; color = 'bg-green-500'; }
          else if (status === 'skipped') { h = 30; color = 'bg-yellow-500'; }
          else if (status === 'missed') { h = 10; color = 'bg-red-500'; }
          return <div key={d.date} className="flex flex-col items-center w-4">
            <div className={`w-full rounded ${color}`} style={{ height: h }}></div>
            <span className="text-[10px] text-slate-400 mt-1">{d.date.slice(5)}</span>
          </div>;
        })}
      </div>
    </div>
  );
}
