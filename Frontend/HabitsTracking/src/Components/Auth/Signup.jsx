import React, { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import GoogleLoginButton from './GoogleLoginButton';
import Loader from '../Common/Loader';
import api from "../../config/axios";
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

// Lightweight inline toast (Signup mirrors Login style)
const ToastInline = ({ message, type }) => (
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

const Signup = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { authenticated } = useAuth();
  if (authenticated) {
    navigate('/app/home');
    return null;
  }

  const showToast = (message, type='success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type }), 3000);
  };

  const finalizeSignup = async (provisionalProfile) => {
    const canonical = await fetchCanonicalProfile();
    const finalProfile = canonical || provisionalProfile;
    persistAuth({ profile: finalProfile, accessToken: localStorage.getItem('authToken'), refreshToken: localStorage.getItem('refreshToken') });
    if (onSuccess) onSuccess(finalProfile);
    window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: finalProfile }));
  setTimeout(() => { if (!onSuccess) navigate('/app/home'); }, 1000);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/register', { username, email, password });
      const json = response.data;
      showToast('Signup successful!', 'success');
      const payload = extractPayload(json);
      const profile = buildProfile(payload.user, email);
      persistAuth({ profile, accessToken: payload.accessToken || payload.token, refreshToken: payload.refreshToken });
      await finalizeSignup(profile);
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || err.message || 'Signup failed';
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
      showToast('Signup successful!', 'success');
      await finalizeSignup(profile);
    } catch (e) {
      console.error(e);
      showToast('Google signup error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => showToast('Google Signup Failed', 'error');

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-stretch bg-[var(--color-bg)]">
      {toast.show && <ToastInline message={toast.message} type={toast.type} />}
      {/* Left: Form */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 md:px-8 bg-[var(--color-bg)] animate-fadein">
        <div className="card w-full max-w-md p-8 md:p-10 relative animate-fadein">
          <h2 className="text-2xl font-extrabold text-center mb-6 text-blue-400">Create Account</h2>
          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="signup-username">Username</label>
              <input id="signup-username" type="text" value={username} onChange={(e)=>setUsername(e.target.value)} required className="input w-full" placeholder="habit_ninja" autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="signup-email">Email</label>
              <input id="signup-email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required className="input w-full" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="signup-password">Password</label>
              <div className="relative">
                <input id="signup-password" type={showPassword? 'text':'password'} value={password} onChange={(e)=>setPassword(e.target.value)} required className="input w-full pr-12" placeholder="••••••••" />
                <button type="button" onClick={()=>setShowPassword(s=>!s)} className="absolute inset-y-0 right-2 px-2 flex items-center text-muted hover:text-blue-400 text-xs font-medium tracking-wide" tabIndex={-1} aria-label="Toggle password visibility">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <input type="checkbox" required className="rounded border-[var(--color-border)]" />
              <span className="muted">I agree to the <a href="#" className="text-blue-400 hover:underline">Terms</a></span>
            </div>
            <button type="submit" disabled={loading} className="btn w-full flex items-center justify-center animate-pop">
              {loading ? <Loader /> : 'Create Account'}
            </button>
          </form>
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-[var(--color-border)]" />
            <span className="mx-3 text-xs text-muted">OR</span>
            <div className="flex-1 h-px bg-[var(--color-border)]" />
          </div>
          <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
          <p className="mt-8 text-center text-sm text-muted">Already have an account? <a href="/login" className="text-blue-400 hover:underline">Sign in</a></p>
        </div>
      </div>
      {/* Right: Feature/Branding */}
      <div className="hidden md:flex flex-col justify-center items-center flex-1 bg-gradient-to-br from-blue-900/60 to-blue-700/40 relative overflow-hidden animate-fadein">
        <div className="feature-badge mb-6"><span>Daily Momentum</span></div>
        <div className="space-y-7 relative z-10 max-w-md px-8">
          <h2 className="text-3xl font-extrabold text-white mb-2">Join the Habit Community</h2>
          <p className="text-base leading-relaxed text-slate-200">Create an account to set goals, track your year heat map, and celebrate sustainable progress—not just streak numbers.</p>
          <div className="glass-tile p-5 rounded-xl shadow-lg">
            <h4 className="text-sm font-semibold tracking-wide uppercase text-blue-200 mb-2">Included</h4>
            <ul className="text-xs space-y-2 text-slate-100/90">
              <li>• Flexible habit scheduling</li>
              <li>• Friend invitations & presence</li>
              <li>• Motivational quotes engine</li>
              <li>• Theming & accessibility</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
