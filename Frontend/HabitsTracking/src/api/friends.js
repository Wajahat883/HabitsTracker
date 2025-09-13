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

export function fetchFriends() {
  return jsonGet('/api/friends');
}

export function inviteFriend(payload) {
  return jsonPost('/api/friends/invite', payload);
}

export function acceptInvite(inviteId) {
  return jsonPost('/api/friends/accept', { inviteId });
}

export function removeFriend(id) {
  return fetch(`${API_BASE}/api/friends/${id}`, { method: 'DELETE', credentials: 'include' }).then(r => { if(!r.ok) throw new Error('Request failed'); return r.json(); }).then(j=>j.data);
}

export function fetchFriendRequests() {
  return jsonGet('/api/friends/requests');
}

export function acceptFriendRequest(requestId) {
  return jsonPost('/api/friends/requests/accept', { requestId });
}

export function rejectFriendRequest(requestId) {
  return jsonPost('/api/friends/requests/reject', { requestId });
}
