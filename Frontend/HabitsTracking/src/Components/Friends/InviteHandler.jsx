import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUserPlus, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';

export default function InviteHandler() {
  const { inviteId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState(null);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    loadInviteDetails();
  }, [inviteId]);

  const loadInviteDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}/api/friends/invite/${inviteId}`);
      
      if (!response.ok) {
        throw new Error('Invite not found or expired');
      }
      
      const data = await response.json();
      setInviteData(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const acceptInvite = async () => {
    try {
      setAccepting(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}/api/friends/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ inviteId })
      });

      if (!response.ok) {
        throw new Error('Failed to accept invite');
      }

      // Redirect to dashboard or friends page
      navigate('/dashboard', { 
        state: { message: `You are now friends with ${inviteData.from.name}!` }
      });
    } catch (err) {
      setError('Failed to accept invite. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  const rejectInvite = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="bg-slate-800 p-8 rounded-xl shadow-lg text-center">
          <FaSpinner className="animate-spin text-blue-400 text-4xl mx-auto mb-4" />
          <h2 className="text-white text-xl font-semibold">Loading invite...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="bg-slate-800 p-8 rounded-xl shadow-lg text-center max-w-md">
          <FaTimes className="text-red-400 text-4xl mx-auto mb-4" />
          <h2 className="text-white text-xl font-semibold mb-2">Invite Error</h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-xl shadow-lg text-center max-w-md">
        <FaUserPlus className="text-green-400 text-4xl mx-auto mb-4" />
        <h2 className="text-white text-2xl font-semibold mb-2">Friend Invite</h2>
        
        {inviteData && (
          <>
            <div className="mb-6">
              <p className="text-slate-300 mb-2">
                <span className="font-semibold text-white">{inviteData.from.name}</span> wants to be your habit buddy!
              </p>
              <p className="text-slate-400 text-sm">
                Email: {inviteData.from.email}
              </p>
              {inviteData.inviteEmail && (
                <p className="text-slate-400 text-sm">
                  Invited: {inviteData.inviteEmail}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={acceptInvite}
                disabled={accepting}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {accepting ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    <FaCheck />
                    Accept Friend Request
                  </>
                )}
              </button>
              
              <button
                onClick={rejectInvite}
                className="w-full px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <FaTimes />
                Maybe Later
              </button>
            </div>

            <p className="text-slate-400 text-xs mt-4">
              By accepting, you'll be able to share habit progress and motivate each other!
            </p>
          </>
        )}
      </div>
    </div>
  );
}
