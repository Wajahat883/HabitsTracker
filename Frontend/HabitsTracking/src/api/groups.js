import api from '../config/axios';

async function jsonGet(path) {
  const response = await api.get(path);
  return response.data;
}

async function jsonPost(path, body) {
  const response = await api.post(path, body);
  return response.data;
}

async function jsonPatch(path, body) {
  const response = await api.patch(path, body);
  return response.data;
}

export function fetchGroups() {
  return jsonGet('/groups');
}

export function createGroup(name, memberIds) {
  return jsonPost('/groups', { name, memberIds });
}

export function addGroupMember(groupId, userId) {
  return jsonPatch(`/groups/${groupId}/addMember`, { userId });
}

export function fetchGroupHabits(groupId) {
  return jsonGet(`/groups/${groupId}/habits`);
}

export function createGroupHabit(groupId, habitData) {
  return jsonPost(`/groups/${groupId}/habits`, habitData);
}

export function fetchGroupProgress(groupId) {
  return jsonGet(`/progress/groups/${groupId}`);
}

export function fetchAllUsersProgress() {
  return jsonGet('/progress/allUsers');
}

export function fetchFriendProgress(friendId) {
  return jsonGet(`/progress/summary?userId=${friendId}`); // assume we add userId param
}
