const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function jsonGet(path) {
  const res = await fetch(`${API_BASE}${path}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Request failed');
  return (await res.json()).data;
}

async function jsonPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error('Request failed');
  return (await res.json()).data;
}

async function jsonPatch(path, body = {}) {
  const res = await fetch(`${API_BASE}${path}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error('Request failed');
  return (await res.json()).data;
}

async function jsonDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) throw new Error('Request failed');
  return (await res.json()).data;
}

// Get all users
export function getAllUsers(page = 1, limit = 20) {
  return jsonGet(`/api/auth/users?page=${page}&limit=${limit}`);
}

// Search users
export function searchUsers(query) {
  return jsonGet(`/api/auth/search?query=${encodeURIComponent(query)}`);
}

// Notifications
export function getNotifications() {
  return jsonGet('/api/notifications');
}

export function getUnreadCount() {
  return jsonGet('/api/notifications/unread-count');
}

export function markAsRead(notificationId) {
  return jsonPatch(`/api/notifications/${notificationId}/read`);
}

export function markAllAsRead() {
  return jsonPatch('/api/notifications/read-all');
}

export function deleteNotification(notificationId) {
  return jsonDelete(`/api/notifications/${notificationId}`);
}
