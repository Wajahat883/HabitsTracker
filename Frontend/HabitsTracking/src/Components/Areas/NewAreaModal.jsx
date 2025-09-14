import React, { useState } from 'react';

const NewAreaModal = ({ onClose, onCreate, existingNames = [] }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError('Name required');
    if (existingNames.map(n=>n.toLowerCase()).includes(trimmed.toLowerCase())) {
      return setError('Folder name already exists');
    }
    onCreate(trimmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-slate-800 w-full max-w-sm rounded-xl shadow-2xl border border-slate-700 p-6">
        <h3 className="text-white font-semibold text-lg mb-4">Create New Area</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase text-slate-400 mb-1">Folder Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e)=>{ setName(e.target.value); setError(''); }}
              className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500"
              placeholder="e.g. Health, Learning, Fitness"
              maxLength={40}
            />
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-slate-600 hover:bg-slate-500 text-white text-sm">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewAreaModal;