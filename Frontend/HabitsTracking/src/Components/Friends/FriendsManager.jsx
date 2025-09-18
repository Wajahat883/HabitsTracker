import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Heart, MessageCircle, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

const FriendsManager = ({ isOpen, onClose, activeTab = 'friends' }) => {
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [friends, setFriends] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingIds, setProcessingIds] = useState(new Set());

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/friends/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFriends(data.data.friends);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReceivedRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/friends/requests/received`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReceivedRequests(data.data);
      }
    } catch (error) {
      console.error('Error fetching received requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSentRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/friends/requests/sent`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSentRequests(data.data);
      }
    } catch (error) {
      console.error('Error fetching sent requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const respondToRequest = async (requestId, action) => {
    setProcessingIds(prev => new Set([...prev, requestId]));
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
        // Remove from received requests
        setReceivedRequests(prev => prev.filter(req => req._id !== requestId));
        
        // If accepted, refresh friends list
        if (action === 'accept') {
          fetchFriends();
        }
        
        // Show success message
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        toast.textContent = `Friend request ${action}ed!`;
        document.body.appendChild(toast);
        setTimeout(() => document.body.removeChild(toast), 3000);
      } else {
        throw new Error(`Failed to ${action} friend request`);
      }
    } catch (error) {
      console.error(`Error ${action}ing friend request:`, error);
      // Show error message
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      toast.textContent = error.message;
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const removeFriend = async (friendId) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    
    setProcessingIds(prev => new Set([...prev, friendId]));
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/friends/${friendId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setFriends(prev => prev.filter(friend => friend.friend._id !== friendId));
        
        // Show success message
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        toast.textContent = 'Friend removed successfully!';
        document.body.appendChild(toast);
        setTimeout(() => document.body.removeChild(toast), 3000);
      } else {
        throw new Error('Failed to remove friend');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      // Show error message
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      toast.textContent = error.message;
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(friendId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (currentTab === 'friends') {
        fetchFriends();
      } else if (currentTab === 'received') {
        fetchReceivedRequests();
      } else if (currentTab === 'sent') {
        fetchSentRequests();
      }
    }
  }, [isOpen, currentTab]);

  if (!isOpen) return null;

  const renderFriendsList = () => (
    <div className="space-y-3">
      {friends.map((friendship) => (
        <div key={friendship.friendshipId} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
          <div className="flex items-center gap-3">
            {/* Profile Picture */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
              {friendship.friend.profilePicture ? (
                <img
                  src={friendship.friend.profilePicture}
                  alt={friendship.friend.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                friendship.friend.username.charAt(0).toUpperCase()
              )}
            </div>

            {/* Friend Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {friendship.friend.username}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {friendship.friend.email}
              </p>
              <p className="text-xs text-gray-400">
                Friends since {new Date(friendship.since).toLocaleDateString()}
              </p>
            </div>

            {/* Friendship Type Badge */}
            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {friendship.type === 'following' ? 'Following' : 'Follower'}
            </div>

            {/* Remove Button */}
            <button
              onClick={() => removeFriend(friendship.friend._id)}
              disabled={processingIds.has(friendship.friend._id)}
              className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
            >
              {processingIds.has(friendship.friend._id) ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
              ) : (
                <X className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderReceivedRequests = () => (
    <div className="space-y-3">
      {receivedRequests.map((request) => (
        <div key={request._id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
          <div className="flex items-center gap-3">
            {/* Profile Picture */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-lg">
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

            {/* Sender Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {request.sender.username}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {request.sender.email}
              </p>
              {request.message && (
                <p className="text-sm text-gray-600 mt-1 italic">
                  "{request.message}"
                </p>
              )}
              <p className="text-xs text-gray-400">
                {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => respondToRequest(request._id, 'accept')}
                disabled={processingIds.has(request._id)}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {processingIds.has(request._id) ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    Accept
                  </>
                )}
              </button>
              <button
                onClick={() => respondToRequest(request._id, 'reject')}
                disabled={processingIds.has(request._id)}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                <UserX className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSentRequests = () => (
    <div className="space-y-3">
      {sentRequests.map((request) => (
        <div key={request._id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
          <div className="flex items-center gap-3">
            {/* Profile Picture */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-lg">
              {request.receiver.profilePicture ? (
                <img
                  src={request.receiver.profilePicture}
                  alt={request.receiver.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                request.receiver.username.charAt(0).toUpperCase()
              )}
            </div>

            {/* Receiver Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {request.receiver.username}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {request.receiver.email}
              </p>
              <p className="text-xs text-gray-400">
                Sent {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Status Badge */}
            <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
              Pending
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-96 h-full shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Friends
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setCurrentTab('friends')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              currentTab === 'friends'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setCurrentTab('received')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              currentTab === 'received'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Requests ({receivedRequests.length})
          </button>
          <button
            onClick={() => setCurrentTab('sent')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              currentTab === 'sent'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sent ({sentRequests.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {currentTab === 'friends' && (
                friends.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No friends yet</p>
                    <p className="text-sm">Start by discovering people!</p>
                  </div>
                ) : (
                  renderFriendsList()
                )
              )}

              {currentTab === 'received' && (
                receivedRequests.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No friend requests</p>
                    <p className="text-sm">You're all caught up!</p>
                  </div>
                ) : (
                  renderReceivedRequests()
                )
              )}

              {currentTab === 'sent' && (
                sentRequests.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Heart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No sent requests</p>
                    <p className="text-sm">Send some friend requests!</p>
                  </div>
                ) : (
                  renderSentRequests()
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsManager;