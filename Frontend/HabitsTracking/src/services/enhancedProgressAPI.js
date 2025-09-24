import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Enhanced Progress API service
export const enhancedProgressAPI = {
  // Get enhanced user stats with detailed streak tracking
  getEnhancedStats: async (range = '30d') => {
    try {
      const response = await api.get(`/progress/enhanced?range=${range}`);
      return response.data;
    } catch (error) {
      // Don't spam console with network errors when backend is unavailable
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        throw new Error('Backend unavailable');
      }
      console.error('Error fetching enhanced stats:', error);
      throw error;
    }
  },

  // Get streak milestones for user
  getStreakMilestones: async () => {
    try {
      const response = await api.get('/progress/milestones');
      return response.data;
    } catch (error) {
      console.error('Error fetching streak milestones:', error);
      // Return empty array if endpoint doesn't exist yet
      return { data: [] };
    }
  },

  // Record milestone achievement
  recordMilestone: async (milestoneData) => {
    try {
      const response = await api.post('/progress/milestones', milestoneData);
      return response.data;
    } catch (error) {
      console.error('Error recording milestone:', error);
      throw error;
    }
  },

  // Get user's streak history
  getStreakHistory: async (days = 30) => {
    try {
      const response = await api.get(`/progress/streak-history?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching streak history:', error);
      throw error;
    }
  },

  // Update user preferences for streak tracking
  updateStreakPreferences: async (preferences) => {
    try {
      const response = await api.patch('/progress/preferences', preferences);
      return response.data;
    } catch (error) {
      console.error('Error updating streak preferences:', error);
      throw error;
    }
  }
};

// Sync local streak data with backend
export const syncStreakData = async (localStats) => {
  try {
    // Get fresh data from backend
    const backendStats = await enhancedProgressAPI.getEnhancedStats();
    
    // Ensure arrays exist
    const localMilestones = Array.isArray(localStats?.milestones) ? localStats.milestones : [];
    const backendMilestones = Array.isArray(backendStats?.data?.milestones) ? backendStats.data.milestones : [];
    
    // Merge local and backend data, preferring backend for consistency
    const mergedStats = {
      ...localStats,
      ...backendStats?.data,
      // Keep local milestones that haven't been synced yet
      milestones: [
        ...localMilestones,
        ...backendMilestones
      ].filter((milestone, index, array) => 
        // Remove duplicates based on type and value
        milestone && array.findIndex(m => m && m.type === milestone.type && m.value === milestone.value) === index
      )
    };

    return mergedStats;
  } catch (error) {
    console.warn('Failed to sync with backend, using local data:', error);
    return localStats;
  }
};

// Persist user stats to both localStorage and backend
export const persistUserStats = async (stats) => {
  try {
    // Save to localStorage immediately for offline support
    localStorage.setItem('habitTracker_userStats', JSON.stringify({
      ...stats,
      lastUpdated: new Date().toISOString()
    }));

    // Attempt to sync with backend
    // Note: This would require a backend endpoint to store user preferences/stats
    // For now, we'll just log the attempt
    console.log('User stats persisted locally:', stats);
    
    return true;
  } catch (error) {
    console.error('Error persisting user stats:', error);
    return false;
  }
};

export default enhancedProgressAPI;