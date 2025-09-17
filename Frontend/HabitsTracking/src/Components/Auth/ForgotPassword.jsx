import React, { useState } from "react";
import api from "../../config/axios";
import { showToast } from "../../config/toast";

const API_URL = import.meta.env.VITE_API_URL;

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await api.post('/auth/forgot-password', { email });
      const message = res.data.message || "Password reset email sent!";
      setMessage(message);
      showToast.success(message);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to send reset email";
      setMessage(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow">
      <h2 className="text-xl mb-4">Forgot Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
      {message && <div className="mt-4 text-center text-red-500">{message}</div>}
    </div>
  );
};

export default ForgotPassword;
