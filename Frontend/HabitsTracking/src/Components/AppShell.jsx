import React, { useEffect, useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { FaChevronDown, FaPalette, FaSignOutAlt, FaHome, FaRegSun, FaListAlt, FaUserFriends, FaCheckCircle, FaFolder, FaPlus } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/useAuth';
import UserProfileBadge from '../Components/Common/UserProfileBadge';
import NotificationBell from '../Components/Notifications/NotificationBell';
import Home from '../Pages/Home';
import Dashboard from '../Pages/Dashboard';
import image from '../assets/logo-habit-tracker.png';

// Basic sidebar items list (labels used for active state)
const NAV_ITEMS = [
  { label: 'Home', icon: <FaHome />, path: '/app/home' },
  { label: 'Dashboard', icon: <FaRegSun />, path: '/app/dashboard' },
  { label: 'Progress', icon: <FaRegSun />, path: '/app/dashboard#progress' },
  { label: 'Habit Todo', icon: <FaListAlt />, path: '/app/dashboard#habit-todo' },
  { label: 'Social Hub', icon: <FaUserFriends />, path: '/app/dashboard#social-hub' },
  { label: 'Friends', icon: <FaUserFriends />, path: '/app/dashboard#friends' },
  { label: 'Status', icon: <FaCheckCircle />, path: '/app/dashboard#status' }
];

export default function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const { authenticated: isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(()=> {
    try { return JSON.parse(localStorage.getItem('currentUser')) || {}; } catch { return {}; }
  });

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

  // Responsive sidebar toggle
  const handleSidebarToggle = () => setSidebarOpen(v => !v);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* Topbar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-[var(--color-bg-alt)] flex items-center justify-between px-4 md:px-8 shadow-md z-40 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={()=> {navigate('/home'); closeSidebar();}}>
          <img src={image} alt="Habit Tracker Logo" className="h-10 w-10 rounded-lg shadow" />
          <span className="text-2xl font-extrabold text-blue-400 tracking-tight">HabitTracker</span>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {isAuthenticated && <NotificationBell />}
          {isAuthenticated ? (
            <div className="relative">
              <button
                className="flex items-center gap-2 pr-3 pl-1 h-12 rounded-full hover:bg-[var(--color-bg)] transition group"
                onClick={() => setShowProfileDropdown(s=>!s)}
                aria-label="User menu"
              >
                <UserProfileBadge user={currentUser} size='sm' showEmail={false} />
                <FaChevronDown className={`text-muted text-xs transition-transform group-hover:text-primary ${showProfileDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showProfileDropdown && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-[var(--color-bg-alt)] rounded-xl shadow-2xl border border-[var(--color-border)] z-50 overflow-hidden animate-fadein">
                  <div className="p-5 border-b border-[var(--color-border)]">
                    <div className="flex items-center gap-4">
                      <UserProfileBadge user={currentUser} size='md' />
                    </div>
                  </div>
                  <div className="py-2">
                    <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-[var(--color-bg)] transition-colors">
                      <FaPalette className="text-green-400" />
                      <span className="text-primary text-sm font-medium">Theme: {theme === 'dark' ? 'Dark' : 'Light'}</span>
                    </button>
                    <div className="border-t border-[var(--color-border)] mt-2 pt-2">
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
              <button onClick={()=> navigate('/login')} className="btn">Login</button>
              <button onClick={()=> navigate('/signup')} className="btn btn-success">Signup</button>
            </div>
          )}
          {/* Sidebar toggle for mobile */}
          {isAuthenticated && (
            <button className="md:hidden ml-2 p-2 rounded-lg hover:bg-[var(--color-bg)] transition" onClick={handleSidebarToggle} aria-label="Open sidebar">
              <FaBars className="text-2xl text-blue-400" />
            </button>
          )}
        </div>
      </nav>

      {/* Sidebar (auth only, responsive/collapsible) */}
      {isAuthenticated && (
        <>
          {/* Overlay for mobile */}
          <div className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-200 ${sidebarOpen ? 'block md:hidden opacity-100' : 'hidden opacity-0'}`} onClick={closeSidebar} />
          <aside className={`fixed top-16 left-0 bottom-0 w-72 bg-[var(--color-bg-alt)] text-[var(--color-text)] flex flex-col py-6 px-4 shadow-xl border-r border-[var(--color-border)] overflow-y-auto app-scrollbar z-50 transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-80'} md:translate-x-0 md:z-30`}>
            <button className="md:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-[var(--color-bg)] transition" onClick={closeSidebar} aria-label="Close sidebar">
              <FaTimes className="text-2xl text-blue-400" />
            </button>
            <nav className="mb-6 mt-2">
              <ul className="space-y-2">
                {NAV_ITEMS.map(item => (
                  <li key={item.label}>
                    <button
                      className={`w-full flex items-center gap-3 py-3 px-4 rounded-lg transition font-semibold text-lg ${activeLabel === item.label ? 'bg-[var(--color-accent)] text-[var(--color-bg)] shadow' : 'hover:bg-[var(--color-accent)]/30'}`}
                      onClick={()=> {
                        navigate(item.path.split('#')[0]);
                        closeSidebar();
                        if(item.path.includes('#')){
                          const hash = item.path.split('#')[1];
                          // map hash to section label inside Dashboard
                          const map = { 'progress':'Progress', 'habit-todo':'Habit Todo', 'social-hub':'Social Hub', 'friends':'Friends', 'status':'Status' };
                          const section = map[hash];
                          if(section){
                            setTimeout(()=> window.dispatchEvent(new CustomEvent('dashboardSectionChange', { detail: section })), 0);
                          }
                        } else if(item.label==='Dashboard') {
                          setTimeout(()=> window.dispatchEvent(new CustomEvent('dashboardSectionChange', { detail: 'Dashboard' })),0);
                        }
                      }}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            
            <div className="mt-auto text-xs text-muted opacity-60 px-2">Modern UI</div>
          </aside>
        </>
      )}

      {/* Main content area */}
      <div className={`pt-20 transition-all duration-200 ${isAuthenticated ? 'md:ml-72' : ''} p-4 md:p-8 min-h-screen bg-[var(--color-bg)]`}> 
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/*" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
    </div>
  );
}
