import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try { 
      // Auto-detect system preference, fallback to light
      const saved = localStorage.getItem('theme');
      if (saved) return saved;
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch { 
      return 'light'; 
    }
  });

  useEffect(()=> {
    const root = document.documentElement;
    // Apply theme using data attribute
    root.setAttribute('data-theme', theme);
    // Also set class for backward compatibility
    root.classList.remove('theme-dark','theme-light');
    root.classList.add(theme === 'light' ? 'theme-light' : 'theme-dark');
    try { localStorage.setItem('theme', theme); } catch { /* ignore */ }
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), []);
  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Attach hook as a static property to provider export pattern
ThemeProvider.useTheme = () => useContext(ThemeContext); // backward compat
export const useTheme = () => useContext(ThemeContext);
export default ThemeProvider;