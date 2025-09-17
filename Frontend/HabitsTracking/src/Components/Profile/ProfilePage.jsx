import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaCamera, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import ProfilePictureUpload from './ProfilePictureUpload';

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState({
    name: "Guest",
    email: null,
    profilePicture: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    // Load user data from localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setCurrentUser(userData);
      setEditData(userData);
    }
  }, []);

  const handleSave = () => {
    // Update localStorage
    localStorage.setItem('currentUser', JSON.stringify(editData));
    setCurrentUser(editData);
    setIsEditing(false);
    
    // Dispatch event to update other components
    window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: editData }));
  };

  const handleCancel = () => {
    setEditData(currentUser);
    setIsEditing(false);
  };

  const handleProfilePictureUpdate = (newPictureUrl) => {
    const updatedUser = { ...currentUser, profilePicture: newPictureUrl };
    setCurrentUser(updatedUser);
    setEditData(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: updatedUser }));
    setShowUploadModal(false);
  };

  return (
    <div className="max-w-2xl mx-auto card animate-fadein">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-blue-400 mb-2 animate-pop">User Profile</h1>
        <p className="text-muted">Manage your account information</p>
      </div>

      {/* Profile Picture Section */}
      <div className="flex flex-col items-center mb-8 animate-fadein">
        <div className="relative mb-4">
          {currentUser.profilePicture ? (
            <img 
              src={currentUser.profilePicture}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-blue-400 shadow animate-pop"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-blue-700 flex items-center justify-center text-white text-2xl font-bold border-4 border-blue-400 shadow animate-pop">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          )}
          <button
            onClick={() => setShowUploadModal(true)}
            className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow transition-colors animate-pop"
            aria-label="Change profile picture"
          >
            <FaCamera className="text-sm" />
          </button>
        </div>
        <h2 className="text-xl font-semibold text-white">{currentUser.name}</h2>
        {currentUser.email && (
          <p className="text-muted">{currentUser.email}</p>
        )}
      </div>

      {/* Profile Information */}
      <div className="space-y-6 animate-fadein">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-blue-400">Profile Information</h3>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-accent flex items-center gap-2 animate-pop"
            >
              <FaEdit className="text-sm" />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="btn btn-success flex items-center gap-2 animate-pop"
              >
                <FaSave className="text-sm" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="btn flex items-center gap-2 animate-pop"
              >
                <FaTimes className="text-sm" />
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Name Field */}
        <div className="bg-[var(--color-bg-alt)] rounded-lg p-4 animate-fadein">
          <div className="flex items-center gap-3 mb-2">
            <FaUser className="text-blue-400" />
            <label className="text-white font-medium">Name</label>
          </div>
          {isEditing ? (
            <input
              type="text"
              value={editData.name || ''}
              onChange={(e) => setEditData({...editData, name: e.target.value})}
              className="input w-full"
              placeholder="Enter your name"
            />
          ) : (
            <p className="text-muted pl-6">{currentUser.name || 'Not set'}</p>
          )}
        </div>

        {/* Email Field */}
        <div className="bg-[var(--color-bg-alt)] rounded-lg p-4 animate-fadein">
          <div className="flex items-center gap-3 mb-2">
            <FaEnvelope className="text-blue-400" />
            <label className="text-white font-medium">Email</label>
          </div>
          {isEditing ? (
            <input
              type="email"
              value={editData.email || ''}
              onChange={(e) => setEditData({...editData, email: e.target.value})}
              className="input w-full"
              placeholder="Enter your email"
            />
          ) : (
            <p className="text-muted pl-6">{currentUser.email || 'Not set'}</p>
          )}
        </div>
      </div>

      {/* Profile Picture Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadein" role="dialog" aria-modal="true">
          <div className="card max-w-md w-full mx-4 animate-pop">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-blue-400">Update Profile Picture</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-muted hover:text-blue-400 transition-colors text-xl"
                aria-label="Close modal"
              >
                <FaTimes />
              </button>
            </div>
            <ProfilePictureUpload 
              onUpload={handleProfilePictureUpdate}
              currentPicture={currentUser.profilePicture}
            />
          </div>
        </div>
      )}
    </div>
  );
}