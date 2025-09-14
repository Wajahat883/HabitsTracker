import React, { useState, useEffect } from 'react';
import ThemeProvider from '../../context/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL;

const ProfileSettingsForm = ({ onClose, onUpdated }) => {
  // Always call hook (guaranteed defined in ThemeProvider export pattern)
  const themeCtx = ThemeProvider.useTheme();
  const [form, setForm] = useState({ username: '', email: '', profilePicture: '', privacy: 'friends' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(()=>{
    try {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        const u = JSON.parse(stored);
        setForm(f => ({...f, username: u.name || u.username || '', email: u.email || '', profilePicture: u.profilePicture || ''}));
      }
  } catch { /* ignore json parse */ }
  },[]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        credentials: 'include',
        body: JSON.stringify({
          username: form.username?.trim(),
          email: form.email?.trim(),
          profilePicture: form.profilePicture?.trim(),
          privacy: form.privacy
        })
      });
      const json = await res.json().catch(()=>({}));
      if (!res.ok) {
        setError(json.message || json.error || 'Update failed');
        return;
      }
      const payload = json.data?.user || json.user || json.data || {};
      const updatedProfile = {
        name: payload.username || payload.name || form.username,
        email: payload.email || form.email,
        profilePicture: payload.profilePicture || form.profilePicture
      };
      localStorage.setItem('currentUser', JSON.stringify(updatedProfile));
      sessionStorage.setItem('currentUser', JSON.stringify(updatedProfile));
      window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: updatedProfile }));
      setSuccess('Profile updated');
      if (onUpdated) onUpdated(updatedProfile);
      setTimeout(()=> onClose && onClose(), 800);
  } catch {
      setError('Network error');
    } finally { setLoading(false); }
  };

  return (
    <div className="p-4">
      <h3 className="text-white font-semibold mb-4">Profile Settings</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase text-slate-400 mb-1">Username</label>
          <input name="username" value={form.username} onChange={handleChange} className="w-full bg-slate-700 text-white p-2 rounded border border-slate-600 focus:border-blue-500 outline-none" required />
        </div>
        <div>
          <label className="block text-xs uppercase text-slate-400 mb-1">Theme</label>
          <div className="flex items-center gap-3">
            <button type="button" onClick={()=> themeCtx?.setTheme('light')} className={`px-3 py-1 rounded border text-sm ${themeCtx?.theme==='light' ? 'bg-blue-600 text-white border-blue-500':'bg-slate-700 text-slate-300 border-slate-600'}`}>Light</button>
            <button type="button" onClick={()=> themeCtx?.setTheme('dark')} className={`px-3 py-1 rounded border text-sm ${themeCtx?.theme==='dark' ? 'bg-blue-600 text-white border-blue-500':'bg-slate-700 text-slate-300 border-slate-600'}`}>Dark</button>
            <button type="button" onClick={()=> themeCtx?.toggleTheme()} className="px-3 py-1 rounded border border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600 text-sm">Toggle</button>
          </div>
        </div>
        <div>
          <label className="block text-xs uppercase text-slate-400 mb-1">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full bg-slate-700 text-white p-2 rounded border border-slate-600 focus:border-blue-500 outline-none" required />
        </div>
        <div>
          <label className="block text-xs uppercase text-slate-400 mb-1">Profile Picture URL</label>
          <input name="profilePicture" value={form.profilePicture} onChange={handleChange} placeholder="https://..." className="w-full bg-slate-700 text-white p-2 rounded border border-slate-600 focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs uppercase text-slate-400 mb-1">Privacy</label>
          <select name="privacy" value={form.privacy} onChange={handleChange} className="w-full bg-slate-700 text-white p-2 rounded border border-slate-600 focus:border-blue-500 outline-none">
            <option value="public">Public</option>
            <option value="friends">Friends</option>
            <option value="private">Private</option>
          </select>
        </div>
        {error && <div className="text-red-400 text-sm">{error}</div>}
        {success && <div className="text-green-400 text-sm">{success}</div>}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded">{loading? 'Saving...' : 'Save'}</button>
          <button type="button" onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettingsForm;