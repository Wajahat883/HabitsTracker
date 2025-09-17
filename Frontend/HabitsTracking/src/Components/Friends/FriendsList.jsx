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
      const normFriends = Array.isArray(friendsData)
        ? friendsData
        : Array.isArray(friendsData?.data)
          ? friendsData.data
          : Array.isArray(friendsData?.friends)
            ? friendsData.friends
            : [];
      const normRequests = Array.isArray(requestsData)
        ? requestsData
        : Array.isArray(requestsData?.data)
          ? requestsData.data
          : Array.isArray(requestsData?.requests)
            ? requestsData.requests
            : [];
      setFriends(normFriends);
      setFriendRequests(normRequests);
    } catch (e) {
      setError(e.message || 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    try {
      await removeFriend(friendId);
      setFriends(friends.filter(f => f._id !== friendId));
    } catch {
      setError('Failed to remove friend');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await acceptFriendRequest(requestId);
      loadFriends(); // Reload to get updated lists
    } catch {
      setError('Failed to accept friend request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await rejectFriendRequest(requestId);
      loadFriends(); // Reload to get updated lists
    } catch {
      setError('Failed to reject friend request');
    }
  };

  if (loading) return (
    <div className="card animate-fadein">
      <div className="flex items-center gap-2 mb-4">
        <FaUserFriends className="text-blue-400" />
        <h3 className="text-xl font-bold text-blue-400">Friends</h3>
      </div>
      <div className="text-muted text-sm animate-pulse">Loading friends...</div>
    </div>
  );

  if (error) return (
    <div className="card animate-fadein">
      <div className="flex items-center gap-2 mb-4">
        <FaUserFriends className="text-blue-400" />
        <h3 className="text-xl font-bold text-blue-400">Friends</h3>
      </div>
      <div className="text-red-400 text-sm animate-shake">{error}</div>
    </div>
  );

  return (
    <div className="card animate-fadein">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FaUserFriends className="text-blue-400 text-2xl" />
          <h3 className="text-xl font-bold text-blue-400">Friends & Requests</h3>
        </div>
        <button onClick={loadFriends} className="btn btn-accent text-xs animate-pop">Refresh</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-[var(--color-bg-alt)] p-1 rounded-lg animate-fadein">
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-semibold transition-all duration-150 ${
            activeTab === 'friends' ? 'bg-blue-600 text-white shadow animate-pop' : 'text-muted hover:text-white'
          }`}
        >
          <FaUserFriends />
          Friends ({Array.isArray(friends) ? friends.length : 0})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-semibold transition-all duration-150 ${
            activeTab === 'requests' ? 'bg-blue-600 text-white shadow animate-pop' : 'text-muted hover:text-white'
          }`}
        >
          <FaUserClock />
          Requests ({Array.isArray(friendRequests) ? friendRequests.length : 0})
        </button>
      </div>

      {/* Friends Tab */}
      {activeTab === 'friends' && (
        <div className="animate-fadein">
          {!Array.isArray(friends) || friends.length === 0 ? (
            <div className="text-muted text-sm text-center py-8 animate-fadein">
              <FaUserPlus className="mx-auto mb-2 text-2xl animate-pop" />
              <p>No friends yet.</p>
              <p>Start by inviting someone!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Array.isArray(friends) ? friends.map((friend) => (
                <div key={friend._id} className="flex items-center justify-between p-3 bg-[var(--color-bg-alt)] rounded-lg shadow-sm animate-fadein">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg animate-pop">
                      {friend.name ? friend.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="text-white font-medium">{friend.name || 'Unknown User'}</div>
                      <div className="text-muted text-sm">{friend.email}</div>
                      <div className="text-xs text-green-400 mt-1">✓ Connected</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="btn px-2 py-1 text-blue-400 hover:text-blue-600 animate-pop"
                      title="View Progress"
                    >
                      <FaEye />
                    </button>
                    <button
                      className="btn btn-danger px-2 py-1 animate-pop"
                      title="Remove Friend"
                      onClick={() => handleRemoveFriend(friend._id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              )) : null}
            </div>
          )}
        </div>
      )}

      {/* Friend Requests Tab */}
      {activeTab === 'requests' && (
        <div className="animate-fadein">
          {!Array.isArray(friendRequests) || friendRequests.length === 0 ? (
            <div className="text-muted text-sm text-center py-8 animate-fadein">
              <FaUserClock className="mx-auto mb-2 text-2xl animate-pop" />
              <p>No pending friend requests.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Array.isArray(friendRequests) ? friendRequests.map((request) => (
                <div key={request._id} className="flex items-center justify-between p-3 bg-[var(--color-bg-alt)] rounded-lg border-l-4 border-yellow-500 shadow-sm animate-fadein">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold text-lg animate-pop">
                      {request.from?.name ? request.from.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="text-white font-medium">{request.from?.name || 'Unknown User'}</div>
                      <div className="text-muted text-sm">{request.from?.email}</div>
                      <div className="text-xs text-yellow-400 mt-1">🔔 Wants to be friends</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="btn btn-success px-3 py-1 flex items-center gap-1 animate-pop"
                      onClick={() => handleAcceptRequest(request._id)}
                    >
                      <FaCheck />
                      Accept
                    </button>
                    <button
                      className="btn btn-danger px-3 py-1 flex items-center gap-1 animate-pop"
                      onClick={() => handleRejectRequest(request._id)}
                    >
                      <FaTimes />
                      Reject
                    </button>
                  </div>
                </div>
              )) : null}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-md text-red-300 text-sm animate-shake">
          {error}
        </div>
      )}
    </div>
  );
}
