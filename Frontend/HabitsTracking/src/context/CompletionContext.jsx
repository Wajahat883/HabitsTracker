import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { fetchLogs, saveLog } from '../api/habits';
import { useHabitContext } from './useHabitContext';

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

function todayISO() { return new Date().toISOString().slice(0,10); }
function addDays(dateStr, delta) { const d = new Date(dateStr); d.setDate(d.getDate()+delta); return d.toISOString().slice(0,10); }

export function CompletionProvider({ children }) {
  // Habit context included for potential future invalidation; not directly used now
  useHabitContext();
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

  const getTotals = useCallback((habitId) => {
    const map = cache[habitId]; if (!map) return { completed:0, skipped:0 };
    let completed=0, skipped=0; Object.values(map).forEach(s => { if (s==='completed') completed++; else if (s==='skipped') skipped++; });
    return { completed, skipped };
  }, [cache]);

  const value = { ensureLoaded, getStatus, toggleStatus, getStreak, getTotals };
  return <CompletionContext.Provider value={value}>{children}</CompletionContext.Provider>;
}

export function useCompletion() { const ctx = useContext(CompletionContext); if(!ctx) throw new Error('useCompletion must be used within CompletionProvider'); return ctx; }
