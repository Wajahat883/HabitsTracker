import React, { useState } from 'react';
import GoogleLoginButton from './GoogleLoginButton';
import Loader from '../Common/Loader';
import axios from 'axios';
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
  setTimeout(() => { if (!onSuccess) navigate('/home'); }, 1000);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email, password })
      });
      const json = await res.json().catch(()=>({}));
      if (!res.ok) {
        showToast(json.message || 'Signup failed', 'error');
        return;
      }
      showToast('Signup successful!', 'success');
      const payload = extractPayload(json);
      const profile = buildProfile(payload.user, email);
      persistAuth({ profile, accessToken: payload.accessToken || payload.token, refreshToken: payload.refreshToken });
      await finalizeSignup(profile);
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
    <div className="auth-bg">
      <div className="auth-shell">
        {toast.show && <ToastInline message={toast.message} type={toast.type} />}
        <div className="auth-panel">
          <div className="auth-card p-8 md:p-10 relative">
            <h2 className="auth-heading text-center mb-6">Create Account</h2>
            <form onSubmit={handleSignup} className="space-y-5">
              <div>
                <label className="auth-label">Username</label>
                <input type="text" value={username} onChange={(e)=>setUsername(e.target.value)} required className="auth-input" placeholder="habit_ninja" />
              </div>
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
              <div className="flex items-center gap-2 text-sm">
                <input type="checkbox" required className="w-4 h-4 rounded border-slate-400" />
                <span className="auth-small">I agree to the <a href="#" className="auth-alt-link">Terms</a></span>
              </div>
              <button type="submit" disabled={loading} className="auth-submit">
                {loading ? <Loader /> : 'Create Account'}
              </button>
            </form>
            <div className="auth-divider"><span>OR</span></div>
            <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
            <p className="mt-8 text-center auth-small">Already have an account? <a href="/login" className="auth-alt-link">Sign in</a></p>
          </div>
        </div>
        <div className="auth-side">
          <div className="feature-badge"><span>Daily Momentum</span></div>
          <div className="space-y-7 relative z-10">
            <h2 className="auth-heading">Join the Habit Community</h2>
            <p className="text-sm leading-relaxed text-slate-200 max-w-md">Create an account to set goals, track your year heat map, and celebrate sustainable progress—not just streak numbers.</p>
            <div className="glass-tile">
              <h4 className="text-sm font-semibold tracking-wide uppercase">Included</h4>
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
    </div>
  );
};

export default Signup;
