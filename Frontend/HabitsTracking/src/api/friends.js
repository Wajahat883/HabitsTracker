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
  return jsonPost('/friends/request', payload);
}

export function removeFriend(id) {
  return api.delete(`/friends/${id}`).then(response => response.data);
}

export function fetchFriendRequests() {
  return jsonGet('/friends/requests/received');
}

export function acceptFriendRequest(requestId) {
  return api.patch(`/friends/requests/${requestId}`, { action: 'accept' }).then(response => response.data);
}

export function rejectFriendRequest(requestId) {
  return api.patch(`/friends/requests/${requestId}`, { action: 'reject' }).then(response => response.data);
}
