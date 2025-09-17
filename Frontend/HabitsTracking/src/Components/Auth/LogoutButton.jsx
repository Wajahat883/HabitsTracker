import React from "react";
import api from "../../config/axios";
import { showToast } from "../../config/toast";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const LogoutButton = ({ onLogout }) => {
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      showToast.success('Logged out successfully');
      if (onLogout) onLogout();
      navigate("/login"); // Redirect to login after logout
    } catch (err) {
      showToast.error("Logout failed: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
    >
      Logout
    </button>
  );
};

export default LogoutButton;
