import React, { useState } from 'react';

const HabitModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Binary',
    privacy: 'Private (only you)',
    goal: '',
    unit: 'minutes',
    icon: '🎯'
  });

  const habitIcons = ['🎯', '🧘‍♂️', '📚', '💪', '💧', '🏃‍♀️', '🎨', '🎵', '💻', '🍎'];
  const habitTypes = [
    {
      id: 'Binary',
      label: 'Binary',
      description: 'Yes/No tracking (e.g., "Did I meditate today?")'
    },
    {
      id: 'Time-based',
      label: 'Time-based',
      description: 'Duration tracking (e.g., "Read for 30 minutes")'
    },
    {
      id: 'Goal-oriented',
      label: 'Goal-oriented',
      description: 'Quantity tracking (e.g., "Complete 3 workouts this week")'
    }
  ];

  const privacyOptions = [
    'Private (only you)',
    'Share with friends',
    'Share with specific friends'
  ];

  const timeUnits = ['minutes', 'hours'];
  const goalUnits = ['workouts', 'glasses', 'pages', 'exercises', 'tasks'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const habitData = {
      id: Date.now(),
      name: formData.name.trim(),
      type: formData.type,
      icon: formData.icon,
      color: getRandomColor(),
      completed: false,
      streak: 0,
      progress: 0,
      current: 0
    };

    if (formData.type === 'Time-based') {
      habitData.goal = parseInt(formData.goal) || 30;
      habitData.unit = formData.unit;
    } else if (formData.type === 'Goal-oriented') {
      const isWeekly = formData.unit === 'workouts';
      if (isWeekly) {
        habitData.weeklyGoal = parseInt(formData.goal) || 4;
      } else {
        habitData.dailyGoal = parseInt(formData.goal) || 8;
      }
      habitData.unit = formData.unit;
    }

    onSubmit(habitData);
    resetForm();
    onClose();
  };

  const getRandomColor = () => {
    const colors = ['emerald', 'blue', 'orange', 'cyan', 'purple', 'pink', 'indigo', 'teal'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'Binary',
      privacy: 'Private (only you)',
      goal: '',
      unit: 'minutes',
      icon: '🎯'
    });
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
            <h2 className="text-2xl font-bold" style={{color: 'var(--color-text)'}}>Create New Habit</h2>
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

            {/* Habit Type */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{color: 'var(--color-text)'}}>
                Habit Type
              </label>
              <div className="space-y-3">
                {habitTypes.map((type) => (
                  <div key={type.id}>
                    <label className="flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 hover-lift" 
                           style={{
                             background: formData.type === type.id ? 'var(--color-primary-light)' : 'var(--color-bg)',
                             borderColor: formData.type === type.id ? 'var(--color-primary)' : 'var(--color-border)'
                           }}>
                      <input
                        type="radio"
                        name="type"
                        value={type.id}
                        checked={formData.type === type.id}
                        onChange={(e) => setFormData(prev => ({...prev, type: e.target.value}))}
                        className="mt-1 w-4 h-4 text-blue-600"
                      />
                      <div>
                        <div className="font-medium" style={{color: 'var(--color-text)'}}>{type.label}</div>
                        <div className="text-sm" style={{color: 'var(--color-text-muted)'}}>{type.description}</div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Goal Settings for Time-based and Goal-oriented */}
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
                className="flex-1 py-3 px-4 rounded-xl border font-medium transition-all duration-200 hover-lift"
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
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium transition-all duration-200 hover-lift hover:shadow-lg"
              >
                Create Habit
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HabitModal;