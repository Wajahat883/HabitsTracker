import api from '../config/axios';

async function jsonGet(path) {
  const response = await api.get(path);
  return response.data;
}

async function jsonPost(path, body) {
  const response = await api.post(path, body);
  return response.data;
}

async function jsonPatch(path, body = {}) {
  const response = await api.patch(path, body);
  return response.data;
}

async function jsonDelete(path) {
  const response = await api.delete(path);
  return response.data;
}

// Get all users
export function getAllUsers(page = 1, limit = 20) {
  return jsonGet(`/auth/users?page=${page}&limit=${limit}`);
}

// Search users
export function searchUsers(query) {
  return jsonGet(`/auth/search?query=${encodeURIComponent(query)}`);
}

// Notifications
export function getNotifications() {
  return jsonGet('/notifications');
}

export function getUnreadCount() {
  return jsonGet('/notifications/unread-count');
}

export function markAsRead(notificationId) {
  return jsonPatch(`/notifications/${notificationId}/read`);
}

export function markAllAsRead() {
  return jsonPatch('/notifications/read-all');
}

export function deleteNotification(notificationId) {
  return jsonDelete(`/notifications/${notificationId}`);
}
