import React, { useMemo, useState, useEffect } from 'react';
import { useHabitContext } from '../../context/HabitContext';

/*
HabitTodo groups habits into three buckets:
- All Todo: every active (non-archived) habit
- In Progress: habits that have at least one completed/partial log in the current period but not fully satisfied (simple heuristic: at least one log not all days logged completed)
- Complete: habits whose all required days in current period have a completed log (for now naive: has a completed log today)
This can be refined later for weekly/monthly frequencies.
*/

function todayStr(){ return new Date().toISOString().slice(0,10); }

const HabitTodo = () => {
  const { habits } = useHabitContext();
  const [logsByHabit, setLogsByHabit] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  // Fetch today's logs for quick status classification (extend to date range if needed)
  useEffect(()=>{
    let ignore = false;
    async function load(){
      setLoading(true); setError(null);
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const today = todayStr();
        const map = {};
        for (const h of habits) {
          // single day fetch (optimize later with batch endpoint)
          const res = await fetch(`${API_BASE}/api/habits/${h._id}/logs?from=${today}&to=${today}`, { credentials: 'include' });
          if (res.ok){
            const json = await res.json();
            map[h._id] = json.data || [];
          } else {
            map[h._id] = [];
          }
        }
        if(!ignore) setLogsByHabit(map);
  } catch{ if(!ignore) setError('Failed to load logs'); }
      finally { if(!ignore) setLoading(false); }
    }
    load();
    return () => { ignore = true; };
  }, [habits]);

  const today = todayStr();

  const { all, inProgress, complete } = useMemo(()=>{
    const allActive = habits.filter(h => !h.isArchived);
    const inProg = [];
    const done = [];
    for (const h of allActive) {
      const logs = logsByHabit[h._id] || [];
      const todayLog = logs.find(l => l.date === today);
      if (todayLog?.status === 'completed') {
        done.push(h);
      } else if (todayLog) {
        inProg.push(h);
      } else {
        inProg.push(h); // not started yet counts as in progress backlog
      }
    }
    return { all: allActive, inProgress: inProg, complete: done };
  }, [habits, logsByHabit, today]);

  function renderList(list){
    if (loading) return <div className="text-slate-400 text-sm p-4">Loading...</div>;
    if (error) return <div className="text-red-400 text-sm p-4">{error}</div>;
    if (!list.length) return <div className="text-slate-500 text-sm p-4">No habits.</div>;
    return (
      <ul className="divide-y divide-slate-700">
        {list.map(h => (
          <li key={h._id} className="flex items-center justify-between py-3 px-2 hover:bg-slate-700/50 rounded">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full" style={{ background: h.colorTag || '#64748b' }}></span>
              <span className="text-sm text-slate-200 font-medium">{h.title}</span>
            </div>
            <span className="text-xs text-slate-400 uppercase tracking-wide">{h.frequencyType}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="col-span-1 md:col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Habit Todo</h2>
        <div className="flex gap-2 text-xs">
          <button onClick={()=>setActiveTab('all')} className={`px-3 py-1 rounded-full border ${activeTab==='all' ? 'bg-blue-600 border-blue-500 text-white':'border-slate-600 text-slate-300 hover:bg-slate-700'}`}>All Todo ({all.length})</button>
          <button onClick={()=>setActiveTab('in')} className={`px-3 py-1 rounded-full border ${activeTab==='in' ? 'bg-amber-600 border-amber-500 text-white':'border-slate-600 text-slate-300 hover:bg-slate-700'}`}>In Progress ({inProgress.length})</button>
          <button onClick={()=>setActiveTab('done')} className={`px-3 py-1 rounded-full border ${activeTab==='done' ? 'bg-green-600 border-green-500 text-white':'border-slate-600 text-slate-300 hover:bg-slate-700'}`}>Complete ({complete.length})</button>
        </div>
      </div>
      {activeTab === 'all' && renderList(all)}
      {activeTab === 'in' && renderList(inProgress)}
      {activeTab === 'done' && renderList(complete)}
      <div className="mt-4 text-[10px] text-slate-500">Classification is naive (completed today = Complete). Will refine for weekly/monthly frequencies later.</div>
    </div>
  );
};

export default HabitTodo;
