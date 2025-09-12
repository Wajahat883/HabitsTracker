import React, { useState } from 'react';
import { createGroup } from '../../api/groups';
import { useHabitContext } from '../../context/HabitContext';

export default function GroupForm() {
  const { setGroups } = useHabitContext();
  const [name, setName] = useState('');
  const [memberIds, setMemberIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const group = await createGroup(name, memberIds);
      setGroups(prev => [group, ...prev]);
      setName(''); setMemberIds([]);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4 bg-slate-800 p-4 rounded-lg border border-slate-700">
      <h3 className="text-lg font-semibold text-blue-300">Create Group</h3>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <div>
        <label className="block text-sm text-slate-300 mb-1">Group Name</label>
        <input value={name} onChange={e => setName(e.target.value)} required className="w-full bg-slate-700 text-white rounded p-2" />
      </div>
      <div>
        <label className="block text-sm text-slate-300 mb-1">Member IDs (comma separated)</label>
        <input value={memberIds.join(',')} onChange={e => setMemberIds(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className="w-full bg-slate-700 text-white rounded p-2" />
      </div>
      <button disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded">{loading ? 'Creating...' : 'Create Group'}</button>
    </form>
  );
}
