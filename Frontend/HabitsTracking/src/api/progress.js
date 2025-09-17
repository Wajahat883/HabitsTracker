const API_BASE = import.meta.env.VITE_API_BASE_URL || 
import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function jsonGet(path) {
  const res = await fetch(`${API_BASE}${path}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Request failed');
  const data = await res.json();
  return data.data;
}

export function fetchProgressSummary(range = '30d') {
  return jsonGet(`/api/progress/summary?range=${range}`);
}

export function fetchHeatmap(year = new Date().getFullYear()) {
  return jsonGet(`/api/progress/heatmap?year=${year}`);
}

export function fetchHabitTrend(habitId, days = 30) {
  return jsonGet(`/api/progress/habits/${habitId}/trend?days=${days}`);
}

export function fetchFriendsProgress(range = '30d') {
  return jsonGet(`/api/progress/friends?range=${range}`);
}
