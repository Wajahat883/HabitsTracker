import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FaChevronDown, FaPalette, FaSignOutAlt, FaHome, FaRegSun, FaListAlt, FaUserFriends, FaCheckCircle, FaFolder, FaPlus } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import UserProfileBadge from '../Components/Common/UserProfileBadge';
import NotificationBell from '../Components/Notifications/NotificationBell';
import image from '../assets/logo-habit-tracker.png';

// Basic sidebar items list (labels used for active state)
const NAV_ITEMS = [
  { label: 'Home', icon: <FaHome />, path: '/home' },
  { label: 'Dashboard', icon: <FaRegSun />, path: '/dashboard' },
  { label: 'Progress', icon: <FaRegSun />, path: '/dashboard#progress' },
  { label: 'Habit Todo', icon: <FaListAlt />, path: '/dashboard#habit-todo' },
  { label: 'Friends', icon: <FaUserFriends />, path: '/dashboard#friends' },
  { label: 'Status', icon: <FaCheckCircle />, path: '/dashboard#status' }
];

export default function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState(()=> {
    try { return JSON.parse(localStorage.getItem('currentUser')) || {}; } catch { return {}; }
  });
  const isAuthenticated = !!localStorage.getItem('authToken');

  useEffect(()=> {
    const loginHandler = (e) => { if(e.detail){ setCurrentUser(e.detail); } };
    const profileHandler = (e) => { if(e.detail){ setCurrentUser(e.detail); } };
    window.addEventListener('userLoggedIn', loginHandler);
    window.addEventListener('profileUpdated', profileHandler);
    return () => { window.removeEventListener('userLoggedIn', loginHandler); window.removeEventListener('profileUpdated', profileHandler); };
  }, []);

  const activeLabel = (() => {
    const item = NAV_ITEMS.find(i => location.pathname === i.path);
    return item ? item.label : 'Home';
  })();

  return (
    <div className="min-h-screen bg-app text-primary">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-surface flex items-center justify-between px-8 shadow-md z-40 border-b border-app">
        <div className="flex items-center gap-3 cursor-pointer" onClick={()=> navigate('/home')}>
          <img src={image} alt="Habit Tracker Logo" className="h-10 w-10" />
          <span className="text-xl font-bold text-blue-400 tracking-tight">HabitTracker</span>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated && <NotificationBell />}
          {isAuthenticated ? (
            <div className="relative">
              <button
                className="flex items-center gap-2 pr-3 pl-1 h-14 rounded-full hover:bg-app-alt transition group"
                onClick={() => setShowProfileDropdown(s=>!s)}
              >
                <UserProfileBadge user={currentUser} size='sm' showEmail={false} />
                <FaChevronDown className={`text-muted text-xs transition-transform group-hover:text-primary ${showProfileDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showProfileDropdown && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-surface rounded-xl shadow-2xl border border-app z-50 overflow-hidden">
                  <div className="p-5 bg-surface border-b border-app">
                    <div className="flex items-center gap-4">
                      <UserProfileBadge user={currentUser} size='md' />
                    </div>
                  </div>
                  <div className="py-2">
                    <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-app-alt transition-colors">
                      <FaPalette className="text-green-400" />
                      <span className="text-primary text-sm font-medium">Theme: {theme === 'dark' ? 'Dark' : 'Light'}</span>
                    </button>
                    <div className="border-t border-app mt-2 pt-2">
                      <button
                        onClick={() => { localStorage.clear(); sessionStorage.clear(); navigate('/login'); window.dispatchEvent(new CustomEvent('userLoggedOut')); }}
                        className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-red-700 transition-colors text-red-400"
                      >
                        <FaSignOutAlt />
                        <span className="text-sm font-medium">Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={()=> navigate('/login')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">Login</button>
              <button onClick={()=> navigate('/signup')} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors">Signup</button>
            </div>
          )}
        </div>
      </nav>

      {/* Sidebar (auth only) */}
      {isAuthenticated && (
        <aside className="fixed top-16 left-0 bottom-0 w-72 bg-app text-primary flex flex-col py-6 px-4 shadow-xl border-r border-app overflow-y-auto app-scrollbar z-30">
          <nav className="mb-6">
            <ul className="space-y-2">
              {NAV_ITEMS.map(item => (
                <li key={item.label}>
                  <button
                    className={`w-full flex items-center gap-3 py-3 px-4 rounded-lg transition font-semibold ${activeLabel === item.label ? 'bg-accent text-primary' : 'hover:bg-accent-soft/40'}`}
                    onClick={()=> navigate(item.path)}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          {/* Placeholder for areas/folders if needed later */}
          <div className="mt-auto text-[10px] text-muted opacity-60 px-2">v1 layout</div>
        </aside>
      )}

      {/* Main content area */}
      <div className={`pt-20 ${isAuthenticated ? 'ml-72' : ''} p-6 min-h-screen`}>
        <Outlet />
      </div>
    </div>
  );
}
