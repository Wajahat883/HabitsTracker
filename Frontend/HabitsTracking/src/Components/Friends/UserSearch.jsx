import React, { useState, useEffect } from 'react';
import { FaSearch, FaUserPlus, FaSpinner } from 'react-icons/fa';
import { searchUsers } from '../../api/users';
import { inviteFriend } from '../../api/friends';

export default function UserSearch() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sendingInvite, setSendingInvite] = useState({});

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (query.length >= 2) {
        performSearch();
      } else {
        setUsers([]);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [query]);

  const performSearch = async () => {
    try {
      setLoading(true);
      setError('');
      const results = await searchUsers(query);
      setUsers(results);
    } catch (err) {
      setError('Failed to search users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async (user) => {
    try {
      setSendingInvite(prev => ({ ...prev, [user._id]: true }));
      setError('');
      setSuccess('');
      
      await inviteFriend({ userId: user._id });
      setSuccess(`Friend request sent to ${user.username || user.email}!`);
      
      // Remove user from search results after sending invite
      setUsers(prev => prev.filter(u => u._id !== user._id));
      
    } catch (err) {
      setError('Failed to send friend request');
    } finally {
      setSendingInvite(prev => ({ ...prev, [user._id]: false }));
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <FaSearch className="text-blue-400" />
        <h3 className="text-white font-semibold">Find Friends</h3>
      </div>

      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email or username..."
            className="w-full p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none pl-10"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          
          {loading && (
            <FaSpinner className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 animate-spin" />
          )}
        </div>
        
        {query.length > 0 && query.length < 2 && (
          <p className="text-slate-400 text-sm mt-2">Type at least 2 characters to search</p>
        )}
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-lg text-green-300 text-sm">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Search Results */}
      <div className="space-y-3">
        {users.length === 0 && query.length >= 2 && !loading && (
          <div className="text-slate-400 text-sm text-center py-4">
            No users found matching "{query}"
          </div>
        )}

        {users.map((user) => (
          <div key={user._id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold">
                {(user.username || user.email).charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-white font-medium">
                  {user.username || 'Unknown User'}
                </div>
                <div className="text-slate-400 text-sm">{user.email}</div>
                <div className="text-slate-500 text-xs">
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSendInvite(user)}
              disabled={sendingInvite[user._id]}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {sendingInvite[user._id] ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <FaUserPlus />
                  Add Friend
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-slate-700 rounded-lg">
        <h4 className="text-white font-medium mb-2">How to find friends:</h4>
        <ul className="text-slate-300 text-sm space-y-1">
          <li>• Search by their email address</li>
          <li>• Search by their username</li>
          <li>• Send them a friend request</li>
          <li>• They'll get a notification to accept!</li>
        </ul>
      </div>
    </div>
  );
}
