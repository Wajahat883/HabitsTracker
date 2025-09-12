import React, { useEffect, useState } from 'react';
import { fetchProgressSummary } from '../../api/progress';

export default function ProgressSummary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try { setData(await fetchProgressSummary()); }
      catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="text-slate-400 text-sm">Loading summary...</div>;
  if (error) return <div className="text-red-400 text-sm">{error}</div>;
  if (!data) return null;

  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col gap-3">
      <h3 className="text-white font-semibold">Progress Summary (30d)</h3>
      <div className="grid grid-cols-2 gap-4 text-sm text-slate-200">
        <div><span className="text-slate-400">Completion:</span> {data.overallCompletion}%</div>
        <div><span className="text-slate-400">Active Habits:</span> {data.activeHabits}</div>
        <div><span className="text-slate-400">Avg Streak:</span> {data.avgStreak}</div>
        <div><span className="text-slate-400">Longest Streak:</span> {data.longestStreak}</div>
      </div>
      {data.habitStreaks && data.habitStreaks.length > 0 && (
        <div>
          <div className="text-xs text-slate-400 mb-1">Top Streaks (1 missed day tolerance)</div>
          <ul className="max-h-32 overflow-y-auto space-y-1 text-xs text-slate-300">
            {data.habitStreaks.slice(0,5).map(h => (
              <li key={h.habitId} className="flex justify-between"><span className="truncate mr-2">{h.title}</span><span className="text-blue-400 font-medium">{h.streak}</span></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
