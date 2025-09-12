import React, { useEffect, useState } from 'react';
import { fetchHeatmap } from '../../api/progress';

function colorFor(count) {
  if (!count) return 'bg-slate-700';
  if (count === 1) return 'bg-green-700';
  if (count === 2) return 'bg-green-600';
  if (count === 3) return 'bg-green-500';
  return 'bg-green-400';
}

export default function CalendarHeatmap() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();

  useEffect(() => {
    (async () => {
      try { setData(await fetchHeatmap(year)); }
      finally { setLoading(false); }
    })();
  }, [year]);

  if (loading) return <div className="text-slate-400 text-sm">Loading heatmap...</div>;

  // group by month
  const byMonth = {};
  data.forEach(d => {
    const m = d.date.slice(0,7);
    byMonth[m] = byMonth[m] || [];
    byMonth[m].push(d);
  });

  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
      <h3 className="text-white font-semibold mb-2">Year Heatmap ({year})</h3>
      <div className="flex flex-wrap gap-4">
        {Object.keys(byMonth).sort().map(month => (
          <div key={month} className="flex flex-col">
            <span className="text-xs text-slate-400 mb-1">{month}</span>
            <div className="grid grid-cols-7 gap-1">
              {byMonth[month].map(d => (
                <div key={d.date} className={`w-4 h-4 rounded ${colorFor(d.completedCount)}`} title={`${d.date}: ${d.completedCount}`}></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
