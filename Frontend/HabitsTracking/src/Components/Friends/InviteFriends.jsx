import React, { useState } from 'react';
import { inviteFriend } from '../../api/friends';
import { FaUserPlus, FaEnvelope, FaLink, FaCopy } from 'react-icons/fa';

export default function InviteFriends({ onInviteSent }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [inviteLink, setInviteLink] = useState('');

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');
    setSuccess('');
    setInviteLink('');

    try {
      const result = await inviteFriend({ email: email.trim() });
      
      if (result.link) {
        setInviteLink(window.location.origin + result.link);
        setSuccess('Invite link created! You can copy and share it.');
      } else {
        setSuccess('Friend invite sent successfully!');
      }
      
      setEmail('');
      if (onInviteSent) onInviteSent();
    } catch (err) {
      setError('Failed to send invite. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setSuccess('Link copied to clipboard!');
    } catch (err) {
      setError('Failed to copy link');
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <FaUserPlus className="text-green-400" />
        <h3 className="text-white font-semibold">Invite Friends</h3>
      </div>

      <div className="mb-4 p-4 bg-slate-700 rounded-lg">
        <h4 className="text-white font-medium mb-2">How Friend Invites Work:</h4>
        <ul className="text-slate-300 text-sm space-y-1">
          <li>• Enter your friend's email address</li>
          <li>• System will create an invite link</li>
          <li>• Share the link with your friend</li>
          <li>• They can join and become your habit buddy!</li>
        </ul>
      </div>

      <form onSubmit={handleInvite} className="space-y-4">
        <div>
          <label className="block text-slate-300 text-sm mb-2">
            <FaEnvelope className="inline mr-2" />
            Friend's Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="friend@example.com"
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              Sending...
            </>
          ) : (
            <>
              <FaUserPlus />
              Send Invite
            </>
          )}
        </button>
      </form>

      {success && (
        <div className="mt-4 p-3 bg-green-900 border border-green-700 rounded-lg text-green-300 text-sm">
          {success}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-900 border border-red-700 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {inviteLink && (
        <div className="mt-4 p-4 bg-green-900/20 border border-green-700 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <FaLink className="text-green-400" />
            <span className="text-green-300 font-medium">Invite Link Ready!</span>
          </div>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 p-3 bg-slate-600 text-white rounded-lg border border-slate-500 text-sm font-mono"
              />
              <button
                onClick={copyLink}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <FaCopy />
                Copy
              </button>
            </div>
            <div className="bg-slate-700 p-3 rounded-lg">
              <h4 className="text-white font-medium mb-2">How to share:</h4>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>• Copy the link above</li>
                <li>• Send it via WhatsApp, email, or any messaging app</li>
                <li>• Your friend clicks the link to join</li>
                <li>• You both become habit buddies! 🎉</li>
              </ul>
            </div>
          </div>
          <p className="text-green-400 text-xs mt-3 text-center">
            ✨ This link will allow <strong>{email}</strong> to become your habit tracking partner!
          </p>
        </div>
      )}
    </div>
  );
}
