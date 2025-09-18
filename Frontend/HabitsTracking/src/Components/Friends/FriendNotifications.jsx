import React, { useState, useEffect, useContext } from 'react';
import { Bell, Users, UserPlus, Check } from 'lucide-react';
import SocketContext from '../../context/SocketContext';

const API_URL = import.meta.env.VITE_API_URL;

const FriendNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const socket = useContext(SocketContext);

  const fetchNotificationCount = async () => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/friends/notifications/count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.data.count);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/friends/requests/received`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const respondToRequest = async (requestId, action) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/friends/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        // Remove notification from list
        setNotifications(prev => prev.filter(notif => notif._id !== requestId));
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Show success message
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        toast.textContent = `Friend request ${action}ed!`;
        document.body.appendChild(toast);
        setTimeout(() => document.body.removeChild(toast), 3000);
      }
    } catch (error) {
      console.error(`Error ${action}ing friend request:`, error);
    }
  };

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (socket && typeof socket.on === 'function') {
      const handleFriendRequest = (data) => {
        setUnreadCount(prev => prev + 1);
        setNotifications(prev => [data.request, ...prev]);
        
        // Show notification toast
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        toast.textContent = `New friend request from ${data.sender.username}`;
        document.body.appendChild(toast);
        setTimeout(() => document.body.removeChild(toast), 5000);
      };

      const handleFriendRequestAccepted = (data) => {
        // Show notification toast
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        toast.textContent = `${data.friend.username} accepted your friend request!`;
        document.body.appendChild(toast);
        setTimeout(() => document.body.removeChild(toast), 5000);
      };

      socket.on('friendRequest:received', handleFriendRequest);
      socket.on('friendRequest:accepted', handleFriendRequestAccepted);

      return () => {
        if (typeof socket.off === 'function') {
          socket.off('friendRequest:received', handleFriendRequest);
          socket.off('friendRequest:accepted', handleFriendRequestAccepted);
        }
      };
    }
  }, [socket]);

  useEffect(() => {
    fetchNotificationCount();
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Friend Requests
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No new friend requests</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((request) => (
                <div key={request._id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    {/* Profile Picture */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {request.sender.profilePicture ? (
                        <img
                          src={request.sender.profilePicture}
                          alt={request.sender.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        request.sender.username.charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{request.sender.username}</span> sent you a friend request
                      </p>
                      {request.message && (
                        <p className="text-xs text-gray-600 mt-1 italic">
                          "{request.message}"
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => respondToRequest(request._id, 'accept')}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          Accept
                        </button>
                        <button
                          onClick={() => respondToRequest(request._id, 'reject')}
                          className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* View All Link */}
          {notifications.length > 3 && (
            <div className="p-3 border-t border-gray-200">
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                View all requests
              </button>
            </div>
          )}
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default FriendNotifications;