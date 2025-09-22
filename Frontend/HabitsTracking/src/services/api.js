import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

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

// Data transformation functions
const transformFrontendToBackend = (frontendHabit) => {
  const backendHabit = {
    title: frontendHabit.name,
    description: frontendHabit.description || '',
    icon: frontendHabit.icon,
    colorTag: frontendHabit.color,
  };

  // Transform habit type to frequency type
  switch (frontendHabit.type) {
    case 'Binary':
      backendHabit.frequencyType = 'daily';
      break;
    case 'Time-based':
      backendHabit.frequencyType = 'daily';
      backendHabit.durationMinutes = frontendHabit.goal || 30;
      break;
    case 'Goal-oriented':
      if (frontendHabit.weeklyGoal) {
        backendHabit.frequencyType = 'weekly';
        backendHabit.timesPerPeriod = frontendHabit.weeklyGoal;
        backendHabit.daysOfWeek = [0, 1, 2, 3, 4, 5, 6]; // All days by default
      } else {
        backendHabit.frequencyType = 'daily';
        backendHabit.targetCount = frontendHabit.dailyGoal || 8;
      }
      break;
    default:
      backendHabit.frequencyType = 'daily';
  }

  return backendHabit;
};

const transformBackendToFrontend = (backendHabit) => {
  const frontendHabit = {
    id: backendHabit._id,
    name: backendHabit.title,
    description: backendHabit.description,
    icon: backendHabit.icon || '🎯',
    color: backendHabit.colorTag || 'blue',
    streak: 0, // Will be calculated separately
    completed: false, // Will be determined by logs
    progress: 0,
    current: 0, // Initialize current progress
  };

  // Transform frequency type to habit type
  switch (backendHabit.frequencyType) {
    case 'daily':
      if (backendHabit.durationMinutes) {
        frontendHabit.type = 'Time-based';
        frontendHabit.goal = backendHabit.durationMinutes;
        frontendHabit.unit = 'minutes';
      } else if (backendHabit.targetCount) {
        frontendHabit.type = 'Goal-oriented';
        frontendHabit.dailyGoal = backendHabit.targetCount;
        frontendHabit.unit = 'tasks'; // Default unit for goal-oriented habits
      } else {
        frontendHabit.type = 'Binary';
        frontendHabit.unit = 'times'; // Default unit for binary habits
      }
      break;
    case 'weekly':
      frontendHabit.type = 'Goal-oriented';
      frontendHabit.weeklyGoal = backendHabit.timesPerPeriod;
      frontendHabit.unit = 'workouts'; // Default unit for weekly habits
      break;
    default:
      frontendHabit.type = 'Binary';
      frontendHabit.unit = 'times'; // Default unit
  }

  return frontendHabit;
};

// Habit API service
export const habitAPI = {
  // Get all habits for the current user
  getAllHabits: async () => {
    try {
      const response = await api.get('/habits');
      const transformedHabits = response.data.data.map(transformBackendToFrontend);
      return { success: true, data: transformedHabits };
    } catch (error) {
      console.error('Error fetching habits:', error);
      throw error;
    }
  },

  // Create a new habit
  createHabit: async (habitData) => {
    try {
      const backendData = transformFrontendToBackend(habitData);
      const response = await api.post('/habits', backendData);
      const transformedHabit = transformBackendToFrontend(response.data.data);
      return { success: true, data: transformedHabit };
    } catch (error) {
      console.error('Error creating habit:', error);
      throw error;
    }
  },

  // Get a specific habit by ID
  getHabit: async (habitId) => {
    try {
      const response = await api.get(`/habits/${habitId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching habit:', error);
      throw error;
    }
  },

  // Update a habit
  updateHabit: async (habitId, updateData) => {
    try {
      const backendData = transformFrontendToBackend(updateData);
      const response = await api.patch(`/habits/${habitId}`, backendData);
      const transformedHabit = transformBackendToFrontend(response.data.data);
      return { success: true, data: transformedHabit };
    } catch (error) {
      console.error('Error updating habit:', error);
      throw error;
    }
  },

  // Delete a habit
  deleteHabit: async (habitId) => {
    try {
      const response = await api.delete(`/habits/${habitId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw error;
    }
  },

  // Archive a habit
  archiveHabit: async (habitId) => {
    try {
      const response = await api.patch(`/habits/${habitId}/archive`);
      return response.data;
    } catch (error) {
      console.error('Error archiving habit:', error);
      throw error;
    }
  },

  // Create or update habit log
  logHabit: async (habitId, logData) => {
    try {
      const response = await api.post(`/habits/${habitId}/logs`, logData);
      return response.data;
    } catch (error) {
      console.error('Error logging habit:', error);
      throw error;
    }
  },

  // Get habit logs
  getHabitLogs: async (habitId) => {
    try {
      const response = await api.get(`/habits/${habitId}/logs`);
      return response.data;
    } catch (error) {
      console.error('Error fetching habit logs:', error);
      throw error;
    }
  },

  // Get habit streak
  getHabitStreak: async (habitId) => {
    try {
      const response = await api.get(`/habits/${habitId}/streak`);
      return response.data;
    } catch (error) {
      console.error('Error fetching habit streak:', error);
      throw error;
    }
  }
};

// User API service
export const userAPI = {
  // Get current user profile
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.patch('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }
};

export default api;