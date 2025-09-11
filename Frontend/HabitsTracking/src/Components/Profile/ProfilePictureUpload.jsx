import React, { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const ProfilePictureUpload = ({ onUpload }) => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file.");
      return;
    }
    setLoading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("profilePicture", file);
    try {
      const res = await axios.post(`${API_URL}/api/user/upload-profile-picture`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      setMessage("Upload successful!");
      if (onUpload) onUpload(res.data);
    } catch (err) {
      setMessage(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-4">
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={loading} className="ml-2 bg-blue-500 text-white px-3 py-1 rounded">
        {loading ? "Uploading..." : "Upload"}
      </button>
      {message && <div className="mt-2 text-red-500">{message}</div>}
    </div>
  );
};

export default ProfilePictureUpload;
