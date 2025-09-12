import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchHabits } from '../api/habits';
import { fetchProgressSummary } from '../api/progress';
import { fetchGroups, fetchGroupProgress, fetchAllUsersProgress, fetchFriendProgress } from '../api/groups';

const HabitContext = createContext();

export const useHabitContext = () => useContext(HabitContext);

export const HabitProvider = ({ children }) => {
  const [habits, setHabits] = useState([]);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [editingHabit, setEditingHabit] = useState(null);
  const [habitLoading, setHabitLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friendProgress, setFriendProgress] = useState(null);
  const [groupProgress, setGroupProgress] = useState(null);
  const [allUsersProgress, setAllUsersProgress] = useState([]);
  const [progressSummary, setProgressSummary] = useState(null);
  const [friends, setFriends] = useState([{ _id: '1', name: 'Alice' }, { _id: '2', name: 'Bob' }]); // Dummy for now

  const loadHabits = async () => {
    setHabitLoading(true);
    try {
      const data = await fetchHabits();
      setHabits(data);
    } catch (error) {
      console.error('Failed to load habits:', error);
    } finally {
      setHabitLoading(false);
    }
  };

  const loadProgress = async () => {
    try {
      const data = await fetchProgressSummary();
      setProgressSummary(data);
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  const loadGroups = async () => {
    try {
      const data = await fetchGroups();
      setGroups(data);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  const loadAllUsers = async () => {
    try {
      const data = await fetchAllUsersProgress();
      setAllUsersProgress(data);
    } catch (error) {
      console.error('Failed to load all users progress:', error);
    }
  };

  const fetchGroupProgressData = async (groupId) => {
    try {
      const data = await fetchGroupProgress(groupId);
      setGroupProgress(data);
    } catch (error) {
      console.error('Failed to fetch group progress:', error);
      setGroupProgress(null);
    }
  };

  useEffect(() => {
    loadHabits();
    loadProgress();
    loadGroups();
    loadAllUsers();
  }, []);

  const fetchFriendProgressData = async (friendId) => {
    try {
      const data = await fetchFriendProgress(friendId);
      setFriendProgress(data);
    } catch (error) {
      console.error('Failed to fetch friend progress:', error);
      setFriendProgress(null);
    }
  };

  const value = {
    habits,
    setHabits,
    selectedHabit,
    setSelectedHabit,
    editingHabit,
    setEditingHabit,
    habitLoading,
    groups,
    setGroups,
    selectedGroup,
    setSelectedGroup,
    selectedFriend,
    setSelectedFriend,
    friendProgress,
    setFriendProgress,
    groupProgress,
    setGroupProgress,
    allUsersProgress,
    progressSummary,
    setProgressSummary,
    friends,
    loadHabits,
    loadProgress,
    loadGroups,
    loadAllUsers,
    fetchFriendProgressData,
    fetchGroupProgressData,
  };

  return (
    <HabitContext.Provider value={value}>
      {children}
    </HabitContext.Provider>
  );
};
