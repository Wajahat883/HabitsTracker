import React, { useState, useEffect, useCallback } from 'react';
import { FaUsers, FaUserPlus, FaSpinner, FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { getAllUsers, searchUsers } from '../../api/users';
import { inviteFriend } from '../../api/friends';

export default function AllUsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sendingInvite, setSendingInvite] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const loadAllUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setIsSearching(false);
      
      const data = await getAllUsers(currentPage, 20);
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.users)
            ? data.users
            : [];
      setUsers(list);
      setTotalPages(Number(data?.totalPages) > 0 ? data.totalPages : 1);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  const performSearch = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setIsSearching(true);
      
      const results = await searchUsers(searchQuery);
      const list = Array.isArray(results)
        ? results
        : Array.isArray(results?.data)
          ? results.data
          : Array.isArray(results?.users)
            ? results.users
            : [];
      setUsers(list);
      setTotalPages(1); // Search doesn't have pagination
    } catch (error) {
      console.error('Error searching users:', error);
      setError('Failed to search users');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      performSearch();
    } else if (searchQuery.length === 0) {
      loadAllUsers();
    }
  }, [searchQuery, currentPage, loadAllUsers, performSearch]);

  const handleSendInvite = async (user) => {
    try {
      setSendingInvite(prev => ({ ...prev, [user._id]: true }));
      setError('');
      setSuccess('');
      
      await inviteFriend({ userId: user._id });
      setSuccess(`Friend request sent to ${user.username || user.email}!`);
      
      // Remove user from list after sending invite
      setUsers(prev => prev.filter(u => u._id !== user._id));
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('Error sending friend request:', error);
      setError('Failed to send friend request. They might already be your friend or request is pending.');
    } finally {
      setSendingInvite(prev => ({ ...prev, [user._id]: false }));
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && !isSearching) {
      setCurrentPage(newPage);
    }
  };

  const formatJoinDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
      <div className="flex items-center gap-2 mb-6">
        <FaUsers className="text-purple-400" />
        <h3 className="text-white font-semibold">All Users</h3>
  <span className="text-slate-400 text-sm">({Array.isArray(users) ? users.length : 0} users)</span>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none pl-10"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
        </div>
        
        <div className="flex justify-between items-center mt-2 text-sm text-slate-400">
          <span>
            {isSearching ? 'Search results' : `Page ${currentPage} of ${totalPages}`}
          </span>
          <span>
            {searchQuery.length > 0 ? 'Type to search users' : 'All registered users'}
          </span>
        </div>
      </div>

      {/* Success/Error Messages */}
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

      {/* Users List */}
      <div className="space-y-3 mb-6">
        {loading ? (
          <div className="text-center py-8">
            <FaSpinner className="animate-spin text-purple-400 text-2xl mx-auto mb-2" />
            <p className="text-slate-400">Loading users...</p>
          </div>
  ) : (!Array.isArray(users) || users.length === 0) ? (
          <div className="text-center py-8">
            <FaUsers className="text-slate-500 text-3xl mx-auto mb-2" />
            <p className="text-slate-400">
              {isSearching ? `No users found matching "${searchQuery}"` : 'No users found'}
            </p>
          </div>
        ) : (
          Array.isArray(users) ? users.map((user) => (
            <div key={user._id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
              <div className="flex items-center gap-4">
                {/* User Avatar */}
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {(user.username || user.email).charAt(0).toUpperCase()}
                </div>
                
                {/* User Info */}
                <div>
                  <div className="text-white font-medium">
                    {user.username || 'Unknown User'}
                  </div>
                  <div className="text-slate-400 text-sm">{user.email}</div>
                  <div className="text-slate-500 text-xs flex items-center gap-2 mt-1">
                    <span>Joined {formatJoinDate(user.createdAt)}</span>
                    <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
                    <span className="text-green-400">Active User</span>
                  </div>
                </div>
              </div>

              {/* Add Friend Button */}
              <button
                onClick={() => handleSendInvite(user)}
                disabled={sendingInvite[user._id]}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
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
          )) : null
        )}
      </div>

      {/* Pagination */}
      {!isSearching && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <FaChevronLeft />
            Previous
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">
              Page {currentPage} of {totalPages}
            </span>
          </div>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Next
            <FaChevronRight />
          </button>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-slate-700 rounded-lg">
        <h4 className="text-white font-medium mb-2">How Friend Requests Work:</h4>
        <ul className="text-slate-300 text-sm space-y-1">
          <li>• Browse all registered users or search for specific ones</li>
          <li>• Click "Add Friend" to send a friend request</li>
          <li>• They'll get a notification about your request</li>
          <li>• If they accept, you become habit buddies! 🎉</li>
          <li>• Share progress and motivate each other</li>
        </ul>
      </div>
    </div>
  );
}
