import axios from 'axios';
import { toast } from 'react-toastify';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: (import.meta?.env?.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '') + '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor - Add auth token if available
api.interceptors.request.use(
  (config) => {
    // Add auth token from localStorage if available
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle common responses and errors
api.interceptors.response.use(
  (response) => {
    // Show success toast for certain operations
    if (response.config.method !== 'get' && response.data?.message) {
      toast.success(response.data.message);
    }
    return response;
  },
  (error) => {
    // Handle common error responses
    let errorMessage = 'An error occurred';
    
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          errorMessage = data?.message || 'Bad Request';
          break;
        case 401: {
          errorMessage = data?.message || 'Unauthorized - Please login again';
          // Clear stored auth artifacts (aligned with AuthContext keys)
          localStorage.removeItem('authToken');
          sessionStorage.removeItem('authToken');
          localStorage.removeItem('userProfile');
          sessionStorage.removeItem('userProfile');
          // Avoid redirect loop if already at login/signup
          const path = window.location.pathname;
          if (!/\/login|\/signup/i.test(path)) {
            // Use replace to avoid polluting history
            window.location.replace('/login');
          }
          break; }
        case 403:
          errorMessage = 'Forbidden - You don\'t have permission';
          break;
        case 404:
          errorMessage = 'Resource not found';
          break;
        case 429:
          errorMessage = 'Too many requests - Please wait a moment and try again';
          break;
        case 500:
          errorMessage = 'Server error - Please try again later';
          break;
        default:
          errorMessage = data?.message || `Error ${status}`;
      }
    } else if (error.request) {
      // Request made but no response received
      errorMessage = 'Network error - Please check your connection';
    } else {
      // Something else happened
      errorMessage = error.message || 'An unexpected error occurred';
    }
    
    // Show error toast
    toast.error(errorMessage);
    
    return Promise.reject(error);
  }
);

export default api;