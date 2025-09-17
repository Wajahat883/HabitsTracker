import React, { useEffect, useState } from 'react';
import { useHabitContext } from '../../context/useHabitContext';
import { useCompletion } from '../../context/CompletionContext';
import HabitScheduleTable from './HabitScheduleTable';

// Status sequencing handled by CompletionContext.toggleStatus

export default function HabitTracker() {
  const { selectedHabit } = useHabitContext();
  const { ensureLoaded, logsByHabit } = useCompletion();
  const [loading, setLoading] = useState(false);

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

  if (!selectedHabit) return <div className="text-slate-400 text-sm">Select a habit to track.</div>;

  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
      <h4 className="text-white font-semibold mb-3">Tracker ({selectedHabit.frequencyType})</h4>
      {loading && <div className="text-slate-400 text-xs mb-2">Loading logs...</div>}
      <HabitScheduleTable habit={selectedHabit} logsMap={logsByHabit} />
    </div>
  );
}
