import React, { useState } from "react";
import GoogleLoginButton from "./GoogleLoginButton";
import Loader from "../Common/Loader";
import axios from "axios";
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
      const res = await fetch(`${API_URL}/api/progress/summary?range=30d`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        credentials: 'include'
      });
      if (res.ok) {
        const json = await res.json().catch(()=>({}));
        const data = json.data || json; // ApiResponse wraps in data
        const longest = (data && typeof data.longestStreak === 'number') ? data.longestStreak : 0;
        setUserStreak(longest > 0 ? longest : 1); // default to 1 if no streak yet
      } else {
        setUserStreak(1);
      }
    } catch {
      setUserStreak(1);
    }
    setStreakPopup(true); // show popup after streak resolved (fast request)
    setTimeout(() => {
      setStreakPopup(false);
      if (!onSuccess) navigate('/dashboard');
    }, 1000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(json.message || 'Login failed', 'error');
        return;
      }
      showToast('Login successful!', 'success');
      const payload = extractPayload(json);
      const profile = buildProfile(payload.user, email);
      persistAuth({ profile, accessToken: payload.accessToken || payload.token, refreshToken: payload.refreshToken });
      await finalizeLogin(profile);
    } catch (err) {
      console.error(err);
      showToast('Server error', 'error');
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
      const { data: raw } = await axios.post(`${API_URL}/api/auth/google`, { token: credentialResponse.credential }, { withCredentials: true });
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
    <div className="auth-bg">
      <div className="auth-shell">
      {toast.show && <Toast message={toast.message} type={toast.type} />}
      {streakPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-40">
          <div className="bg-white p-6 rounded shadow text-center">
            <h3 className="text-xl font-semibold mb-2">Welcome Back!</h3>
            <p className="mb-2">Current streak: <span className="font-bold">{userStreak} days</span></p>
            <p className="text-3xl">🔥</p>
          </div>
        </div>
      )}
      <div className="auth-panel">
        <div className="auth-card p-8 md:p-10 relative">
          <h2 className="auth-heading text-center mb-6">Welcome Back</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="auth-label">Email</label>
              <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required className="auth-input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="auth-label">Password</label>
              <div className="relative">
                <input type={showPassword? 'text':'password'} value={password} onChange={(e)=>setPassword(e.target.value)} required className="auth-input pr-12" placeholder="••••••••" />
                <button type="button" onClick={()=>setShowPassword(s=>!s)} className="absolute inset-y-0 right-2 px-2 flex items-center text-slate-500 hover:text-slate-300 text-xs font-medium tracking-wide">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-400" />
                <span className="auth-small">Remember me</span>
              </label>
              <a href="#" className="auth-alt-link">Forgot Password?</a>
            </div>
            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? <Loader /> : 'Sign In'}
            </button>
          </form>
          <div className="auth-divider">
            <span>OR</span>
          </div>
          <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
          <p className="mt-8 text-center auth-small">No account? <a href="/signup" className="auth-alt-link">Create one</a></p>
        </div>
      </div>
      <div className="auth-side">
        <div className="feature-badge"><span>Habit Insight Engine</span></div>
        <div className="space-y-7 relative z-10">
          <h2 className="auth-heading">Build Better Habits</h2>
          <p className="text-sm leading-relaxed text-slate-200 max-w-md">Track, analyze and sustain your routines with real‑time streaks, motivational insights and a social layer that keeps you accountable.</p>
          <div className="glass-tile">
            <h4 className="text-sm font-semibold tracking-wide uppercase">Why Join?</h4>
            <ul className="text-xs space-y-2 text-slate-100/90">
              <li>• Smart streak tracking with tolerance</li>
              <li>• Social progress & friend presence</li>
              <li>• Year heat map & habit insights</li>
              <li>• Fast theme switching</li>
            </ul>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Login;
