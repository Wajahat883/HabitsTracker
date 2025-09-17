import api from '../config/axios';

async function jsonGet(path) {
  const response = await api.get(path);
  return response.data;
}

async function jsonPost(path, body) {
  const response = await api.post(path, body);
  return response.data;
}

export function fetchFriends() {
  return jsonGet('/friends');
}

export function inviteFriend(payload) {
  return jsonPost('/friends/invite', payload);
}

export function acceptInvite(inviteId) {
  return jsonPost('/friends/accept', { inviteId });
}

export function removeFriend(id) {
  return api.delete(`/friends/${id}`).then(response => response.data);
}

export function fetchFriendRequests() {
  return jsonGet('/friends/requests');
}

export function acceptFriendRequest(requestId) {
  return jsonPost('/friends/requests/accept', { requestId });
}

export function rejectFriendRequest(requestId) {
  return jsonPost('/friends/requests/reject', { requestId });
}
