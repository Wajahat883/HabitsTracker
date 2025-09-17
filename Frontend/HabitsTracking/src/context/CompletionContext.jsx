import React, { createContext, useContext, useCallback, useEffect, useState, useMemo } from 'react';
import { fetchLogs, saveLog } from '../api/habits';

/*
CompletionContext: provides unified access to habit completion statuses.
- Caches last 30 days logs per habit id in memory, persists lightweight map in localStorage for offline/read-first.
- API:
  getStatus(habitId, isoDate) -> 'completed' | 'skipped' | 'incomplete'
  toggleStatus(habitId, isoDate) -> cycles status (incomplete -> completed -> skipped -> incomplete)
  getStreak(habitId) -> consecutive completed days up to today
  getTotals(habitId) -> { completed, skipped }
*/

const CompletionContext = createContext(null);
const LOCAL_KEY = 'habitCompletionCache_v1';

// Local date helpers (avoid UTC off-by-one for users east of GMT)
function localDateStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}
function todayISO(){ return localDateStr(); }
function addDays(dateStr, delta){
  const [y,m,d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m-1, d);
  dt.setDate(dt.getDate()+delta);
  return localDateStr(dt);
}

export function CompletionProvider({ children }) {
  // Removed useHabitContext to prevent re-renders
  const [cache, setCache] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || {}; } catch { return {}; }
  });
  const [loadingHabits, setLoadingHabits] = useState({}); // habitId -> bool

  // Persist cache
  useEffect(()=> { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(cache)); } catch { /* ignore persist errors */ } }, [cache]);

  const ensureLoaded = useCallback(async (habitId) => {
    if (loadingHabits[habitId] || cache[habitId]) return;
    setLoadingHabits(l => ({ ...l, [habitId]: true }));
    try {
      const range = { from: addDays(todayISO(), -30), to: todayISO() };
      const logs = await fetchLogs(habitId, range);
      const map = {}; logs.forEach(l => { map[l.date] = l.status; });
      setCache(prev => ({ ...prev, [habitId]: map }));
    } catch { /* silent */ }
    finally { setLoadingHabits(l => ({ ...l, [habitId]: false })); }
  }, [cache, loadingHabits]);

  const getStatus = useCallback((habitId, isoDate) => {
    return cache[habitId]?.[isoDate] || 'incomplete';
  }, [cache]);

  const toggleStatus = useCallback(async (habitId, isoDate) => {
    const today = todayISO();
    if (isoDate !== today) return getStatus(habitId, isoDate); // ignore non-today toggles
    await ensureLoaded(habitId);
    const current = getStatus(habitId, isoDate);
    const next = current === 'incomplete' ? 'completed' : current === 'completed' ? 'skipped' : 'incomplete';
    setCache(prev => ({ ...prev, [habitId]: { ...(prev[habitId]||{}), [isoDate]: next } }));
    try { await saveLog(habitId, { date: isoDate, status: next }); } catch { /* keep optimistic */ }
    return next;
  }, [ensureLoaded, getStatus]);

  const getStreak = useCallback((habitId) => {
    const map = cache[habitId]; if (!map) return 0;
    let streak = 0; let day = todayISO();
    while (map[day] === 'completed') { streak++; day = addDays(day, -1); }
    return streak;
  }, [cache]);

  // Streak with a single-miss tolerance: user can miss at most 1 day;
  // upon encountering the 2nd missed (incomplete or skipped not counted as completed) day, streak ends.
  const getStreakTolerance = useCallback((habitId) => {
    const map = cache[habitId]; if (!map) return 0;
    let day = todayISO();
    let streak = 0;
    let misses = 0;
    while (true) {
      const status = map[day];
      if (status === 'completed') {
        streak++;
      } else {
        misses++;
        if (misses > 1) break; // second miss stops streak accumulation
      }
  day = addDays(day, -1);
      // Safety stop after 365 days to avoid infinite loop in edge cases
      if (streak + misses > 365) break;
    }
    return streak; // only counts completed days, not missed placeholders
  }, [cache]);

  const getTotals = useCallback((habitId) => {
    const map = cache[habitId]; if (!map) return { completed:0, skipped:0 };
    let completed=0, skipped=0; Object.values(map).forEach(s => { if (s==='completed') completed++; else if (s==='skipped') skipped++; });
    return { completed, skipped };
  }, [cache]);

  const removeHabit = useCallback((habitId) => {
    setCache(prev => {
      if (!(habitId in prev)) return prev;
      const clone = { ...prev };
      delete clone[habitId];
      return clone;
    });
  }, []);

  // Derive array form for UI components needing full list per habit
  const logsByHabit = useMemo(() => {
    const out = {};
    for (const hid of Object.keys(cache)) {
      out[hid] = Object.entries(cache[hid]).map(([date,status]) => ({ date, status }));
    }
    return out;
  }, [cache]);

  const value = useMemo(() => ({ ensureLoaded, getStatus, toggleStatus, getStreak, getStreakTolerance, getTotals, removeHabit, logsByHabit }), [ensureLoaded, getStatus, toggleStatus, getStreak, getStreakTolerance, getTotals, removeHabit, logsByHabit]);
  return <CompletionContext.Provider value={value}>{children}</CompletionContext.Provider>;
}

// Hook to use completion context
// Exported in a separate file would be better for fast refresh, but keeping here for simplicity
export function useCompletion() {
  const ctx = useContext(CompletionContext);
  if (!ctx) throw new Error('useCompletion must be used within CompletionProvider');
  return ctx;
}
