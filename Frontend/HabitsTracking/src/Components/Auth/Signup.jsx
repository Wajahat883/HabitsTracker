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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-neutral-50 to-emerald-50 dark:from-slate-900 dark:via-emerald-900 dark:to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 animate-gradient">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-50 via-emerald-50 to-neutral-100 dark:from-slate-900 dark:via-emerald-900 dark:to-slate-900"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100/30 via-transparent to-teal-100/30 dark:from-teal-900/30 dark:via-transparent dark:to-emerald-900/30"></div>
        <div className="absolute inset-0 backdrop-blur-3xl"></div>
      </div>

      {/* Floating Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/5 w-72 h-72 bg-emerald-200/20 dark:bg-emerald-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/3 right-1/5 w-96 h-96 bg-teal-200/20 dark:bg-teal-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1.5s'}}></div>
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

      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        {/* Left: Form Section */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md">
            <div className="glass-morphism rounded-3xl p-8 lg:p-10 animate-fadein-left" style={{background: 'var(--glass-bg)', border: '1px solid var(--glass-border)'}}>
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 text-shadow">
                  Create Your <span className="text-gradient">Account</span>
                </h2>
                <p className="text-slate-600 dark:text-neutral-400">Start building better habits today</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSignup} className="space-y-6">
                <div className="form-group">
                  <label className="form-label" htmlFor="signup-username">
                    Username
                  </label>
                  <input 
                    id="signup-username" 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    required 
                    className="form-input focus-ring" 
                    placeholder="Choose a unique username"
                    autoFocus 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="signup-email">
                    Email Address
                  </label>
                  <input 
                    id="signup-email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    className="form-input focus-ring" 
                    placeholder="Enter your email" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="signup-password">
                    Password
                  </label>
                  <div className="relative">
                    <input 
                      id="signup-password" 
                      type={showPassword ? 'text' : 'password'} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      className="form-input focus-ring pr-12" 
                      placeholder="Create a strong password" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(s => !s)} 
                      className="absolute inset-y-0 right-3 flex items-center text-neutral-400 hover:text-emerald-400 transition-colors duration-200"
                      tabIndex={-1}
                    >
                      <span className="text-sm font-medium">
                        {showPassword ? '🙈' : '👁️'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    required 
                    className="w-4 h-4 mt-1 rounded border-slate-300 dark:border-neutral-600 bg-transparent focus:ring-emerald-500" 
                  />
                  <span className="text-sm text-slate-600 dark:text-neutral-300 leading-relaxed">
                    I agree to the{' '}
                    <a href="#" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
                      Privacy Policy
                    </a>
                  </span>
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="btn btn-accent w-full py-4 text-lg font-semibold hover-lift focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <Loader />
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    <span className="flex items-center justify-center gap-3">
                      <span>🎯</span>
                      Create Account
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

              {/* Google Signup */}
              <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />

              {/* Footer */}
              <p className="mt-8 text-center text-slate-600 dark:text-neutral-400">
                Already have an account?{' '}
                <a href="/login" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors font-medium">
                  Sign in
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Right: Feature Section */}
        <div className="hidden lg:flex flex-1 items-center justify-center p-12">
          <div className="max-w-lg text-center animate-fadein-up">
            <div className="glass-morphism rounded-3xl p-10" style={{background: 'var(--glass-bg)', border: '1px solid var(--glass-border)'}}>
              <div className="text-6xl mb-6 animate-float">🌱</div>
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4 text-shadow">
                Start Your <span className="text-gradient">Transformation</span>
              </h2>
              <p className="text-lg text-slate-600 dark:text-neutral-300 mb-8 leading-relaxed">
                Join thousands of users who have transformed their lives through consistent habit tracking 
                and our supportive community features.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { icon: '🎯', title: 'Goal Setting', desc: 'Set clear, achievable targets' },
                  { icon: '📊', title: 'Progress Tracking', desc: 'Visual insights and analytics' },
                  { icon: '👥', title: 'Social Support', desc: 'Connect with like-minded users' },
                  { icon: '🏆', title: 'Achievements', desc: 'Celebrate your milestones' }
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-4 glass-morphism rounded-2xl p-4 hover-lift" style={{animationDelay: `${index * 100}ms`, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)'}}>
                    <div className="text-2xl">{feature.icon}</div>
                    <div className="text-left">
                      <h4 className="font-semibold text-slate-800 dark:text-white text-sm">{feature.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-neutral-400">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass-morphism rounded-2xl p-4 border border-emerald-300/50 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-900/20">
                <div className="text-sm text-slate-700 dark:text-neutral-300">
                  🎉 <span className="text-emerald-600 dark:text-emerald-400 font-bold">Free Forever</span> - No credit card required
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
