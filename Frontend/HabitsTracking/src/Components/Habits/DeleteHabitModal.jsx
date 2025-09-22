import React from 'react';

const DeleteHabitModal = ({ isOpen, onClose, onConfirm, habit }) => {
  if (!isOpen || !habit) return null;

  const handleDelete = () => {
    onConfirm(habit.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-sm animate-fadein"
        style={{background: 'rgba(0, 0, 0, 0.5)'}}
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="relative w-full max-w-sm">
        <div className="card-floating animate-slide-up" style={{background: 'var(--color-surface)'}}>
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{color: 'var(--color-text)'}}>
              Delete Habit
            </h2>
            <p className="text-sm" style={{color: 'var(--color-text-muted)'}}>
              Are you sure you want to delete "{habit.name}"? This action cannot be undone.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border font-medium transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              style={{
                background: 'var(--color-bg)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-muted)'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-all duration-200"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteHabitModal;