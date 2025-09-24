import React, { useState } from "react";
import { useAuth } from '../../context/useAuth';
import GoogleLoginButton from "./GoogleLoginButton";
import Loader from "../Common/Loader";
import api from "../../config/axios";
import { useNavigate } from "react-router-dom";
import AuthPageHeader from "./AuthPageHeader";
import habitImage from "../../assets/pexels-cottonbro-4058794.jpg";

const API_URL = import.meta.env.VITE_API_URL;

const Toast = ({ message, type }) => (
  <div className={`fixed top-8 left-8 z-50 px-6 py-3 rounded-lg shadow-lg font-semibold text-white transition ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{message}</div>
);

const extractPayload = (raw) => raw?.data && raw.data.user ? raw.data : (raw?.data ? raw.data : raw);

const buildProfile = (user, fallbackEmail) => {
  if (!user) return { name: fallbackEmail?.split('@')[0] || '', email: fallbackEmail || '', profilePicture: null };
  return {
    name: user.name || user.username || fallbackEmail?.split('@')[0] || '',
    email: user.email || fallbackEmail || '',
    profilePicture: user.profilePicture || user.picture || null
  };
};

const persistAuth = ({ profile, accessToken, refreshToken }) => {
  if (profile) {
    localStorage.setItem('currentUser', JSON.stringify(profile));
    sessionStorage.setItem('currentUser', JSON.stringify(profile));
  }
  if (accessToken) {
    localStorage.setItem('authToken', accessToken);
    sessionStorage.setItem('authToken', accessToken);
  }
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
    sessionStorage.setItem('refreshToken', refreshToken);
  }
};

const fetchCanonicalProfile = async () => {
  try {
    const res = await fetch(`${API_URL}/api/auth/profile`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
      credentials: 'include'
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.user ? buildProfile(json.user) : null;
  } catch (e) {
    console.warn('[AUTH] canonical profile fetch error', e);
    return null;
  }
};

const Login = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  const [streakPopup, setStreakPopup] = useState(false);
  const [userStreak, setUserStreak] = useState(0);
  const navigate = useNavigate();
  const { authenticated } = useAuth();
  if (authenticated) {
    // Already logged in; avoid flashing login screen
    navigate('/app/home');
    return null;
  }

  const showToast = (message, type='success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type }), 3000);
  };

  const finalizeLogin = async (provisionalProfile) => {
    // Try to upgrade with canonical profile
    const canonical = await fetchCanonicalProfile();
    const finalProfile = canonical || provisionalProfile;
    persistAuth({ profile: finalProfile, accessToken: localStorage.getItem('authToken'), refreshToken: localStorage.getItem('refreshToken') });
    if (onSuccess) onSuccess(finalProfile);
    window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: finalProfile }));
    // Dynamically fetch current streak (longest streak across habits) and fallback to 1 for first-time users
    try {
      const response = await api.get('/progress/summary?range=30d');
      const data = response.data.data || response.data; // ApiResponse wraps in data
      const longest = (data && typeof data.longestStreak === 'number') ? data.longestStreak : 0;
      setUserStreak(longest > 0 ? longest : 1); // default to 1 if no streak yet
    } catch {
      setUserStreak(1);
    }
    setStreakPopup(true); // show popup after streak resolved (fast request)
    setTimeout(() => {
      setStreakPopup(false);
            if (!onSuccess) navigate('/app/home');
    }, 1000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const json = response.data;
      showToast('Login successful!', 'success');
      const payload = extractPayload(json);
      const profile = buildProfile(payload.user, email);
      persistAuth({ profile, accessToken: payload.accessToken || payload.token, refreshToken: payload.refreshToken });
      await finalizeLogin(profile);
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      if (!credentialResponse?.credential) {
        showToast('Google auth failed', 'error');
        return;
      }
      const { data: raw } = await api.post('/auth/google', { token: credentialResponse.credential });
      const payload = extractPayload(raw);
      const profile = buildProfile(payload.user);
      persistAuth({ profile, accessToken: payload.accessToken || payload.token, refreshToken: payload.refreshToken });
      showToast('Login successful!', 'success');
      await finalizeLogin(profile);
    } catch (e) {
      console.error(e);
      showToast('Google login error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => showToast('Google Login Failed', 'error');

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900">
      {/* Cloud-like Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-cyan-300/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-1/4 w-72 h-72 bg-blue-300/8 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-white/6 rounded-full blur-3xl animate-pulse" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-r from-cyan-400/5 to-blue-400/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
      </div>

      {/* Floating Cloud Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-16 left-16 w-32 h-16 bg-white/10 rounded-full blur-sm animate-float opacity-60"></div>
        <div className="absolute top-32 right-32 w-24 h-12 bg-white/8 rounded-full blur-sm animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-32 left-32 w-28 h-14 bg-cyan-200/10 rounded-full blur-sm animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Toast Notification */}

      {toast.show && (
        <div className="fixed top-8 right-8 z-50 animate-slide-up">
          <div className={`bg-white/20 backdrop-blur-lg px-6 py-4 rounded-2xl border border-white/30 shadow-xl ${toast.type === 'success' ? 'border-l-4 border-l-emerald-400 text-emerald-100' : 'border-l-4 border-l-red-400 text-red-100'}`}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{toast.type === 'success' ? '✅' : '❌'}</span>
              <span className="font-medium text-white">{toast.message}</span>
            </div>
          </div>
        </div>
      )}

      {streakPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 animate-fadein">
          <div className="bg-white/20 backdrop-blur-lg p-8 rounded-3xl border border-white/30 shadow-2xl text-center max-w-sm w-full mx-4 animate-pop">
            <div className="text-6xl mb-4 animate-bounce-in">🔥</div>
            <h3 className="text-2xl font-bold text-white mb-2">Welcome Back!</h3>
            <p className="text-blue-100 mb-4">
              Your streak: <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent font-bold text-xl">{userStreak} days</span>
            </p>
            <div className="text-blue-200 text-sm">Keep the momentum going!</div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 p-8 z-40">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="text-xl font-bold text-white">HabitTracker</span>
          </div>
          
          <button
            onClick={() => navigate('/signup')}
            className="px-6 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 font-medium"
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center p-8 pt-24">
        <div className="w-full max-w-7xl flex items-center gap-12">
          
          {/* Left Side - Description and Image */}
          <div className="hidden lg:flex lg:w-1/2 flex-col items-center text-center">
            {/* Hero Image */}
            <div className="relative mb-8">
              <div className="w-96 h-96 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
                <img 
                  src={habitImage} 
                  alt="Habit Tracking Journey" 
                  className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                  </div>
                  <p className="text-white text-sm font-medium">Track • Progress • Achieve</p>
                </div>
              </div>
            </div>
            
            {/* Description Content */}
            <div className="max-w-lg">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Transform Your Life
              </h1>
              <p className="text-blue-100/90 text-lg leading-relaxed mb-8">
                Build lasting habits that stick. Track your progress, celebrate your wins, and stay motivated with our intuitive habit tracking platform designed for real results.
              </p>
              
              {/* Feature Highlights */}
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">Progress Tracking</div>
                    <div className="text-blue-200 text-xs">Visual insights & streaks</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-400 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path>
                    </svg>
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">Streak Building</div>
                    <div className="text-blue-200 text-xs">Stay motivated daily</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">Social Support</div>
                    <div className="text-blue-200 text-xs">Friends & groups</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">Daily Motivation</div>
                    <div className="text-blue-200 text-xs">Quotes & reminders</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side - Login Form */}
          <div className="w-full lg:w-1/2 flex justify-center">
            <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="bg-white/15 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl animate-fadein">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30">
                <span className="text-2xl">👋</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-blue-100 text-sm">Sign in to continue your habit journey</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-blue-100" htmlFor="login-email">
                  Email Address
                </label>
                <input 
                  id="login-email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="w-full px-4 py-3 bg-white/90 backdrop-blur-sm rounded-xl border border-white/30 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300" 
                  placeholder="Enter your email"
                  autoFocus 
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-blue-100" htmlFor="login-password">
                  Password
                </label>
                <div className="relative">
                  <input 
                    id="login-password" 
                    type={showPassword ? 'text' : 'password'} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    className="w-full px-4 py-3 bg-white/90 backdrop-blur-sm rounded-xl border border-white/30 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300 pr-12" 
                    placeholder="Enter your password" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(s => !s)} 
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-cyan-600 transition-colors duration-200"
                    tabIndex={-1}
                  >
                    <span className="text-lg">
                      {showPassword ? '🙈' : '👁️'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-white/30 bg-white/20 focus:ring-cyan-400" />
                  <span className="text-sm text-blue-100">Remember me</span>
                </label>
                <a href="#" className="text-sm text-cyan-200 hover:text-cyan-100 transition-colors">
                  Forgot password?
                </a>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className={`w-full py-3 px-4 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ${loading ? 'opacity-75 cursor-not-allowed' : 'hover:scale-[1.02] hover:from-cyan-500 hover:to-blue-600'}`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <Loader />
                    <span className="animate-pulse">Signing in...</span>
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    <span className="text-xl">🚀</span>
                    Sign In
                  </span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-white/20"></div>
              <span className="mx-4 text-sm text-blue-100">or continue with</span>
              <div className="flex-1 h-px bg-white/20"></div>
            </div>

            {/* Google Login */}
            <div className="mb-6">
              <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
            </div>

            {/* Footer */}
            <p className="text-center text-blue-100 text-sm">
              Don't have an account?{' '}
              <button 
                onClick={() => navigate('/signup')}
                className="text-cyan-200 hover:text-cyan-100 transition-colors font-medium underline"
              >
                Create one
              </button>
            </p>
          </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
