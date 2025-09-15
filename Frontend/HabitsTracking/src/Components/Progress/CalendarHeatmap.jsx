import React, { useEffect, useState, useMemo } from 'react';
import { fetchHeatmap } from '../../api/progress';

// Map completion counts to inline style colors using success hue
function cellStyle(count) {
  if (!count) return { background: 'var(--color-bg-alt)' };
  const base = getComputedStyle(document.documentElement).getPropertyValue('--color-success') || '#10b981';
  // Simple opacity scaling (cap at 1)
  const levels = [0.25, 0.45, 0.65, 0.85];
  const idx = Math.min(count - 1, levels.length - 1);
  return { background: base.trim(), opacity: levels[idx] };
}

export default function CalendarHeatmap() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();

  useEffect(() => {
    let ignore = false;
    (async () => {
      try { const res = await fetchHeatmap(year); if(!ignore) setData(res||[]); }
      finally { if(!ignore) setLoading(false); }
    })();
    return () => { ignore = true; };
  }, [year]);

  const byMonth = useMemo(() => {
    const bucket = {};
    data.forEach(d => {
      const m = d.date.slice(0,7);
      if(!bucket[m]) bucket[m] = [];
      bucket[m].push(d);
    });
    return bucket;
  }, [data]);

  if (loading) return <div className="text-muted text-sm">Loading heatmap...</div>;

  return (
    <div className="bg-surface p-4 rounded-lg border border-app">
      <h3 className="text-primary font-semibold mb-2">Year Heatmap ({year})</h3>
      <div className="flex flex-wrap gap-4">
        {Object.keys(byMonth).sort().map(month => (
          <div key={month} className="flex flex-col">
            <span className="text-xs text-muted mb-1">{month}</span>
            <div className="grid grid-cols-7 gap-1">
              {byMonth[month].map(d => (
                <div
                  key={d.date}
                  className="w-4 h-4 rounded transition-colors"
                  style={cellStyle(d.completedCount)}
                  title={`${d.date}: ${d.completedCount}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
