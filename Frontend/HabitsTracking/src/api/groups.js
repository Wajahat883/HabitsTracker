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

async function jsonPatch(path, body) {
  const res = await fetch(`${API_BASE}${path}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error('Request failed');
  return (await res.json()).data;
}

export function fetchGroups() {
  return jsonGet('/api/groups');
}

export function createGroup(name, memberIds) {
  return jsonPost('/api/groups', { name, memberIds });
}

export function addGroupMember(groupId, userId) {
  return jsonPatch(`/api/groups/${groupId}/addMember`, { userId });
}

export function fetchGroupHabits(groupId) {
  return jsonGet(`/api/groups/${groupId}/habits`);
}

export function createGroupHabit(groupId, habitData) {
  return jsonPost(`/api/groups/${groupId}/habits`, habitData);
}

export function fetchGroupProgress(groupId) {
  return jsonGet(`/api/progress/groups/${groupId}`);
}

export function fetchAllUsersProgress() {
  return jsonGet('/api/progress/allUsers');
}

export function fetchFriendProgress(friendId) {
  return jsonGet(`/api/progress/summary?userId=${friendId}`); // assume we add userId param
}
