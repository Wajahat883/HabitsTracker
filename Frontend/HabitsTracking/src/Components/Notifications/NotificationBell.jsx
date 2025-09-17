import React, { useState, useEffect } from 'react';
import { FaBell, FaTimes, FaUserPlus, FaCheck, FaTrash, FaEye } from 'react-icons/fa';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification } from '../../api/users';
import { acceptFriendRequest, rejectFriendRequest } from '../../api/friends';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
    // Poll fallback every 45s (less frequent due to sockets)
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 45000);

    // Listen for socket events dispatched globally
    const onNew = (e) => {
      const notif = e.detail;
      setNotifications(prev => [notif, ...prev].slice(0,50));
      if (!notif.read) setUnreadCount(c => c + 1);
    };
    const onUnread = (e) => {
      const { count } = e.detail || {}; if (typeof count === 'number') setUnreadCount(count);
    };
    window.addEventListener('notification:new', onNew);
    window.addEventListener('notifications:unreadCount', onUnread);
  return () => {
      clearInterval(interval);
      window.removeEventListener('notification:new', onNew);
      window.removeEventListener('notifications:unreadCount', onUnread);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      if (typeof count === 'number' && !Number.isNaN(count)) setUnreadCount(count);
    } catch {
      // degrade silently
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleAcceptFriendRequest = async (notificationId, requestId) => {
    try {
      await acceptFriendRequest(requestId);
      await handleMarkAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, actionTaken: true } : n)
      );
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    }
  };

  const handleRejectFriendRequest = async (notificationId, requestId) => {
    try {
      await rejectFriendRequest(requestId);
      await handleMarkAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, actionTaken: true } : n)
      );
    } catch (error) {
      console.error('Failed to reject friend request:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      if (!notifications.find(n => n._id === notificationId)?.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'friend_request':
        return <FaUserPlus className="text-blue-400" />;
      case 'friend_accepted':
        return <FaCheck className="text-green-400" />;
      default:
        return <FaBell className="text-yellow-400" />;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadNotifications();
        }}
        className="relative p-2 text-slate-300 hover:text-white transition-colors"
      >
        <FaBell className="text-xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <h3 className="text-white font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-slate-400">Loading...</div>
            ) : !Array.isArray(notifications) || notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <FaBell className="mx-auto mb-2 text-2xl" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 border-b border-slate-700 last:border-b-0 ${
                    !notification.read ? 'bg-slate-700/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-white font-medium text-sm">
                            {notification.title}
                          </h4>
                          <p className="text-slate-300 text-sm mt-1">
                            {notification.message}
                          </p>
                          <p className="text-slate-400 text-xs mt-2">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => handleDeleteNotification(notification._id)}
                          className="text-slate-400 hover:text-red-400 p-1"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </div>

                      {/* Friend Request Actions */}
                      {notification.type === 'friend_request' && !notification.actionTaken && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleAcceptFriendRequest(
                              notification._id,
                              notification.data?.friendRequestId
                            )}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectFriendRequest(
                              notification._id,
                              notification.data?.friendRequestId
                            )}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-md transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {/* Mark as Read Button */}
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification._id)}
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs mt-2"
                        >
                          <FaEye />
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}