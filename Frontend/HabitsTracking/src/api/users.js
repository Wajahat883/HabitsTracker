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

// Utility to unwrap ApiResponse style { statusCode, data, message }
function unwrap(payload) {
  if (payload && typeof payload === 'object' && 'data' in payload && !Array.isArray(payload)) return payload.data;
  return payload;
}

// Get all users
export async function getAllUsers(page = 1, limit = 20) {
  const res = await jsonGet(`/auth/users?page=${page}&limit=${limit}`);
  return unwrap(res) || [];
}

// Search users
export async function searchUsers(query) {
  const res = await jsonGet(`/auth/search?query=${encodeURIComponent(query)}`);
  return unwrap(res) || [];
}

// Notifications (adjusted paths to avoid double /api)
export async function getNotifications() {
  const res = await jsonGet('/notifications');
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
}

export async function getUnreadCount() {
  const res = await jsonGet('/notifications/unread-count');
  const data = unwrap(res);
  if (data && typeof data === 'object' && 'count' in data) return data.count;
  if (typeof data === 'number') return data;
  return 0;
}

export async function markAsRead(notificationId) {
  return unwrap(await jsonPatch(`/notifications/${notificationId}/read`));
}

export async function markAllAsRead() {
  return unwrap(await jsonPatch('/notifications/read-all'));
}

export async function deleteNotification(notificationId) {
  return unwrap(await jsonDelete(`/notifications/${notificationId}`));
}

// Friend interactions (use jsonPost so it isn't unused)
export function sendFriendInvite(email) {
  return jsonPost('/friends/invite', { email });
}

export function acceptFriendInvite(inviteId) {
  return jsonPost('/friends/accept', { inviteId });
}

export function acceptFriendRequest(requestId) {
  return jsonPost('/friends/requests/accept', { requestId });
}

export function rejectFriendRequest(requestId) {
  return jsonPost('/friends/requests/reject', { requestId });
}

// (Optional future) create notification endpoint placeholder
export function createNotification(payload) {
  // backend currently has no POST /notifications route; will 404 until implemented
  return jsonPost('/notifications', payload);
}
