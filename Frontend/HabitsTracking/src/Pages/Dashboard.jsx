import React, { useState, useEffect } from "react";
import { useChartData } from "../context/useChartData";
import { useHabitContext } from "../context/useHabitContext";
import HabitForm from "../Components/Habits/HabitForm";
import HabitList from "../Components/Habits/HabitList";
import HabitTracker from "../Components/Habits/HabitTracker";
import NotificationBell from "../Components/Notifications/NotificationBell";
import UserSearch from "../Components/Friends/UserSearch";
import AllUsersList from "../Components/Friends/AllUsersList";
import SocialFeaturesTest from "../Components/Common/SocialFeaturesTest";
import TaskCompletion from "../Components/Progress/TaskCompletion";
import TaskProgressWidget from "../Components/Common/TaskProgressWidget";
// Area manager feature (re-added per new requirements)
import AreaManagerModal from "../Components/Areas/AreaManagerModal";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { FaHome, FaListAlt, FaSun, FaRegSun, FaMoon, FaPlus, FaInfinity, FaPause, FaCreditCard, FaCog, FaLink, FaUserFriends, FaCheckCircle, FaFolder, FaUsers, FaChevronDown, FaUser, FaPalette, FaSignOutAlt } from "react-icons/fa";
import HabitTodo from "../Components/Habits/HabitTodo";
import ProfileSettingsForm from '../Components/Profile/ProfileSettingsForm';
import image from '../assets/logo-habit-tracker.png';
import UserProfileBadge from '../Components/Common/UserProfileBadge';
import ProgressSummary from "../Components/Progress/ProgressSummary";
import HabitTrendChart from "../Components/Progress/HabitTrendChart";
import CalendarHeatmap from "../Components/Progress/CalendarHeatmap";
import GroupForm from "../Components/Groups/GroupForm";
import ProfilePage from "../Components/Profile/ProfilePage";
import FriendsList from "../Components/Friends/FriendsList";
import InviteFriends from "../Components/Friends/InviteFriends";
import Login from "../Components/Auth/Login";
import Signup from "../Components/Auth/Signup";
import { fetchFriendsProgress } from "../api/progress";
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const sidebarItems = [
  { label: "Dashboard", icon: <FaHome /> },
  { label: "Progress", icon: <FaRegSun /> },
  { label: "Habits", icon: <FaInfinity /> },
  { label: "Habit Todo", icon: <FaListAlt /> },
  { label: "Off Mode", icon: <FaPause /> },
  { label: "Payment", icon: <FaCreditCard /> },
  // Removed App Settings from sidebar; now inside profile dropdown
  { label: "Resources", icon: <FaLink /> },
  { label: "Friends", icon: <FaUserFriends /> },
  { label: "Status", icon: <FaCheckCircle /> },
];

// Example data for user, friend, and comparison
// ...existing code...

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { labels: { color: "#fff" } },
    title: {
      display: false,
    },
  },
  scales: {
    x: {
      grid: { color: "#334155" },
      ticks: { color: "#fff" },
    },
    y: {
      grid: { color: "#334155" },
      ticks: { color: "#fff" },
    },
  },
};


const Dashboard = () => {
  const [activeSection, setActiveSection] = useState("Dashboard");
  // Areas local state (persist in localStorage)
  const [areas, setAreas] = useState(() => {
    try {
      const raw = localStorage.getItem('habitTracker_areas_v2');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [showAreaManager, setShowAreaManager] = useState(false);
  // activeArea no longer needed; derive from activeSection when needed
  const setActiveArea = () => {};
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [isValidatingSession, setIsValidatingSession] = useState(true);
  const [currentUser, setCurrentUser] = useState(() => {
    // Try to load from localStorage immediately
    try {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        console.log('Loading user on init:', userData);
        return userData;
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
    }
    return {
      name: "",
      profilePicture: null,
      email: null
    };
  });
  
  // Auth & view state
  const [activeView, setActiveView] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const user = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
      return !!token || !!user; // initial optimistic flag
    } catch { return false; }
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const { compareData, setFriendData, setCompareData } = useChartData();
  const {
    habits,
  // setHabits,
    selectedHabit,
    setSelectedHabit,
  // editingHabit,
  // setEditingHabit,
  // habitLoading,
    groups,
  // setGroups,
    selectedGroup,
    setSelectedGroup,
    selectedFriend,
    setSelectedFriend,
    friendProgress,
    setFriendProgress,
    groupProgress,
    setGroupProgress,
    allUsersProgress,
    progressSummary,
  // setProgressSummary,
    friends,
    loadHabits,
    fetchFriendProgressData,
    fetchGroupProgressData,
  } = useHabitContext();

  // Update charts with real data including friends and groups
  useEffect(() => {
    if (!progressSummary) return;
    const habitStreaks = progressSummary.habitStreaks || [];
    const userLabels = habitStreaks.map(h => h.title);
    const userData = habitStreaks.map(h => h.streak);

    // Prepare datasets for comparison chart
    const datasets = [
      {
        label: 'Your Streaks',
        data: userData,
        backgroundColor: '#38bdf8',
        borderRadius: 8
      }
    ];

    // Add friend data if available
    if (friendProgress?.habitStreaks) {
  // const friendLabels = friendProgress.habitStreaks.map(h => h.title); // unused
      const friendData = friendProgress.habitStreaks.map(h => h.streak);
      datasets.push({
        label: 'Friend\'s Streaks',
        data: friendData,
        backgroundColor: '#f59e0b',
        borderRadius: 8
      });
    }

    // Add group data if available
    if (groupProgress?.habitStreaks) {
  // const groupLabels = groupProgress.habitStreaks.map(h => h.title); // unused
      const groupData = groupProgress.habitStreaks.map(h => h.streak);
      datasets.push({
        label: 'Group Streaks',
        data: groupData,
        backgroundColor: '#10b981',
        borderRadius: 8
      });
    }

    // Update friendData chart to show comparison
    const friendDatasets = [
      {
        label: 'Your Streaks',
        data: userData,
        backgroundColor: '#38bdf8',
        borderRadius: 8
      }
    ];

    // Add friend data to second chart if selected
    if (selectedFriend && friendProgress?.habitStreaks) {
      const friendData = friendProgress.habitStreaks.map(h => h.streak);
      friendDatasets.push({
        label: 'Friend\'s Streaks',
        data: friendData,
        backgroundColor: '#f59e0b',
        borderRadius: 8
      });
    }

    // Add group data to second chart if selected
    if (selectedGroup && groupProgress?.habitStreaks) {
      const groupData = groupProgress.habitStreaks.map(h => h.streak);
      friendDatasets.push({
        label: 'Group Streaks',
        data: groupData,
        backgroundColor: '#10b981',
        borderRadius: 8
      });
    }

    setFriendData({
      labels: userLabels,
      datasets: friendDatasets
    });

    // Update compareData to show comparison with friends/groups
    setCompareData({
      labels: userLabels, // Use your habit names as base
      datasets: datasets
    });
  }, [progressSummary, friendProgress, groupProgress, selectedFriend, selectedGroup, setFriendData, setCompareData]);

  // Friends progress (aggregate) for All Friends bar chart
  const [friendsProgress, setFriendsProgress] = useState([]);
  useEffect(() => {
    if (friends.length === 0) { setFriendsProgress([]); return; }
    let ignore = false;
    fetchFriendsProgress('30d').then(data => { if(!ignore) setFriendsProgress(data || []); }).catch(()=>{});
    return () => { ignore = true; };
  }, [friends.length]);

  // Persist areas
  useEffect(() => {
    try { localStorage.setItem('habitTracker_areas_v2', JSON.stringify(areas)); } catch { /* ignore persist errors */ }
  }, [areas]);

  // Load user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        // Check localStorage first for cached user data
        const savedUser = localStorage.getItem('currentUser');
        console.log('Saved user from localStorage:', savedUser);
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          console.log('Parsed user data:', userData);
          setCurrentUser(userData);
        }

        // Try to fetch fresh data from server
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${API_URL}/api/auth/profile`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('User profile data received:', userData);
          const userProfile = {
            name: userData.username || userData.name || "",
            profilePicture: userData.profilePicture || userData.picture || null,
            email: userData.email || null
          };
          console.log('Setting user profile:', userProfile);
          setCurrentUser(userProfile);
          localStorage.setItem('currentUser', JSON.stringify(userProfile));
        }
      } catch (error) {
        console.log('User profile fetch failed:', error);
        // Keep empty data if fetch fails
      }
    };

    loadUserProfile();

    // Listen for profile updates
    const handleProfileUpdate = (event) => {
      setCurrentUser(event.detail);
    };

    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('userProfileUpdated', handleProfileUpdate);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.relative')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileDropdown]);

  // Load theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('light-theme', savedTheme === 'light');
  }, []);

  // Load user from localStorage on mount and listen for auth events
  useEffect(() => {
  const validateUserSession = async () => {
      const savedUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
      const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      if (savedUser && authToken) {
        try {
          const userData = JSON.parse(savedUser);
          console.log('Validating user session:', userData);
          
          // Try to validate token with backend
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/validate`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            console.log('[SESSION] /validate OK');
            const raw = await response.json();
            // Backend wraps payload: { statuscode, data: { user, accessToken? }, message }
            const payload = raw?.data?.user ? raw.data : raw; // fall back if already unwrapped
            const apiUser = payload.user;
            let canonical = userData;
            if (apiUser) {
              console.log('[SESSION] validate user payload (unwrapped):', apiUser);
              canonical = {
                name: apiUser.name || apiUser.username || userData.name,
                email: apiUser.email || userData.email,
                profilePicture: apiUser.profilePicture || apiUser.picture || userData.profilePicture || null
              };
              localStorage.setItem('currentUser', JSON.stringify(canonical));
              sessionStorage.setItem('currentUser', JSON.stringify(canonical));
            }
            setCurrentUser(canonical);
            setActiveView('dashboard');
            setIsAuthenticated(true);
          } else {
            console.log('Invalid session, clearing data');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('currentUser');
            sessionStorage.removeItem('authToken');
            setActiveView('login');
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Session validation failed (network or parse):', error);
          // If validation fails, still use local data but with caution
          const userData = JSON.parse(savedUser);
          setCurrentUser(userData);
          setActiveView('dashboard');
          setIsAuthenticated(true);
        }
      } else if (savedUser) {
        // No token but has user data - set user but might need re-auth later
        try {
          const userData = JSON.parse(savedUser);
          console.log('Loading user without token:', userData);
          setCurrentUser(userData);
          setActiveView('dashboard');
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing saved user:', error);
          setActiveView('login');
          setIsAuthenticated(false);
        }
      } else {
        console.log('No saved user data found');
        setActiveView('login');
        setIsAuthenticated(false);
      }
      
      setIsValidatingSession(false);
    };

    validateUserSession();

    // Listen for profile updates
    const handleProfileUpdate = (event) => {
      console.log('Profile update event received:', event.detail);
      setCurrentUser(event.detail);
    };

    // Listen for login events
    const handleLogin = (event) => {
      console.log('Login event received:', event.detail);
      if (event.detail) setCurrentUser(prev => ({ ...prev, ...event.detail }));
      setActiveView('dashboard');
      setIsAuthenticated(true);
    };

    // Listen for logout events
    const handleLogout = () => {
      console.log('Logout event received');
      setCurrentUser({ name: "", profilePicture: null, email: null });
      setActiveView('login');
      setIsAuthenticated(false);
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('userLoggedIn', handleLogin);
    window.addEventListener('userLoggedOut', handleLogout);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('userLoggedIn', handleLogin);
      window.removeEventListener('userLoggedOut', handleLogout);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 overflow-auto scrollbar-custom">
      {isValidatingSession ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white text-xl">Loading...</div>
        </div>
      ) : (
        <>
          {/* Fixed Navbar - Hidden on auth pages */}
          {activeView === 'dashboard' && (
          <nav className="fixed top-0 left-0 right-0 h-16 bg-slate-800 flex items-center justify-between px-8 shadow-md z-40 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <img src={image} alt="Habit Tracker Logo" className="h-10 w-10" />
              <span className="text-xl font-bold text-blue-400 tracking-tight">HabitTracker</span>
            </div>
            <div className="flex items-center gap-4">
              {/* Removed New Area button from navbar per updated requirements */}
              {/* Show NotificationBell only when logged in and in dashboard view */}
              {activeView === 'dashboard' && isAuthenticated && (
                <NotificationBell />
              )}

              {/* User Profile Section or Auth Buttons */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    className="flex items-center gap-2 pr-3 pl-1 h-14 rounded-full hover:bg-slate-700 transition group"
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  >
                    <UserProfileBadge user={currentUser} size='sm' showEmail={false} />
                    <FaChevronDown className={`text-slate-400 text-xs transition-transform group-hover:text-white ${showProfileDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showProfileDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 z-50 overflow-hidden">
                      <div className="p-5 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-slate-700">
                        <div className="flex items-center gap-4">
                          <UserProfileBadge user={currentUser} size='md' />
                        </div>
                      </div>
                      <div className="py-2">
                        <button
                          onClick={() => { setActiveSection('Profile'); setActiveView('dashboard'); setShowProfileDropdown(false); }}
                          className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-slate-700 transition-colors"
                        >
                          <FaUser className="text-blue-400" />
                          <span className="text-white text-sm font-medium">Profile</span>
                        </button>
                        <button
                          onClick={() => { const newTheme = theme === 'dark' ? 'light' : 'dark'; setTheme(newTheme); localStorage.setItem('theme', newTheme); document.documentElement.classList.toggle('light-theme', newTheme === 'light'); }}
                          className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-slate-700 transition-colors"
                        >
                          <FaPalette className="text-green-400" />
                          <span className="text-white text-sm font-medium">Theme: {theme === 'dark' ? 'Dark' : 'Light'}</span>
                        </button>
                        <button
                          onClick={() => { setShowSettingsModal(true); setShowProfileDropdown(false); }}
                          className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-slate-700 transition-colors"
                        >
                          <FaCog className="text-slate-400" />
                          <span className="text-white text-sm font-medium">Settings</span>
                        </button>
                        <div className="border-t border-slate-700 mt-2 pt-2">
                          <button
                            onClick={() => { localStorage.removeItem('currentUser'); localStorage.removeItem('authToken'); localStorage.removeItem('habitTracker_folders'); sessionStorage.removeItem('currentUser'); sessionStorage.removeItem('authToken'); setCurrentUser({ name: '', profilePicture: null, email: null }); setActiveView('login'); setShowProfileDropdown(false); window.dispatchEvent(new CustomEvent('userLoggedOut')); setIsAuthenticated(false); }}
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
                  <button
                    onClick={() => setActiveView('login')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setActiveView('signup')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Signup
                  </button>
                </div>
              )}
            </div>
          </nav>
          )}
      
  {/* Fixed Sidebar - Only show in dashboard view when authenticated */}
  {activeView === 'dashboard' && isAuthenticated && (
        <aside className="fixed top-16 left-0 bottom-0 w-72 bg-slate-900 text-white flex flex-col py-6 px-4 shadow-xl border-r border-slate-800 overflow-y-auto scrollbar-custom z-30">
        {/* Navigation Menu */}
        <nav className="mb-6">
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.label}>
                <button
                  className={`w-full flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-blue-800 transition font-semibold ${activeSection === item.label ? "bg-blue-700 text-white" : ""}`}
                  onClick={() => setActiveSection(item.label)}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}

          </ul>
        </nav>
        
        {/* Habit Folder Manager */}
        <div className="flex-1 border-t border-slate-800 pt-4 space-y-3">
          {isAuthenticated && (
            <button
              onClick={() => { setShowAreaManager(true); setActiveArea(null); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium"
            >
              <FaPlus className="text-xs" />
              <span>New Area</span>
            </button>
          )}
          <div className="space-y-1 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
            {areas.map(a => (
              <button
                key={a.id}
                onClick={() => { setActiveArea(a); setActiveSection(`AREA_${a.id}`); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left hover:bg-slate-800 ${activeSection===`AREA_${a.id}` ? 'bg-slate-800 text-white' : 'text-slate-300'}`}
              >
                <FaFolder className="text-slate-500" />
                <span className="truncate">{a.name}</span>
              </button>
            ))}
            {areas.length === 0 && (
              <div className="text-xs text-slate-500 px-1 py-2">No areas yet. Click "New Area" to create one.</div>
            )}
          </div>
        </div>
        </aside>
      )}
  {/* Area Manager Modal */}
    {showAreaManager && (
        <AreaManagerModal
          areas={areas}
      onCreate={(area)=> { setAreas(prev => [area, ...prev]); setActiveArea(area); setActiveSection(`AREA_${area.id}`); setShowAreaManager(false); }}
      onSelect={(area)=> { setActiveArea(area); setActiveSection(`AREA_${area.id}`); setShowAreaManager(false); }}
          onClose={()=> setShowAreaManager(false)}
        />
      )}
  {/* Area overlay removed; rendering inside main grid below */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg border border-slate-700">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <h4 className="text-white font-semibold">Settings</h4>
              <button onClick={()=>setShowSettingsModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <ProfileSettingsForm onClose={()=>setShowSettingsModal(false)} onUpdated={(p)=> setCurrentUser(p)} />
          </div>
        </div>
      )}
      
      {/* Conditional Content Area */}
      {activeView === 'login' ? (
        <main className="min-h-screen w-full flex items-center justify-center bg-slate-900">
          <div className="w-full max-w-lg mx-auto p-6">
            <Login onSuccess={(userData) => {
              setCurrentUser(userData);
              setActiveView('dashboard');
            }} />
            <div className="text-center mt-6">
              <button 
                onClick={() => setActiveView('signup')}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Don't have an account? Sign up
              </button>
            </div>
          </div>
        </main>
      ) : activeView === 'signup' ? (
        <main className="min-h-screen w-full flex items-center justify-center bg-slate-900">
          <div className="w-full max-w-lg mx-auto p-6">
            <Signup onSuccess={(userData) => {
              setCurrentUser(userData);
              setActiveView('dashboard');
            }} />
            <div className="text-center mt-6">
              <button 
                onClick={() => setActiveView('login')}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Already have an account? Login
              </button>
            </div>
          </div>
        </main>
      ) : (
        <>
          {/* Scrollable Content Area */}
          <main className="pt-20 ml-72 p-10 min-h-screen grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto">
        {/* Dashboard Section */}
          {activeSection === "Dashboard" && (
            <>
              {/* Friend Selection Control */}
              <div className="col-span-1 md:col-span-2 bg-slate-800 rounded-xl shadow-lg p-6">
                <h3 className="text-white font-semibold mb-4">Select Friend for Comparison</h3>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <select
                      value={selectedFriend || ""}
                      onChange={(e) => {
                        const friendId = e.target.value;
                        setSelectedFriend(friendId);
                        if (friendId) {
                          fetchFriendProgressData(friendId);
                        } else {
                          setFriendProgress(null);
                        }
                      }}
                      className="w-full bg-slate-700 text-white p-3 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Select a friend to compare...</option>
                      {friends.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                    </select>
                  </div>
                  {selectedFriend && (
                    <button
                      onClick={() => {
                        setSelectedFriend(null);
                        setFriendProgress(null);
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Four Bar Charts Layout */}
              {/* 1. Your Progress (Bar) */}
              <div className="bg-slate-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-blue-300 mb-4">Your Progress</h2>
                <Bar 
                  key="your-progress-bar" 
                  data={{
                    labels: (progressSummary?.habitStreaks||[]).map(h=>h.title),
                    datasets: [{
                      label: 'Streak (days)',
                      data: (progressSummary?.habitStreaks||[]).map(h=>h.streak),
                      backgroundColor: '#38bdf8',
                      borderRadius: 6
                    }]
                  }}
                  options={chartOptions}
                />
                {!progressSummary && <div className="text-slate-400 text-sm mt-4">Loading your progress...</div>}
              </div>

              {/* 2. Selected Friend Progress (Bar) */}
              <div className="bg-slate-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-yellow-300 mb-4">Friend's Progress</h2>
                <div className="mb-3">
                  <select
                    value={selectedFriend || ''}
                    onChange={(e)=> {
                      const id = e.target.value; setSelectedFriend(id); if (id) fetchFriendProgressData(id); else setFriendProgress(null);
                    }}
                    className="w-full bg-slate-700 text-white p-2 rounded border border-slate-600 text-sm"
                  >
                    <option value="">Select Friend...</option>
                    {friends.map(f=> <option key={f._id} value={f._id}>{f.name||'Friend'}</option>)}
                  </select>
                </div>
                {selectedFriend && friendProgress ? (
                  <Bar
                    key="friend-progress-bar"
                    data={{
                      labels: (friendProgress.habitStreaks||[]).map(h=>h.title),
                      datasets: [{
                        label: `${friends.find(f=>f._id===selectedFriend)?.name||'Friend'} Streak`,
                        data: (friendProgress.habitStreaks||[]).map(h=>h.streak),
                        backgroundColor: '#f59e0b',
                        borderRadius: 6
                      }]
                    }}
                    options={chartOptions}
                  />
                ) : (
                  <div className="text-slate-400 text-sm">Select a friend to view their progress.</div>
                )}
              </div>

              {/* 3. Comparison (You vs Friend) */}
              <div className="bg-slate-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-purple-300 mb-4">Comparison</h2>
                <Bar key="comparison-bar" data={compareData} options={chartOptions} />
                {!selectedFriend && <div className="text-slate-400 text-xs mt-3">Select a friend to populate comparison chart.</div>}
              </div>

              {/* 4. All Friends Aggregate */}
              <div className="bg-slate-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-green-300 mb-4">All Friends</h2>
                <Bar
                  key="all-friends-progress-bar"
                  data={{
                    labels: friendsProgress.map(fp => fp.name),
                    datasets: [{
                      label: 'Completion %',
                      data: friendsProgress.map(fp => fp.overallCompletion),
                      backgroundColor: '#10b981',
                      borderRadius: 6
                    }]
                  }}
                  options={chartOptions}
                />
                {friendsProgress.length === 0 && <div className="text-slate-400 text-sm mt-3">No friend progress yet.</div>}
              </div>
              
              {/* Your Folders Section */}
              {/* Removed old habit folder grid */}

              {/* Quick Habit Tracker */}
              <div className="col-span-1 md:col-span-2 bg-slate-800 rounded-xl shadow-lg p-6">
                <h3 className="text-white font-semibold mb-4">Quick Habit Tracker</h3>
                <p className="text-slate-400 text-sm mb-4">Select a habit to track your daily progress and see streaks in charts above</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-slate-300 text-sm mb-2">Select Habit to Track</label>
                    <select
                      value={selectedHabit?._id || ""}
                      onChange={(e) => {
                        const habitId = e.target.value;
                        const habit = habits.find(h => h._id === habitId);
                        setSelectedHabit(habit || null);
                      }}
                      className="w-full bg-slate-700 text-white p-3 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Select a habit to track...</option>
                      {habits.map(h => <option key={h._id} value={h._id}>{h.title}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end">
                    {selectedHabit ? (
                      <div className="text-green-400 text-sm">
                        ✓ Tracking: <span className="font-semibold">{selectedHabit.title}</span>
                      </div>
                    ) : (
                      <div className="text-slate-400 text-sm">
                        No habit selected for tracking
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <HabitTracker />
                </div>
              </div>
              
              {/* Task Progress Widget */}
              <div className="bg-slate-800 rounded-xl shadow-lg">
                <TaskProgressWidget />
              </div>
            </>
          )}

          {/* Progress Section */}
          {activeSection === "Progress" && (
            <>
              <div className="col-span-1">
                <ProgressSummary />
              </div>
              <div className="col-span-1">
                <TaskCompletion />
              </div>
              <div className="col-span-2 space-y-4">
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <h3 className="text-white font-semibold mb-4">Progress Charts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-slate-300 text-sm mb-1">Select Friend</label>
                      <select
                        value={selectedFriend || ""}
                        onChange={(e) => {
                          const friendId = e.target.value;
                          setSelectedFriend(friendId);
                          if (friendId) {
                            fetchFriendProgressData(friendId);
                          } else {
                            setFriendProgress(null);
                          }
                        }}
                        className="w-full bg-slate-700 text-white p-2 rounded border border-slate-600"
                      >
                        <option value="">None</option>
                        {friends.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm mb-1">Select Group</label>
                      <select
                        value={selectedGroup || ""}
                        onChange={(e) => {
                          const groupId = e.target.value;
                          setSelectedGroup(groupId);
                          if (groupId) {
                            fetchGroupProgressData(groupId);
                          } else {
                            setGroupProgress(null);
                          }
                        }}
                        className="w-full bg-slate-700 text-white p-2 rounded border border-slate-600"
                      >
                        <option value="">None</option>
                        {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-700 p-4 rounded border border-slate-600">
                      <h4 className="text-white font-medium mb-2">Your Progress</h4>
                      <HabitTrendChart data={progressSummary?.habitStreaks || []} />
                    </div>
                    <div className="bg-slate-700 p-4 rounded border border-slate-600">
                      <h4 className="text-white font-medium mb-2">Friend's Progress</h4>
                      {selectedFriend && friendProgress ? (
                        <HabitTrendChart data={friendProgress.habitStreaks || []} />
                      ) : (
                        <div className="text-slate-400 text-sm">Select a friend to view progress</div>
                      )}
                    </div>
                    <div className="bg-slate-700 p-4 rounded border border-slate-600">
                      <h4 className="text-white font-medium mb-2">Group Progress</h4>
                      {selectedGroup && groupProgress ? (
                        <HabitTrendChart data={groupProgress.habitStreaks || []} />
                      ) : (
                        <div className="text-slate-400 text-sm">Select a group to view progress</div>
                      )}
                    </div>
                    <div className="bg-slate-700 p-4 rounded border border-slate-600">
                      <h4 className="text-white font-medium mb-2">All Users Progress</h4>
                      <HabitTrendChart data={allUsersProgress?.habitStreaks || []} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-span-1">
                <CalendarHeatmap />
              </div>
            </>
          )}
          {/* Habit Todo Section */}
          {activeSection === "Habit Todo" && (
            <>
              <HabitTodo />
            </>
          )}
          {/* Area Sections */}
          {areas.map(a => (
            activeSection === `AREA_${a.id}` && (
              <React.Fragment key={a.id}>
                <div className="col-span-1 md:col-span-2 flex items-center justify-between bg-slate-800 rounded-xl p-5 border border-slate-700">
                  <div>
                    <h2 className="text-white font-semibold text-lg">Area: {a.name}</h2>
                    <div className="text-xs text-slate-400">Created {new Date(a.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=> setShowAreaManager(true)} className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600 text-xs text-white">Manage Areas</button>
                    <button onClick={()=> setActiveSection('Dashboard')} className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600 text-xs text-white">Back</button>
                  </div>
                </div>
                <div className="col-span-1 md:col-span-1 space-y-4">
                  <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <h4 className="text-sm font-semibold text-blue-300 mb-3">Create Habit in this Area</h4>
                    <HabitForm onCreated={(habit)=> {
                      setAreas(prev => prev.map(ar => ar.id === a.id ? { ...ar, habits: [habit._id, ...(ar.habits||[])] } : ar));
                    }} />
                  </div>
                  <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <h4 className="text-sm font-semibold text-green-300 mb-3">Create Habit Group</h4>
                    <GroupForm onCreated={(group)=> {
                      setAreas(prev => prev.map(ar => ar.id === a.id ? { ...ar, groups: [group._id, ...(ar.groups||[])] } : ar));
                    }} />
                  </div>
                </div>
                <div className="col-span-1 md:col-span-1 space-y-4">
                  <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <h5 className="text-xs uppercase tracking-wide text-slate-400 mb-2">Habits</h5>
                    {a.habits?.length ? (
                      <ul className="space-y-1 text-sm text-slate-200 max-h-64 overflow-y-auto pr-2">
                        {a.habits.map(id => {
                          const habit = habits.find(h => h._id === id);
                          return <li key={id} className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: habit?.colorTag || '#64748b' }}></span>{habit?.title || 'Unknown Habit'}</li>;
                        })}
                      </ul>
                    ) : <div className="text-xs text-slate-500">No habits yet.</div>}
                  </div>
                  <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <h5 className="text-xs uppercase tracking-wide text-slate-400 mb-2">Groups</h5>
                    {a.groups?.length ? (
                      <ul className="space-y-1 text-sm text-slate-200 max-h-64 overflow-y-auto pr-2">
                        {a.groups.map(id => {
                          const group = groups.find(g => g._id === id);
                          return <li key={id} className="flex items-center gap-2"><FaUsers className="text-slate-500" />{group?.name || 'Unknown Group'}</li>;
                        })}
                      </ul>
                    ) : <div className="text-xs text-slate-500">No groups yet.</div>}
                  </div>
                </div>
              </React.Fragment>
            )
          ))}
          {/* Friends Section */}
          {activeSection === "Friends" && (
            <>
              {/* Current Friends List */}
              <div className="col-span-1">
                <FriendsList />
              </div>
              
              {/* Invite by Email/Link */}
              <div className="col-span-1">
                <InviteFriends onInviteSent={() => {
                  // Refresh friends list when invite is sent
                  loadHabits(); // This also loads friends in the context
                }} />
              </div>
              
              {/* Search Existing Users */}
              <div className="col-span-1">
                <UserSearch />
              </div>
              
              {/* All Users List with Pagination */}
              <div className="col-span-1">
                <AllUsersList />
              </div>
            </>
          )}

          {/* Status Section - Implementation Summary */}
          {activeSection === "Status" && (
            <div className="col-span-1 md:col-span-2">
              <SocialFeaturesTest />
            </div>
          )}

          {/* Dynamic Folder Sections */}
          </main>
        </>
      )}
      </>
)}
    </div>  
  );
};
export default Dashboard;