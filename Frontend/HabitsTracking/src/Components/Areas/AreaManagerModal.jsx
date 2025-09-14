import React, { useState } from 'react';

const genId = () => (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

const AreaManagerModal = ({ areas, onCreate, onSelect, onClose }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError('Name required');
    if (areas.some(a => a.name.toLowerCase() === trimmed.toLowerCase())) return setError('Name already exists');
    onCreate({ id: genId(), name: trimmed, createdAt: Date.now(), habits: [], groups: [] });
    setName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60">
      <div className="bg-slate-800 w-full max-w-2xl rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h3 className="text-white font-semibold">Areas</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
          <form onSubmit={submit} className="flex gap-3 items-start">
            <div className="flex-1">
              <input
                value={name}
                onChange={e=>{ setName(e.target.value); setError(''); }}
                placeholder="New area name"
                className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600 focus:outline-none focus:border-blue-500"
                maxLength={40}
              />
              {error && <div className="text-red-400 text-xs mt-1">{error}</div>}
            </div>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Add</button>
          </form>
          {areas.length === 0 ? (
            <div className="text-slate-400 text-sm">No areas yet. Create your first one above.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {areas.map(a => (
                <button
                  key={a.id}
                  onClick={()=> onSelect(a)}
                  className="bg-slate-700 hover:bg-slate-600 text-left p-4 rounded-lg border border-slate-600 group transition flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium truncate">{a.name}</span>
                    <span className="text-xs text-slate-400 ml-2">{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-slate-400">
                    <span>{a.habits?.length || 0} habits</span>
                    <span>{a.groups?.length || 0} groups</span>
                  </div>
                  <div className="h-1 w-full bg-slate-600 rounded overflow-hidden">
                    <div className="h-full bg-green-500 w-0 group-hover:w-full transition-all duration-500" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AreaManagerModal;