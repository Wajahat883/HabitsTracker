import React from 'react';

export default function HabitTrendChart({ data }) {
  if (!data || !data.length) return <div className="text-slate-400 text-sm">No data</div>;

  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
      <h3 className="text-white font-semibold mb-2">Habit Streaks</h3>
      <div className="aspect-square">
        <div className="flex flex-col gap-2">
          {data.map(h => (
            <div key={h.habitId} className="flex justify-between items-center">
              <span className="text-slate-300 text-sm truncate mr-2">{h.title}</span>
              <span className="text-blue-400 font-medium">{h.streak}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
