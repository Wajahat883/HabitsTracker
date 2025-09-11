import React, { useState } from "react";
import GoogleLoginButton from "./GoogleLoginButton";
import Loader from "../Common/Loader";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================
  // Normal login
  // =========================
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      // JSON parse kar ke data me store
      const data = await response.json();

      // status check
      if (response.ok) {
        setMessage("Login successful!");
      } else {
        setMessage(data.message || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setMessage("Login failed due to network error");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Google login success
  // =========================
  const handleGoogleSuccess = async (credentialResponse) => {
    setMessage("");
    setLoading(true);
    // Debug log credential
    console.log("Google credentialResponse:", credentialResponse);
    if (!credentialResponse || !credentialResponse.credential) {
      setMessage("No Google token received. Please try again.");
      setLoading(false);
      return;
    }
    try {
      const { data } = await axios.post(
        `${API_URL}/api/auth/google`,
        { token: credentialResponse.credential },
        { withCredentials: true }
      );
      setMessage(data.message || "Google login successful!");
    } catch (err) {
      setMessage(err.response?.data?.message || "Google login failed");
    } finally {
      setLoading(false);
      setLoading(false);
    }
  };

  // =========================
  // Google login error
  // =========================
  const handleGoogleError = () => {
    setMessage("Google login failed");
  };

  // =========================
  // JSX return
  // =========================
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-full max-w-md p-6 border rounded shadow">
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? <Loader /> : "Login"}
          </button>
        </form>

        <div className="my-4 text-center">or</div>

        <GoogleLoginButton
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
        />

        <div className="mt-4 text-center">
          <a href="/signup" className="text-blue-500 hover:underline">
            Don't have an account? Sign Up
          </a>
        </div>

        {message && (
          <div className="mt-4 text-center text-red-500">{message}</div>
        )}
      </div>
    </div>
  );
};

export default Login;
