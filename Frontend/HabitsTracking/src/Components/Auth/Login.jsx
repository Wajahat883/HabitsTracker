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
    setUserStreak(7);
    setStreakPopup(true);
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
    <div className="min-h-screen flex bg-gray-100">
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
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 relative">
          <h2 className="text-2xl font-bold mb-6 text-center">Sign in to HabitTracker</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
              <div className="relative">
                <input type={showPassword? 'text':'password'} value={password} onChange={(e)=>setPassword(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none pr-10" placeholder="••••••••" />
                <button type="button" onClick={()=>setShowPassword(s=>!s)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="form-checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#" className="text-purple-700 hover:underline">Forgot Password?</a>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-purple-700 text-white py-2 rounded-lg font-semibold hover:bg-purple-800 disabled:opacity-60">
              {loading ? <Loader /> : 'Sign in'}
            </button>
          </form>
          <div className="my-6 flex items-center">
            <span className="flex-grow border-b" />
            <span className="mx-3 text-gray-400 text-sm">OR</span>
            <span className="flex-grow border-b" />
          </div>
          <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
        </div>
      </div>
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-purple-900 via-blue-900 to-black flex-col justify-center items-center p-12 text-white relative">
        <div className="mb-10 text-center">
          <h3 className="text-3xl font-bold mb-4">Build Better Habits</h3>
          <p className="max-w-sm text-purple-100">Track habits, build streaks, and stay motivated with analytics and inspiration.</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-xl p-6 w-64 text-center shadow-lg">
          <p className="text-purple-200 mb-2">Current Community Streak</p>
          <p className="text-4xl font-extrabold">🔥 21</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
