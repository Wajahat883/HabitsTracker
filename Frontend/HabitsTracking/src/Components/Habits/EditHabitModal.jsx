import React, { useState, useEffect } from 'react';

const EditHabitModal = ({ isOpen, onClose, onSubmit, habit }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Binary',
    privacy: 'Private (only you)',
    goal: '',
    unit: 'minutes',
    icon: '🎯'
  });

  const habitIcons = ['🎯', '🧘‍♂️', '📚', '💪', '💧', '🏃‍♀️', '🎨', '🎵', '💻', '🍎'];

  const privacyOptions = [
    'Private (only you)',
    'Share with friends',
    'Share with specific friends'
  ];

  const timeUnits = ['minutes', 'hours'];
  const goalUnits = ['workouts', 'glasses', 'pages', 'exercises', 'tasks'];

  // Initialize form with habit data when habit changes
  useEffect(() => {
    if (habit) {
      setFormData({
        name: habit.name || '',
        type: habit.frequencyType === 'daily' ? 'Binary' : habit.type || 'Binary',
        privacy: habit.privacy || 'Private (only you)',
        goal: habit.goal || habit.weeklyGoal || habit.dailyGoal || '',
        unit: habit.unit || 'minutes',
        icon: habit.icon || '🎯'
      });
    }
  }, [habit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const updatedData = {
      name: formData.name.trim(),
      icon: formData.icon,
      privacy: formData.privacy
    };

    // Add goal-specific fields based on type
    if (formData.type === 'Time-based') {
      updatedData.goal = parseInt(formData.goal) || 30;
      updatedData.unit = formData.unit;
    } else if (formData.type === 'Goal-oriented') {
      const isWeekly = formData.unit === 'workouts';
      if (isWeekly) {
        updatedData.weeklyGoal = parseInt(formData.goal) || 4;
      } else {
        updatedData.dailyGoal = parseInt(formData.goal) || 8;
      }
      updatedData.unit = formData.unit;
    }

    onSubmit(habit.id, updatedData);
    onClose();
  };

  const resetForm = () => {
    if (habit) {
      setFormData({
        name: habit.name || '',
        type: habit.frequencyType === 'daily' ? 'Binary' : habit.type || 'Binary',
        privacy: habit.privacy || 'Private (only you)',
        goal: habit.goal || habit.weeklyGoal || habit.dailyGoal || '',
        unit: habit.unit || 'minutes',
        icon: habit.icon || '🎯'
      });
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-sm animate-fadein"
        style={{background: 'rgba(0, 0, 0, 0.5)'}}
        onClick={handleClose}
      ></div>
      
      {/* Modal */}
      <div className="relative w-full max-w-md">
        <div className="card-floating animate-slide-up modal-scroll" style={{background: 'var(--color-surface)', maxHeight: '90vh', overflowY: 'auto'}}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{color: 'var(--color-text)'}}>Edit Habit</h2>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              style={{color: 'var(--color-text-muted)'}}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Habit Name */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                Habit Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                placeholder="e.g., Morning Meditation"
                className="w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{
                  background: 'var(--color-bg)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)'
                }}
                required
              />
            </div>

            {/* Icon Selection */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                Choose Icon
              </label>
              <div className="grid grid-cols-5 gap-2">
                {habitIcons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData(prev => ({...prev, icon}))}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all duration-200 ${
                      formData.icon === icon 
                        ? 'bg-blue-500 text-white shadow-lg' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    style={formData.icon === icon ? {} : {background: 'var(--color-bg)', borderColor: 'var(--color-border)', border: '1px solid'}}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Goal Settings for Time-based and Goal-oriented (if applicable) */}
            {(formData.type === 'Time-based' || formData.type === 'Goal-oriented') && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                  {formData.type === 'Time-based' ? 'Target Duration' : 'Target Goal'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.goal}
                    onChange={(e) => setFormData(prev => ({...prev, goal: e.target.value}))}
                    placeholder={formData.type === 'Time-based' ? '30' : '8'}
                    className="flex-1 px-4 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    style={{
                      background: 'var(--color-bg)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text)'
                    }}
                    min="1"
                    required
                  />
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({...prev, unit: e.target.value}))}
                    className="px-4 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    style={{
                      background: 'var(--color-bg)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text)'
                    }}
                  >
                    {(formData.type === 'Time-based' ? timeUnits : goalUnits).map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Privacy */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                Privacy
              </label>
              <div className="relative">
                <select
                  value={formData.privacy}
                  onChange={(e) => setFormData(prev => ({...prev, privacy: e.target.value}))}
                  className="w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  style={{
                    background: 'var(--color-bg)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)'
                  }}
                >
                  {privacyOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5" style={{color: 'var(--color-text-muted)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 px-4 rounded-xl border font-medium transition-all duration-200"
                style={{
                  background: 'var(--color-bg)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-muted)'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium transition-all duration-200"
              >
                Update Habit
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditHabitModal;