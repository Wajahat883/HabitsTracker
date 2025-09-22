import React, { useState } from "react";
import { useAuth } from '../../context/useAuth';
import GoogleLoginButton from "./GoogleLoginButton";
import Loader from "../Common/Loader";
import api from "../../config/axios";
import { useNavigate } from "react-router-dom";

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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-neutral-50 to-blue-50 dark:from-slate-900 dark:via-blue-900 dark:to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 animate-gradient">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-50 via-blue-50 to-neutral-100 dark:from-slate-900 dark:via-blue-900 dark:to-slate-900"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-100/30 via-transparent to-purple-100/30 dark:from-purple-900/30 dark:via-transparent dark:to-blue-900/30"></div>
        <div className="absolute inset-0 backdrop-blur-3xl"></div>
      </div>

      {/* Floating Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-200/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
      </div>

      {toast.show && (
        <div className="fixed top-8 right-8 z-50 animate-slide-up">
          <div className={`glass-morphism px-6 py-4 rounded-2xl border-l-4 ${toast.type === 'success' ? 'border-emerald-400 text-emerald-400' : 'border-red-400 text-red-400'}`}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{toast.type === 'success' ? '✅' : '❌'}</span>
              <span className="font-medium text-white">{toast.message}</span>
            </div>
          </div>
        </div>
      )}

      {streakPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 animate-fadein">
          <div className="glass-morphism p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full mx-4 animate-pop">
            <div className="text-6xl mb-4 animate-bounce-in">🔥</div>
            <h3 className="text-2xl font-bold text-white mb-2">Welcome Back!</h3>
            <p className="text-neutral-300 mb-4">
              Your streak: <span className="text-gradient font-bold text-xl">{userStreak} days</span>
            </p>
            <div className="text-neutral-400 text-sm">Keep the momentum going!</div>
          </div>
        </div>
      )}

      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        {/* Left: Form Section */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md">
            <div className="glass-morphism rounded-3xl p-8 lg:p-10 animate-fadein-left" style={{background: 'var(--glass-bg)', border: '1px solid var(--glass-border)'}}>
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 text-shadow">
                  Welcome <span className="text-gradient">Back</span>
                </h2>
                <p className="text-slate-600 dark:text-neutral-400">Sign in to continue your habit journey</p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="form-group">
                  <label className="form-label" htmlFor="login-email">
                    Email Address
                  </label>
                  <input 
                    id="login-email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    className="form-input focus-ring" 
                    placeholder="Enter your email"
                    autoFocus 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="login-password">
                    Password
                  </label>
                  <div className="relative">
                    <input 
                      id="login-password" 
                      type={showPassword ? 'text' : 'password'} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      className="form-input focus-ring pr-12" 
                      placeholder="Enter your password" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(s => !s)} 
                      className="absolute inset-y-0 right-3 flex items-center text-neutral-400 hover:text-blue-400 transition-colors duration-200"
                      tabIndex={-1}
                    >
                      <span className="text-sm font-medium">
                        {showPassword ? '🙈' : '👁️'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 dark:border-neutral-600 bg-transparent focus:ring-blue-500" />
                    <span className="text-sm text-slate-600 dark:text-neutral-300">Remember me</span>
                  </label>
                  <a href="#" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                    Forgot password?
                  </a>
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="btn w-full py-4 text-lg font-semibold hover-lift focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <Loader />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <span className="flex items-center justify-center gap-3">
                      <span>🚀</span>
                      Sign In
                    </span>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center my-8">
                <div className="flex-1 h-px bg-slate-300 dark:bg-neutral-700"></div>
                <span className="mx-4 text-sm text-slate-500 dark:text-neutral-400">or continue with</span>
                <div className="flex-1 h-px bg-slate-300 dark:bg-neutral-700"></div>
              </div>

              {/* Google Login */}
              <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />

              {/* Footer */}
              <p className="mt-8 text-center text-slate-600 dark:text-neutral-400">
                Don't have an account?{' '}
                <a href="/signup" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium">
                  Create one
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Right: Feature Section */}
        <div className="hidden lg:flex flex-1 items-center justify-center p-12">
          <div className="max-w-lg text-center animate-fadein-up">
            <div className="glass-morphism rounded-3xl p-10" style={{background: 'var(--glass-bg)', border: '1px solid var(--glass-border)'}}>
              <div className="text-6xl mb-6 animate-float">🎯</div>
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4 text-shadow">
                Build <span className="text-gradient">Better Habits</span>
              </h2>
              <p className="text-lg text-slate-600 dark:text-neutral-300 mb-8 leading-relaxed">
                Track your progress, stay motivated with streaks, and transform your life 
                one habit at a time with our intelligent tracking system.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { icon: '📊', title: 'Smart Analytics', desc: 'AI-powered insights' },
                  { icon: '🔥', title: 'Streak Tracking', desc: 'Build momentum' },
                  { icon: '👥', title: 'Social Features', desc: 'Stay accountable' },
                  { icon: '🏆', title: 'Achievements', desc: 'Celebrate wins' }
                ].map((feature, index) => (
                  <div key={index} className="glass-morphism rounded-2xl p-4 hover-lift" style={{animationDelay: `${index * 100}ms`, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)'}}>
                    <div className="text-2xl mb-2">{feature.icon}</div>
                    <h4 className="font-semibold text-slate-800 dark:text-white text-sm mb-1">{feature.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-neutral-400">{feature.desc}</p>
                  </div>
                ))}
              </div>

              <div className="text-sm text-slate-500 dark:text-neutral-400">
                Join <span className="text-blue-600 dark:text-blue-400 font-bold">10,000+</span> users already transforming their lives
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
