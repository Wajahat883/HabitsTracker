import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { fetchHabits } from '../api/habits';
import { fetchProgressSummary } from '../api/progress';
import { fetchGroups, fetchGroupProgress, fetchAllUsersProgress } from '../api/groups';
import { fetchFriends } from '../api/friends';

const HabitContext = createContext();

export const HabitProvider = ({ children }) => {
  // State
  const [habits, setHabits] = useState([]);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [editingHabit, setEditingHabit] = useState(null);
  const [habitLoading, setHabitLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friendProgress, setFriendProgress] = useState(null);
  const [groupProgress, setGroupProgress] = useState(null);
  const [allUsersProgress, setAllUsersProgress] = useState([]);
  const [progressSummary, setProgressSummary] = useState(null);
  const [friends, setFriends] = useState([]);
  const [habitListFilter, setHabitListFilter] = useState('active');
  const [lastCreatedHabit, setLastCreatedHabit] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Load habits - stable function
  const loadHabits = useCallback(async () => {
    try {
  const data = await fetchHabits();
  const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : (Array.isArray(data?.habits) ? data.habits : []));
  setHabits(list);
  return list;
    } catch (error) {
      console.error('Failed to load habits:', error);
      setHabits([]);
      return [];
    }
  }, []);

  // Load progress - stable function  
  const loadProgress = useCallback(async () => {
    try {
      const data = await fetchProgressSummary();
      setProgressSummary(data);
      return data;
    } catch (error) {
      console.error('Failed to load progress:', error);
      setProgressSummary(null);
      return null;
    }
  }, []);

  // Load groups - stable function
  const loadGroups = useCallback(async () => {
    try {
      const data = await fetchGroups();
      setGroups(data || []);
      return data;
    } catch (error) {
      console.error('Failed to load groups:', error);
      setGroups([]);
      return [];
    }
  }, []);

  // Load all users - stable function
  const loadAllUsers = useCallback(async () => {
    try {
      const data = await fetchAllUsersProgress();
      setAllUsersProgress(data || []);
      return data;
    } catch (error) {
      console.error('Failed to load all users progress:', error);
      setAllUsersProgress([]);
      return [];
    }
  }, []);

  // Load friends - stable function
  const loadFriends = useCallback(async () => {
    try {
  const data = await fetchFriends();
  const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : (Array.isArray(data?.friends) ? data.friends : []));
  setFriends(list);
  return list;
    } catch (error) {
      console.error('Failed to load friends:', error);
      setFriends([]);
      return [];
    }
  }, []);

  // Fetch group progress
  const fetchGroupProgressData = useCallback(async (groupId) => {
    try {
      const data = await fetchGroupProgress(groupId);
      setGroupProgress(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch group progress:', error);
      setGroupProgress(null);
      return null;
    }
  }, []);

  // Refresh friends
  const refreshFriends = useCallback(async () => {
    return await loadFriends();
  }, [loadFriends]);

  // Update habit locally
  const updateHabitLocal = useCallback((updatedHabit) => {
    setHabits(prevHabits => 
      prevHabits.map(habit => 
        habit._id === updatedHabit._id ? updatedHabit : habit
      )
    );
  }, []);

  // Delete habit locally
  const deleteHabitLocal = useCallback((habitId) => {
    setHabits(prevHabits => prevHabits.filter(habit => habit._id !== habitId));
  }, []);

  // Initialize data once on mount
  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      if (initialized) return;
      
      setHabitLoading(true);
      
      try {
        // Load all data in parallel using direct API calls to avoid dependency issues
        const [habitsResult, progressResult, groupsResult, usersResult, friendsResult] = await Promise.allSettled([
          fetchHabits(),
          fetchProgressSummary(),
          fetchGroups(),
          fetchAllUsersProgress(),
          fetchFriends()
        ]);

        if (isMounted) {
          if (habitsResult.status === 'fulfilled') {
            const h = habitsResult.value;
            const list = Array.isArray(h) ? h : (Array.isArray(h?.data) ? h.data : (Array.isArray(h?.habits) ? h.habits : []));
            setHabits(list);
          }
          if (progressResult.status === 'fulfilled') setProgressSummary(progressResult.value);
          if (groupsResult.status === 'fulfilled') setGroups(groupsResult.value || []);
          if (usersResult.status === 'fulfilled') setAllUsersProgress(usersResult.value || []);
          if (friendsResult.status === 'fulfilled') {
            const f = friendsResult.value;
            const listF = Array.isArray(f) ? f : (Array.isArray(f?.data) ? f.data : (Array.isArray(f?.friends) ? f.friends : []));
            setFriends(listF);
          }
        }
      } catch (error) {
        console.error('Failed to initialize data:', error);
      } finally {
        if (isMounted) {
          setHabitLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeData();

    return () => {
      isMounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Context value - memoized to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    habits,
    selectedHabit,
    editingHabit,
    habitLoading,
    groups,
    selectedGroup,
    selectedFriend,
    friendProgress,
    groupProgress,
    allUsersProgress,
    progressSummary,
    friends,
    habitListFilter,
    lastCreatedHabit,
    setHabits,
    setSelectedHabit,
    setEditingHabit,
    setHabitLoading,
    setGroups,
    setSelectedGroup,
    setSelectedFriend,
    setFriendProgress,
    setGroupProgress,
    setAllUsersProgress,
    setProgressSummary,
    setFriends,
    setHabitListFilter,
    setLastCreatedHabit,
    loadHabits,
    loadProgress,
    loadGroups,
    loadAllUsers,
    loadFriends,
    fetchGroupProgressData,
    refreshFriends,
    updateHabitLocal,
    deleteHabitLocal
  }), [
    habits,
    selectedHabit,
    editingHabit,
    habitLoading,
    groups,
    selectedGroup,
    selectedFriend,
    friendProgress,
    groupProgress,
    allUsersProgress,
    progressSummary,
    friends,
    habitListFilter,
    lastCreatedHabit,
    loadHabits,
    loadProgress,
    loadGroups,
    loadAllUsers,
    loadFriends,
    fetchGroupProgressData,
    refreshFriends,
    updateHabitLocal,
    deleteHabitLocal
  ]);

  return (
    <HabitContext.Provider value={contextValue}>
      {children}
    </HabitContext.Provider>
  );
};

export default HabitContext;