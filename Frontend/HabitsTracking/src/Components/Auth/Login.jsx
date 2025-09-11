import React, { useState } from "react";
import GoogleLoginButton from "./GoogleLoginButton";
import Loader from "../Common/Loader";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const Toast = ({ message, type }) => (
  <div
    className={`fixed top-8 left-8 z-50 px-6 py-3 rounded-lg shadow-lg font-semibold text-white transition ${
      type === "success" ? "bg-green-600" : "bg-red-600"
    }`}
  >
    {message}
  </div>
);

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const showToast = (msg, type = "success") => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: "", type }), 3000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        showToast("Server error: " + text, "error");
        setLoading(false);
        return;
      }
      if (response.ok) {
        showToast("Welcome!", "success");
        navigate("/dashboard");
      } else {
        showToast(data.message || "Login failed", "error");
      }
    } catch {
      showToast("Login failed due to network error", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    if (!credentialResponse || !credentialResponse.credential) {
      showToast("No Google token received. Please try again.", "error");
      setLoading(false);
      return;
    }
    try {
      const { data } = await axios.post(
        `${API_URL}/api/auth/google`,
        { token: credentialResponse.credential },
        { withCredentials: true }
      );
      showToast("Welcome!", "success");
      if (data.success || data.accessToken) {
        navigate("/dashboard");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Google login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    showToast("Google login failed", "error");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      {toast.show && <Toast message={toast.message} type={toast.type} />}
      <div className="flex w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {/* Left: Login Form */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
          <div className="flex items-center mb-8">
            <span className="text-2xl font-bold text-purple-700 tracking-tight">
              HabitTracker
            </span>
          </div>
          <h2 className="text-3xl font-bold mb-2 text-gray-800">Sign in</h2>
          <p className="mb-6 text-gray-500">
            Don't have an account?{" "}
            <a
              href="/signup"
              className="text-purple-700 font-medium hover:underline"
            >
              Create now
            </a>
          </p>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-gray-600 mb-1">E-mail</label>
              <input
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
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
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
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
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center text-gray-600">
                <input type="checkbox" className="mr-2" /> Remember me
              </label>
              <a
                href="#"
                className="text-purple-700 hover:underline text-sm"
              >
                Forgot Password?
              </a>
            </div>
            <button
              type="submit"
              className="w-full bg-purple-700 text-white py-3 rounded-lg font-semibold hover:bg-purple-900 transition"
              disabled={loading}
            >
              {loading ? <Loader /> : "Sign in"}
            </button>
          </form>
          <div className="my-6 flex items-center justify-center">
            <span className="w-1/3 border-b border-gray-300"></span>
            <span className="mx-2 text-gray-400">OR</span>
            <span className="w-1/3 border-b border-gray-300"></span>
          </div>
          <GoogleLoginButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />
        </div>
        {/* Right: Branding/Info */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-purple-900 via-blue-900 to-black flex-col justify-center items-center p-10 text-white relative">
          <div className="absolute top-6 right-6 text-sm opacity-80">Support</div>
          <div className="mb-8">
            <div className="bg-white rounded-lg p-6 shadow-lg text-purple-900">
              <h3 className="text-lg font-bold mb-2">
                Reach your habit goals faster
              </h3>
              <p className="mb-2">
                Track habits, build streaks, and stay motivated with HabitTracker.
              </p>
              <button className="bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-900">
                Learn more
              </button>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-bold">Streak</span>
                <span className="font-bold">🔥 21 days</span>
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Introducing new features</h2>
          <p className="text-base opacity-90">
            Analyze your progress, get inspired, and make lasting changes.
            HabitTracker helps you build better habits for a better life.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
