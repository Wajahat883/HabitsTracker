// Authentication utility functions
export const isAuthenticated = () => {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  return !!token;
};

export const getAuthToken = () => {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
};

export const getUserProfile = () => {
  try {
    const profile = localStorage.getItem('userProfile') || sessionStorage.getItem('userProfile');
    return profile ? JSON.parse(profile) : null;
  } catch (error) {
    console.error('Error parsing user profile:', error);
    return null;
  }
};

export const clearAuthData = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userProfile');
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('userProfile');
};