import React, { useState } from "react";
import GoogleLoginButton from "./GoogleLoginButton";
import Loader from "../Common/Loader";
import Toast from "../Common/Toast";   // ✅ import added
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const Signup = ({ onSuccess }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const showToast = (msg, type = "success") => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: "", type }), 3000);
  };

  const extractPayload = (raw) => raw?.data && raw.data.user ? raw.data : (raw?.data ? raw.data : raw);
  const buildProfile = (user, fallback) => {
    if (!user) return { name: fallback || '', email: fallback || '', profilePicture: null };
    return {
      name: user.name || user.username || fallback || '',
      email: user.email || fallback || '',
      profilePicture: user.profilePicture || user.picture || null
    };
  };
  const persistAuth = ({ profile, accessToken, refreshToken }) => {
    if (profile) {
      localStorage.setItem('currentUser', JSON.stringify(profile));
      sessionStorage.setItem('currentUser', JSON.stringify(profile));
    }
    if (accessToken) { localStorage.setItem('authToken', accessToken); sessionStorage.setItem('authToken', accessToken); }
    if (refreshToken) { localStorage.setItem('refreshToken', refreshToken); sessionStorage.setItem('refreshToken', refreshToken); }
  };
  const fetchCanonical = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }, credentials: 'include' });
      if (!res.ok) return null;
      const json = await res.json();
      return json.user ? buildProfile(json.user) : null;
    } catch { return null; }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      console.log('Sending signup request to:', `${API_URL}/api/auth/register`);
      console.log('Signup data:', { username, email, password: '***' });
      
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, email, password })
      });
      
      console.log('Signup response status:', res.status);
      const raw = await res.json();
      console.log('Signup response data (raw):', raw);
      if (res.ok) {
        showToast("Signup successful! Redirecting to dashboard...", "success");
        setMessage("Signup successful!");
        const payload = extractPayload(raw);
        let profile = buildProfile(payload.user, email);
        persistAuth({ profile, accessToken: payload.accessToken || payload.token, refreshToken: payload.refreshToken });
        const canonical = await fetchCanonical();
        if (canonical) {
          profile = canonical;
          persistAuth({ profile, accessToken: localStorage.getItem('authToken'), refreshToken: localStorage.getItem('refreshToken') });
        }
        if (onSuccess) onSuccess(profile);
        window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: profile }));
        
        setTimeout(() => {
          if (!onSuccess) {
            navigate("/dashboard");
          }
        }, 1000);
      } else {
        showToast(raw.message || "Signup failed", "error");
        setMessage(raw.message || "Signup failed");
      }
  } catch {
      showToast("Server error", "error");
      setMessage("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-blue-900 to-green-700 py-8">
      {/* ✅ Toast Render */}
      {toast.show && <Toast message={toast.message} type={toast.type} />}

  <div className="flex w-full max-w-5xl h-[680px] bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {/* Left: Signup Form */}
  <div className="w-full md:w-1/2 p-12 flex flex-col justify-center h-full overflow-y-auto">
          <div className="flex items-center mb-8">
            <span className="text-2xl font-bold text-green-700 tracking-tight">HabitTracker</span>
          </div>
          <h2 className="text-3xl font-bold mb-2 text-gray-800">Sign up</h2>
          <p className="mb-6 text-gray-500">
            Already have an account?{" "}
            <a href="/login" className="text-green-700 font-medium hover:underline">Sign in</a>
          </p>
          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-gray-600 mb-1">Name</label>
              <input
                type="text"
                placeholder="Your Name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                required
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">E-mail</label>
              <input
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                required
              />
            </div>
            <div className="relative">
              <label className="block text-gray-600 mb-1">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                required
              />
              <span
                className="absolute right-4 top-10 cursor-pointer text-gray-400"
                onClick={() => setShowPassword((v) => !v)}
                title={showPassword ? "Hide" : "Show"}
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  {showPassword ? (
                    <path d="M10 3C5 3 1.73 7.11 1.73 10c0 2.89 3.27 7 8.27 7s8.27-4.11 8.27-7c0-2.89-3.27-7-8.27-7zm0 12c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                  ) : (
                    <path d="M10 4c-3.86 0-7 3.14-7 7s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
                  )}
                </svg>
              </span>
            </div>
            <button
              type="submit"
              className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-900 transition"
              disabled={loading}
            >
              {loading ? <Loader /> : "Sign up"}
            </button>
          </form>
          <div className="my-6 flex items-center justify-center">
            <span className="w-1/3 border-b border-gray-300"></span>
            <span className="mx-2 text-gray-400">OR</span>
            <span className="w-1/3 border-b border-gray-300"></span>
          </div>
          <GoogleLoginButton
            onSuccess={() => {
              showToast("Google signup successful! Redirecting to dashboard...", "success");
              setMessage("Google signup successful!");
              setTimeout(() => navigate("/dashboard"), 1200);
            }}
            onError={(err) => showToast(err.message || "Google signup failed", "error")}
          />
          {message && (
            <div className={`mt-4 text-center font-semibold ${toast.type === "success" ? "text-green-700" : "text-red-600"}`}>
              {message}
            </div>
          )}
        </div>

        {/* Right: Branding/Info */}
  <div className="hidden md:flex w-1/2 bg-gradient-to-br from-black via-blue-900 to-green-700 flex-col justify-center items-center p-12 text-white relative h-full">
          <div className="absolute top-6 right-6 text-sm opacity-80">Support</div>
          <div className="mb-8">
            <div className="bg-white rounded-lg p-6 shadow-lg text-green-900">
              <h3 className="text-lg font-bold mb-2">Start your habit journey</h3>
              <p className="mb-2">Create habits, track progress, and join your friends on HabitTracker.</p>
              <button className="bg-green-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-900">Learn more</button>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-bold">Community</span>
                <span className="font-bold">🌱 Growing</span>
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Join and grow together</h2>
          <p className="text-base opacity-90">Build habits, connect with friends, and achieve your goals. HabitTracker makes habit building social and fun.</p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
