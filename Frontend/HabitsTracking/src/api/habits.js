import api from '../config/axios';

export async function fetchHabits({ archived = false } = {}) {
  const response = await api.get(`/habits?archived=${archived}`);
  return response.data || [];
}

export async function createHabit(payload) {
  const response = await api.post('/habits', payload);
  return response.data;
}

export async function updateHabit(id, payload) {
  const response = await api.patch(`/habits/${id}`, payload);
  return response.data;
}

export async function fetchHabit(id) {
  const response = await api.get(`/habits/${id}`);
  return response.data;
}

export async function archiveHabit(id) {
  const response = await api.patch(`/habits/${id}/archive`);
  return response.data;
}

export async function restoreHabit(id) {
  const response = await api.patch(`/habits/${id}/restore`);
  return response.data;
}

export async function deleteHabit(id) {
  const response = await api.delete(`/habits/${id}`);
  return response.data;
}

export async function saveLog(id, { date, status, note }) {
  const response = await api.post(`/habits/${id}/logs`, { date, status, note });
  return response.data;
}

export async function fetchLogs(id, { from, to }) {
  const response = await api.get(`/habits/${id}/logs?from=${from}&to=${to}`);
  return response.data || [];
}

export async function fetchBatchLogs(habitIds = [], { from, to }) {
  if (!habitIds.length) return {};
  const response = await api.get(`/habits/logs/batch/all?habitIds=${habitIds.join(',')}&from=${from}&to=${to}`);
  return response.data || {};
}

export async function forceRollover() {
  const response = await api.post('/habits/rollover/force');
  return response.data;
}
