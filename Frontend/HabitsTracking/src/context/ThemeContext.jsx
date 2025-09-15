import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('theme') || 'dark'; } catch { return 'dark'; }
  });

  useEffect(()=> {
    const root = document.documentElement;
    // ensure only our theme classes exist
    root.classList.remove('theme-dark','theme-light');
    root.classList.add(theme === 'light' ? 'theme-light' : 'theme-dark');
    try { localStorage.setItem('theme', theme); } catch { /* ignore */ }
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const value = { theme, setTheme, toggleTheme };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Attach hook as a static property to provider export pattern
ThemeProvider.useTheme = () => useContext(ThemeContext); // backward compat
export const useTheme = () => useContext(ThemeContext);
export default ThemeProvider;