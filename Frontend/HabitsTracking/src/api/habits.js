const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000';
// debug log once
if (typeof window !== 'undefined' && !window.__HABIT_API_BASE_LOGGED__) {
  window.__HABIT_API_BASE_LOGGED__ = true;
  console.log('[HabitsAPI] Using API base:', API_BASE);
}

const jsonHeaders = { 'Content-Type': 'application/json' };

export async function fetchHabits({ archived = false } = {}) {
  const res = await fetch(`${API_BASE}/api/habits?archived=${archived}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load habits');
  const data = await res.json();
  return data.data || [];
}

export async function createHabit(payload) {
  const res = await fetch(`${API_BASE}/api/habits`, { method: 'POST', credentials: 'include', headers: jsonHeaders, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create habit');
  return (await res.json()).data;
}

export async function updateHabit(id, payload) {
  const res = await fetch(`${API_BASE}/api/habits/${id}`, { method: 'PATCH', credentials: 'include', headers: jsonHeaders, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to update habit');
  return (await res.json()).data;
}

export async function archiveHabit(id) {
  const res = await fetch(`${API_BASE}/api/habits/${id}/archive`, { method: 'PATCH', credentials: 'include' });
  if (!res.ok) throw new Error('Failed to archive habit');
  return (await res.json()).data;
}

export async function saveLog(id, { date, status, note }) {
  const res = await fetch(`${API_BASE}/api/habits/${id}/logs`, { method: 'POST', credentials: 'include', headers: jsonHeaders, body: JSON.stringify({ date, status, note }) });
  if (!res.ok) throw new Error('Failed to save log');
  return (await res.json()).data;
}

export async function fetchLogs(id, { from, to }) {
  const url = `${API_BASE}/api/habits/${id}/logs?from=${from}&to=${to}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load logs');
  return (await res.json()).data || [];
}
