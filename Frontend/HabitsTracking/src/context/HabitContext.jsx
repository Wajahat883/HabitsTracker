import React, { useState, useEffect, useCallback, useRef } from 'react';
import useSocket from './useSocket';
import HabitContext from './HabitContextInternal';
import { fetchHabits } from '../api/habits';
import { fetchProgressSummary } from '../api/progress';
import { fetchGroups, fetchGroupProgress, fetchAllUsersProgress, fetchFriendProgress } from '../api/groups';
import { fetchFriends } from '../api/friends';
import { fetchHabit } from '../api/habits';


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
  const [friends, setFriends] = useState([]);
  const [habitListFilter, setHabitListFilter] = useState('active');
  const [lastCreatedHabit, setLastCreatedHabit] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const { emitHabitUpdate } = useSocket() || {};
  const emitHabitUpdateRef = useRef(emitHabitUpdate);
  
  // Keep the ref updated
  useEffect(() => {
    emitHabitUpdateRef.current = emitHabitUpdate;
  }, [emitHabitUpdate]);

  const loadHabits = useCallback(async (suppressEmit = false) => {
    setHabitLoading(true);
    try {
      const data = await fetchHabits();
      setHabits(data);
      // Broadcast a bulk refresh event for other tabs / friends (minimal payload)
      if (!suppressEmit && emitHabitUpdateRef.current) {
        emitHabitUpdateRef.current('all', { type: 'refresh' });
      }
    } catch (error) {
      console.error('Failed to load habits:', error);
    } finally {
      setHabitLoading(false);
    }
  }, []); // No dependencies to prevent re-renders

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

  // Initial data loading - only run once on mount
  useEffect(() => {
    let isMounted = true;

    const loadAllData = async () => {
      if (!isMounted || dataLoaded) return;
      
      try {
        setHabitLoading(true);
        // Load all data in parallel to reduce API calls
        const [habitsResult, progressResult, groupsResult, usersResult, friendsResult] = await Promise.allSettled([
          fetchHabits(),
          fetchProgressSummary(), 
          fetchGroups(),
          fetchAllUsersProgress(),
          fetchFriends()
        ]);

        if (isMounted) {
          // Handle habits
          if (habitsResult.status === 'fulfilled') {
            setHabits(habitsResult.value);
          }
          
          // Handle progress
          if (progressResult.status === 'fulfilled') {
            setProgressSummary(progressResult.value);
          }
          
          // Handle groups
          if (groupsResult.status === 'fulfilled') {
            setGroups(groupsResult.value);
          }
          
          // Handle users
          if (usersResult.status === 'fulfilled') {
            setAllUsersProgress(usersResult.value);
          }
          
          // Handle friends
          if (friendsResult.status === 'fulfilled') {
            setFriends(friendsResult.value || []);
          } else {
            setFriends([]);
          }
          
          setDataLoaded(true);
          setHabitLoading(false);
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
        if (isMounted) {
          setHabitLoading(false);
        }
      }
    };

    loadAllData();

    return () => {
      isMounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for habit update socket events and patch locally for instant UI
  useEffect(() => {
    const handler = async (e) => {
      const payload = e?.detail || {};
      const { type, habit, habitId } = payload;
      // Diagnostic log
  try { console.debug('[habitUpdated event]', payload); } catch (_e) { /* debug log failed */ }
      try {
        if (type === 'habitCreated' && habit) {
          setHabits(prev => prev.some(h => h._id === habit._id) ? prev : [habit, ...prev]);
          // Verify fresh habit after short delay in case server attaches computed fields
          setTimeout(async () => { try { const fresh = await fetchHabit(habit._id); setHabits(prev => prev.map(h=> h._id===fresh._id? fresh : h)); } catch (_e) { /* ignore verify error */ } }, 800);
        } else if (type === 'habitUpdated' && habit) {
          setHabits(prev => prev.map(h => h._id === habit._id ? habit : h));
          setTimeout(async () => { try { const fresh = await fetchHabit(habit._id); setHabits(prev => prev.map(h=> h._id===fresh._id? fresh : h)); } catch (_e) { /* ignore verify error */ } }, 800);
        } else if (type === 'habitArchived' && habitId) {
          setHabits(prev => prev.filter(h => h._id !== habitId));
        } else if (type === 'habitRestored' && habit) {
          setHabits(prev => prev.some(h => h._id === habit._id) ? prev : [habit, ...prev]);
        } else {
          // Fallback: if payload shape unexpected, perform minimal fetch
          const fresh = await fetchHabits();
          setHabits(fresh);
        }
        // Refresh progress summary in background (non-blocking)
        fetchProgressSummary().then(ps => setProgressSummary(ps)).catch(()=>{});
      } catch (err) {
        console.error('Socket habit patch error:', err);
      }
    };
    window.addEventListener('habitUpdated', handler);
    return () => window.removeEventListener('habitUpdated', handler);
  }, []);

  const refreshFriends = async () => {
    try {
      const f = await fetchFriends();
      setFriends(f || []);
    } catch (err) {
      console.error('Failed to refresh friends:', err);
    }
  };

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
    // convenience mutators for local optimistic updates
    updateHabitLocal: (updated) => setHabits(prev => prev.map(h => h._id === updated._id ? updated : h)),
    deleteHabitLocal: (id) => setHabits(prev => prev.filter(h => h._id !== id)),
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
  habitListFilter,
  setHabitListFilter,
  lastCreatedHabit,
  setLastCreatedHabit,
    loadHabits,
    loadProgress,
    loadGroups,
    loadAllUsers,
    fetchFriendProgressData,
    fetchGroupProgressData,
  refreshFriends
  };

  return <HabitContext.Provider value={value}>{children}</HabitContext.Provider>;
};
