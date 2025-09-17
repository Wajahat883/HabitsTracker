import api from '../config/axios';

export function fetchProgressSummary(range = '30d') {
  return api.get(`/progress/summary?range=${range}`).then(res => res.data);
}

export function fetchHeatmap(year = new Date().getFullYear()) {
  return api.get(`/progress/heatmap?year=${year}`).then(res => res.data);
}

export function fetchHabitTrend(habitId, days = 30) {
  return api.get(`/progress/habits/${habitId}/trend?days=${days}`).then(res => res.data);
}

export function fetchFriendsProgress(range = '30d') {
  return api.get(`/progress/friends?range=${range}`).then(res => res.data);
}
