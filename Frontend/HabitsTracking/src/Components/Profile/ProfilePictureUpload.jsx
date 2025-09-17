import React, { useState } from "react";
import { FaUpload, FaSpinner, FaImage } from "react-icons/fa";
import api from "../../config/axios";
import { showToast } from "../../config/toast";

const API_URL = import.meta.env.VITE_API_URL;

const ProfilePictureUpload = ({ onUpload, currentPicture }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(currentPicture);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    
    // Create preview
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(selectedFile);
    }
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
      const res = await api.post('/user/upload-profile-picture', formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const message = "Upload successful!";
      setMessage(message);
      showToast.success(message);
      if (onUpload) onUpload(res.data);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Upload failed";
      setMessage(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUrlUpload = () => {
    const imageUrl = prompt("Enter image URL:");
    if (imageUrl) {
      setPreview(imageUrl);
      if (onUpload) {
        onUpload(imageUrl);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="flex justify-center">
        {preview ? (
          <img 
            src={preview}
            alt="Preview"
            className="w-32 h-32 rounded-full object-cover border-4 border-blue-400"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-slate-600 flex items-center justify-center border-4 border-blue-400">
            <FaImage className="text-4xl text-slate-400" />
          </div>
        )}
      </div>

      {/* File Upload */}
      <div className="space-y-3">
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Upload from Device
          </label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg cursor-pointer transition-colors"
            >
              <FaUpload className="text-sm" />
              Choose File
            </label>
            {file && (
              <span className="text-slate-300 text-sm">{file.name}</span>
            )}
          </div>
        </div>

        {/* URL Upload */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Or use URL
          </label>
          <button
            onClick={handleUrlUpload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <FaImage className="text-sm" />
            Use Image URL
          </button>
        </div>

        {/* Upload Button */}
        {file && (
          <button
            onClick={handleUpload}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <FaUpload />
                Upload Picture
              </>
            )}
          </button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`text-center text-sm ${message.includes('successful') ? 'text-green-400' : 'text-red-400'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default ProfilePictureUpload;
