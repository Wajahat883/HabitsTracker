import React, { createContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { isAuthenticated, getAuthToken, getUserProfile, clearAuthData } from '../utils/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Initialize synchronously to avoid blank flash
  const [authenticated, setAuthenticated] = useState(() => isAuthenticated());
  const [user, setUser] = useState(() => getUserProfile());
  const [token, setToken] = useState(() => getAuthToken());
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  const checkAuth = useCallback(() => {
    const authToken = getAuthToken();
    const userProfile = getUserProfile();
    const auth = isAuthenticated();
    if (!mountedRef.current) return;
    setAuthenticated(auth);
    setToken(authToken);
    setUser(userProfile);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV) console.debug('[AuthProvider] mount');
    mountedRef.current = true;
    // Already initialized synchronously; still run to ensure consistency
    checkAuth();

    const handleAuthChange = () => checkAuth();
    const handleLogin = (event) => {
      if (!mountedRef.current) return;
      if (event.detail) {
        setUser(event.detail);
        setAuthenticated(true);
        setToken(getAuthToken());
      }
    };
    const handleLogout = () => {
      if (!mountedRef.current) return;
      setAuthenticated(false);
      setUser(null);
      setToken(null);
    };
    window.addEventListener('authChanged', handleAuthChange);
    window.addEventListener('userLoggedIn', handleLogin);
    window.addEventListener('userLoggedOut', handleLogout);
    return () => {
      if (import.meta.env.DEV) console.debug('[AuthProvider] unmount');
      mountedRef.current = false;
      window.removeEventListener('authChanged', handleAuthChange);
      window.removeEventListener('userLoggedIn', handleLogin);
      window.removeEventListener('userLoggedOut', handleLogout);
    };
  }, [checkAuth]);

  const login = useCallback((userData, authToken) => {
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('userProfile', JSON.stringify(userData));
    setAuthenticated(true);
    setUser(userData);
    setToken(authToken);
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: userData }));
  }, []);

  const logout = useCallback(() => {
    clearAuthData();
    setAuthenticated(false);
    setUser(null);
    setToken(null);
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
  }, []);

  const value = useMemo(() => ({
    authenticated,
    user,
    token,
    loading,
    login,
    logout,
    checkAuth
  }), [authenticated, user, token, loading, login, logout, checkAuth]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;