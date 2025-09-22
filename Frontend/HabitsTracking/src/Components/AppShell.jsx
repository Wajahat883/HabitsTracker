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
    <div className="min-h-screen relative bg-neutral-50 dark:bg-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-50 via-neutral-100 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/30 via-transparent to-purple-50/30 dark:from-blue-900/20 dark:via-transparent dark:to-purple-900/20"></div>
      </div>

      {/* Modern Topbar */}
      <nav className="fixed top-0 left-0 right-0 h-16 glass-morphism flex items-center justify-between px-4 md:px-8 z-40" style={{background: 'var(--glass-bg)', borderBottom: '1px solid var(--glass-border)'}}>
        <div 
          className="flex items-center gap-3 cursor-pointer select-none interactive" 
          onClick={() => { navigate('/app/home'); closeSidebar(); }}
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <img src={image} alt="Habit Tracker Logo" className="relative h-10 w-10 rounded-xl" />
          </div>
          <span className="text-2xl font-bold text-gradient tracking-tight">
            HabitTracker
          </span>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          {isAuthenticated && <NotificationBell />}
          
          {isAuthenticated ? (
            <div className="relative">
              <button
                className="flex items-center gap-2 px-3 py-2 rounded-2xl glass-morphism hover-lift focus-ring transition-all duration-300 group"
                style={{background: 'var(--glass-bg)', border: '1px solid var(--glass-border)'}}
                onClick={() => setShowProfileDropdown(s => !s)}
                aria-label="User menu"
              >
                <UserProfileBadge user={currentUser} size='sm' showEmail={false} />
                <FaChevronDown className={`text-slate-500 dark:text-neutral-400 text-xs transition-all duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 ${showProfileDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showProfileDropdown && (
                <div className="absolute right-0 top-full mt-3 w-80 glass-morphism rounded-3xl z-50 overflow-hidden animate-slide-up backdrop-blur-xl" style={{background: 'var(--glass-bg)', border: '1px solid var(--glass-border)'}}>
                  <div className="p-6 border-b border-slate-200/50 dark:border-white/10">
                    <div className="flex items-center gap-4">
                      <UserProfileBadge user={currentUser} size='md' />
                    </div>
                  </div>
                  
                  <div className="py-3">
                    <button 
                      onClick={toggleTheme} 
                      className="w-full flex items-center gap-4 px-6 py-4 text-left transition-all duration-300 interactive"
                      style={{'--hover-bg': 'var(--color-bg-elevated)'}}
                      onMouseEnter={(e) => e.target.style.background = 'var(--color-bg-elevated)'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center">
                        <FaPalette className="text-white text-sm" />
                      </div>
                      <div>
                        <div className="text-slate-800 dark:text-white font-medium">Theme Settings</div>
                        <div className="text-slate-500 dark:text-neutral-400 text-sm">Currently: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
                      </div>
                    </button>
                    
                    <div className="border-t border-slate-200/50 dark:border-white/10 mt-3 pt-3">
                      <button
                        onClick={() => { 
                          localStorage.clear(); 
                          sessionStorage.clear(); 
                          navigate('/login'); 
                          window.dispatchEvent(new CustomEvent('userLoggedOut')); 
                        }}
                        className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-300 interactive group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center group-hover:animate-bounce-in">
                          <FaSignOutAlt className="text-white text-sm" />
                        </div>
                        <div>
                          <div className="text-red-600 dark:text-red-400 font-medium group-hover:text-red-700 dark:group-hover:text-red-300">Sign Out</div>
                          <div className="text-slate-500 dark:text-neutral-500 text-sm">See you later!</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/login')} 
                className="btn btn-ghost hover-scale focus-ring"
              >
                Login
              </button>
              <button 
                onClick={() => navigate('/signup')} 
                className="btn btn-accent hover-scale focus-ring"
              >
                Get Started
              </button>
            </div>
          )}
          
          {/* Mobile Menu Toggle */}
          {isAuthenticated && (
            <button 
              className="md:hidden p-3 rounded-2xl glass-morphism hover-lift focus-ring transition-all duration-300" 
              onClick={handleSidebarToggle} 
              aria-label="Toggle sidebar"
            >
              <FaBars className="text-xl text-blue-400" />
            </button>
          )}
        </div>
      </nav>

      {/* Backdrop overlay for mobile sidebar */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          sidebarOpen ? 'block md:hidden opacity-100' : 'hidden opacity-0'
        }`} 
        onClick={closeSidebar} 
      />

      {/* Modern Sidebar */}
      {isAuthenticated && (
        <aside className={`fixed top-16 left-0 bottom-0 w-80 glass-morphism flex flex-col py-8 px-6 overflow-y-auto scrollbar-thin z-50 transform transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:z-30`}
        style={{background: 'var(--glass-bg)', borderRight: '1px solid var(--glass-border)'}}>
          
          {/* Mobile Close Button */}
          <button 
            className="md:hidden absolute top-6 right-6 p-2 rounded-2xl glass-morphism hover-lift focus-ring transition-all duration-300"
            style={{background: 'var(--glass-bg)', border: '1px solid var(--glass-border)'}} 
            onClick={closeSidebar} 
            aria-label="Close sidebar"
          >
            <FaTimes className="text-xl text-blue-600 dark:text-blue-400" />
          </button>

          {/* Navigation */}
          <nav className="flex-1 space-y-3">
            <div className="mb-8">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-4 px-3">
                Navigation
              </h3>
              
              <ul className="space-y-1">
                {NAV_ITEMS.map((item, index) => {
                  const isActive = activeLabel === item.label;
                  return (
                    <li key={item.label}>
                      <button
                        className={`w-full flex items-center gap-4 py-4 px-4 rounded-2xl transition-all duration-300 font-medium group ${
                          isActive 
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-[1.02]' 
                            : 'text-slate-600 dark:text-neutral-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-white/5 hover-lift'
                        }`}
                        onClick={() => {
                          navigate(item.path.split('#')[0]);
                          closeSidebar();
                          if (item.path.includes('#')) {
                            const hash = item.path.split('#')[1];
                            const map = { 
                              'progress': 'Progress', 
                              'habit-todo': 'Habit Todo', 
                              'social-hub': 'Social Hub', 
                              'friends': 'Friends', 
                              'status': 'Status' 
                            };
                            const section = map[hash];
                            if (section) {
                              setTimeout(() => window.dispatchEvent(new CustomEvent('dashboardSectionChange', { detail: section })), 0);
                            }
                          } else if (item.label === 'Dashboard') {
                            setTimeout(() => window.dispatchEvent(new CustomEvent('dashboardSectionChange', { detail: 'Dashboard' })), 0);
                          }
                        }}
                        style={{animationDelay: `${index * 50}ms`}}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          isActive 
                            ? 'bg-white/20 text-white shadow-inner' 
                            : 'bg-slate-100/50 dark:bg-white/5 text-slate-500 dark:text-neutral-400 group-hover:bg-slate-200/50 dark:group-hover:bg-white/10 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                        }`}>
                          <span className="text-lg">{item.icon}</span>
                        </div>
                        <span className="text-sm font-medium">{item.label}</span>
                        
                        {/* Active indicator */}
                        {isActive && (
                          <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse-glow"></div>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>
          
          {/* Footer */}
          <div className="mt-auto pt-6 border-t border-slate-200/50 dark:border-white/10">
            <div className="glass-morphism rounded-2xl p-4 text-center bg-slate-50/50 dark:bg-slate-700/30 border border-slate-200/50 dark:border-white/10">
              <div className="text-xs text-slate-500 dark:text-neutral-400 mb-2">Powered by</div>
              <div className="text-sm font-bold text-gradient">Modern UI System</div>
              <div className="text-xs text-slate-400 dark:text-neutral-500 mt-1">v2.0</div>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Area */}  
      <div className={`relative z-10 pt-20 transition-all duration-300 ${
        isAuthenticated ? 'md:ml-80' : ''
      } p-6 md:p-8 min-h-screen`}>
        <div className="max-w-7xl mx-auto">
          <Routes>
            <Route path="/home" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/*" element={<Navigate to="/home" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
