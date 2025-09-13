import React, { useEffect, useState } from 'react';
import { fetchFriends, removeFriend, fetchFriendRequests, acceptFriendRequest, rejectFriendRequest } from '../../api/friends';
import { FaUserFriends, FaTrash, FaEye, FaCheck, FaTimes, FaUserPlus, FaUserClock } from 'react-icons/fa';

export default function FriendsList() {
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'requests', 'sent'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const friendsData = await fetchFriends();
      const requestsData = await fetchFriendRequests();
      setFriends(friendsData);
      setFriendRequests(requestsData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    try {
      await removeFriend(friendId);
      setFriends(friends.filter(f => f._id !== friendId));
    } catch (err) {
      setError('Failed to remove friend');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await acceptFriendRequest(requestId);
      loadFriends(); // Reload to get updated lists
    } catch (err) {
      setError('Failed to accept friend request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await rejectFriendRequest(requestId);
      loadFriends(); // Reload to get updated lists
    } catch (err) {
      setError('Failed to reject friend request');
    }
  };

  if (loading) return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <FaUserFriends className="text-blue-400" />
        <h3 className="text-white font-semibold">Friends</h3>
      </div>
      <div className="text-slate-400 text-sm">Loading friends...</div>
    </div>
  );

  if (error) return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <FaUserFriends className="text-blue-400" />
        <h3 className="text-white font-semibold">Friends</h3>
      </div>
      <div className="text-red-400 text-sm">{error}</div>
    </div>
  );

  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FaUserFriends className="text-blue-400" />
          <h3 className="text-white font-semibold">Friends & Requests</h3>
        </div>
        <button onClick={loadFriends} className="text-xs px-3 py-1 bg-slate-600 rounded text-white hover:bg-slate-500 transition-colors">
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-700 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'friends' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FaUserFriends />
          Friends ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'requests' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FaUserClock />
          Requests ({friendRequests.length})
        </button>
      </div>

      {/* Friends Tab */}
      {activeTab === 'friends' && (
        <div>
          {friends.length === 0 ? (
            <div className="text-slate-400 text-sm text-center py-8">
              <FaUserPlus className="mx-auto mb-2 text-2xl" />
              <p>No friends yet.</p>
              <p>Start by inviting someone!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <div key={friend._id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {friend.name ? friend.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="text-white font-medium">{friend.name || 'Unknown User'}</div>
                      <div className="text-slate-400 text-sm">{friend.email}</div>
                      <div className="text-xs text-green-400 mt-1">✓ Connected</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
                      title="View Progress"
                    >
                      <FaEye />
                    </button>
                    <button
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                      title="Remove Friend"
                      onClick={() => handleRemoveFriend(friend._id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Friend Requests Tab */}
      {activeTab === 'requests' && (
        <div>
          {friendRequests.length === 0 ? (
            <div className="text-slate-400 text-sm text-center py-8">
              <FaUserClock className="mx-auto mb-2 text-2xl" />
              <p>No pending friend requests.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {friendRequests.map((request) => (
                <div key={request._id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg border-l-4 border-yellow-500">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {request.from?.name ? request.from.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="text-white font-medium">{request.from?.name || 'Unknown User'}</div>
                      <div className="text-slate-400 text-sm">{request.from?.email}</div>
                      <div className="text-xs text-yellow-400 mt-1">🔔 Wants to be friends</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors flex items-center gap-1"
                      onClick={() => handleAcceptRequest(request._id)}
                    >
                      <FaCheck />
                      Accept
                    </button>
                    <button
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors flex items-center gap-1"
                      onClick={() => handleRejectRequest(request._id)}
                    >
                      <FaTimes />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-md text-red-300 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
