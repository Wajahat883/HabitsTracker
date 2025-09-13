import React, { useEffect, useState } from 'react';
import { fetchFriends, removeFriend } from '../../api/friends';
import { FaUserFriends, FaTrash, FaEye } from 'react-icons/fa';

export default function FriendsList() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const data = await fetchFriends();
      setFriends(data);
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
    } catch (e) {
      setError('Failed to remove friend');
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
      <div className="flex items-center gap-2 mb-4">
        <FaUserFriends className="text-blue-400" />
        <h3 className="text-white font-semibold">Friends ({friends.length})</h3>
      </div>

      {friends.length === 0 ? (
        <div className="text-slate-400 text-sm text-center py-8">
          No friends yet. Start by inviting someone!
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
                  {friend.status && (
                    <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                      friend.status === 'accepted' ? 'bg-green-900 text-green-300' :
                      friend.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-gray-900 text-gray-300'
                    }`}>
                      {friend.status}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
                  title="View Progress"
                  onClick={() => {
                    // TODO: Navigate to friend's progress view
                    console.log('View friend progress:', friend._id);
                  }}
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
  );
}
