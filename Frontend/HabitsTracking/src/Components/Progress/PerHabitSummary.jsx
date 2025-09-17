import React, { useEffect } from 'react';
import { useHabitContext } from '../../context/useHabitContext';
import { useCompletion } from '../../context/CompletionContext';

function todayISO(){ return new Date().toISOString().slice(0,10); }

export default function PerHabitSummary(){
  const { habits } = useHabitContext();
  const { ensureLoaded, getStatus, getStreak, getStreakTolerance, getTotals } = useCompletion();
  const today = todayISO();

  useEffect(()=> {
    habits.forEach(h=> { ensureLoaded(h._id); });
  }, [habits, ensureLoaded]);

  if(!habits.length) return <div className="text-muted text-sm">No habits yet.</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
      {habits.map(h => {
        const status = getStatus(h._id, today);
  const strictStreak = getStreak(h._id);
  const tolStreak = getStreakTolerance(h._id);
        const { completed, skipped } = getTotals(h._id);
        return (
          <div key={h._id} className="bg-surface border border-app rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-primary truncate" title={h.title}>{h.title}</h4>
              <span className={`text-[10px] px-2 py-1 rounded uppercase tracking-wide font-medium ${status==='completed'?'bg-green-600 text-white': status==='skipped'?'bg-yellow-600 text-white':'bg-slate-700 text-muted'}`}>{status}</span>
            </div>
            <div className="flex gap-4 text-xs text-slate-300">
              <div><span className="text-slate-400">Streak:</span> {tolStreak}d <span className="text-[10px] text-slate-500">(strict {strictStreak})</span></div>
              <div><span className="text-slate-400">Done:</span> {completed}</div>
              <div><span className="text-slate-400">Skipped:</span> {skipped}</div>
            </div>
            {(h.durationMinutes || h.targetCount) && (
              <div className="mt-2 text-[10px] text-slate-400 flex gap-3">
                {h.durationMinutes && <span>Dur: {h.durationMinutes}m</span>}
                {h.targetCount && <span>Target: {h.targetCount}</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
