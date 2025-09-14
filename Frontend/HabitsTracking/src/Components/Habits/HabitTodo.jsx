import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useHabitContext } from '../../context/useHabitContext';
import { saveLog } from '../../api/habits';
import Toast from '../Common/Toast';

/*
HabitTodo groups habits into three buckets:
- All Todo: every active (non-archived) habit
- In Progress: habits that have at least one completed/partial log in the current period but not fully satisfied (simple heuristic: at least one log not all days logged completed)
- Complete: habits whose all required days in current period have a completed log (for now naive: has a completed log today)
This can be refined later for weekly/monthly frequencies.
*/


const HabitTodo = () => {
  const { habits, progressSummary, loadProgress } = useHabitContext();
  // logsByHabit reserved for future backend sync
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  // local status map: { habitId: { status: 'todo'|'in'|'done', startedAt, completedAt } }
  const [localStatus, setLocalStatus] = useState(()=>{
    try { return JSON.parse(localStorage.getItem('habitTodoStatus')||'{}'); } catch { return {}; }
  });

  // persist localStatus
  useEffect(()=>{ try { localStorage.setItem('habitTodoStatus', JSON.stringify(localStatus)); } catch { /* ignore */ } }, [localStatus]);

  const logCompletion = useCallback(async (habitId) => {
    const today = new Date().toISOString().slice(0,10);
    try {
      await saveLog(habitId, { date: today, status: 'completed', note: null });
      loadProgress();
    } catch {
      setToastMsg('Failed to sync log');
      setShowToast(true);
      setTimeout(()=> setShowToast(false), 3000);
    }
  }, [loadProgress]);

  const updateStatus = useCallback((id, nextStatus) => {
    setLocalStatus(prev => {
      const existing = prev[id] || {};
      const now = new Date().toISOString();
      const patch = { status: nextStatus };
      if (nextStatus === 'in' && !existing.startedAt) patch.startedAt = now;
      if (nextStatus === 'done' && !existing.completedAt) patch.completedAt = now;
      return { ...prev, [id]: { ...existing, ...patch } };
    });
    if (nextStatus === 'done') {
      logCompletion(id);
      setToastMsg('Congratulations! Completed');
      setShowToast(true);
      setTimeout(()=> setShowToast(false), 3000);
    }
  }, [logCompletion]);

  // Placeholder: could fetch per-habit logs to refine status later


  const { all, inProgress, complete } = useMemo(()=>{
    const allActive = habits.filter(h => !h.isArchived);
    const inProg = [];
    const done = [];
    for (const h of allActive) {
      const state = localStatus[h._id]?.status;
      if (state === 'done') done.push(h);
      else if (state === 'in') inProg.push(h);
      else inProg.push(h); // default backlog
    }
    return { all: allActive, inProgress: inProg.filter(h=> !done.includes(h)), complete: done };
  }, [habits, localStatus]);

  // Drag handlers
  const onDragStart = (e, id) => { e.dataTransfer.setData('text/plain', id); };
  const allowDrop = e => { e.preventDefault(); };
  const onDrop = (e, bucket) => {
    e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (!id) return; updateStatus(id, bucket);
  };

  function renderList(list){
    if (!list.length) return <div className="text-slate-500 text-sm p-4">No habits.</div>;
    return (
      <ul className="space-y-2 min-h-[120px]">
        {list.map(h => (
          <li
            key={h._id}
            draggable
            onDragStart={(e)=> onDragStart(e, h._id)}
            className="cursor-move flex items-center justify-between py-2 px-3 rounded bg-slate-700/60 hover:bg-slate-600 transition text-sm"
          >
            <div className="flex items-center gap-2 w-full">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: h.colorTag || '#64748b' }}></span>
              <span className="text-slate-200 font-medium truncate max-w-[120px]" title={h.title}>{h.title}</span>
              {/* Streak badge */}
              {progressSummary && (
                (()=>{
                  const st = progressSummary.habitStreaks?.find(x=> x.habitId === h._id)?.streak || 0;
                  return <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-600 text-blue-300" title="Current streak">{st}d</span>;
                })()
              )}
              <button
                onClick={(e)=> { e.stopPropagation(); updateStatus(h._id, 'done'); }}
                className="ml-auto text-[10px] px-2 py-1 rounded bg-green-600 hover:bg-green-500 text-white"
                aria-label="Mark complete"
              >✓</button>
            </div>
            <span className="ml-2 text-[10px] text-slate-400 uppercase tracking-wide">{localStatus[h._id]?.status || 'todo'}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="col-span-1 md:col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-6 relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Habit Todo</h2>
  <div className="text-[10px] text-slate-400">Drag habits between columns</div>
      </div>
  {/* Progress Bar */}
  <ProgressBar all={all} complete={complete} />
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div onDragOver={allowDrop} onDrop={(e)=> onDrop(e, 'in')} className="bg-slate-900/40 rounded p-3 border border-slate-700">
          <h3 className="text-xs font-semibold text-slate-300 mb-2">All Todo ({all.length})</h3>
          {renderList(all)}
        </div>
        <div onDragOver={allowDrop} onDrop={(e)=> onDrop(e, 'in')} className="bg-slate-900/40 rounded p-3 border border-slate-700">
          <h3 className="text-xs font-semibold text-amber-300 mb-2">In Progress ({inProgress.length})</h3>
          {renderList(inProgress)}
        </div>
        <div onDragOver={allowDrop} onDrop={(e)=> onDrop(e, 'done')} className="bg-slate-900/40 rounded p-3 border border-slate-700">
          <h3 className="text-xs font-semibold text-green-300 mb-2">Complete ({complete.length})</h3>
          {renderList(complete)}
        </div>
      </div>
      <div className="mt-4 text-[10px] text-slate-500">Local drag state only; integrate with backend logs later.</div>
      {showToast && <Toast message={toastMsg} type="success" />}
    </div>
  );
};

// Simple progress bar component
const ProgressBar = ({ all, complete }) => {
  const total = all.length || 1;
  const pct = Math.round((complete.length / total) * 100);
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-slate-400">Daily Progress</span>
        <span className="text-[11px] text-slate-300 font-medium">{complete.length}/{total} ({pct}%)</span>
      </div>
      <div className="h-2 w-full bg-slate-700 rounded overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all" style={{ width: pct + '%' }}></div>
      </div>
    </div>
  );
};

export default HabitTodo;
