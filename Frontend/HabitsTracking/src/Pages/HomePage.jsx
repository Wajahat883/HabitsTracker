import React, { useState, useEffect } from 'react';

const HomePage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [habits, setHabits] = useState([
    {
      id: 1,
      name: "Morning Meditation",
      type: "Binary",
      streak: 1,
      completed: true,
      icon: "🧘‍♂️",
      color: "emerald"
    },
    {
      id: 2,
      name: "Reading",
      type: "Time-based",
      goal: 30,
      current: 25,
      unit: "minutes",
      progress: 83,
      completed: false,
      icon: "📚",
      color: "blue"
    },
    {
      id: 3,
      name: "Weekly Workouts",
      type: "Goal-oriented",
      weeklyGoal: 4,
      current: 0,
      unit: "workouts",
      progress: 0,
      completed: false,
      icon: "💪",
      color: "orange"
    },
    {
      id: 4,
      name: "Water Intake",
      type: "Goal-oriented",
      dailyGoal: 8,
      current: 5,
      unit: "glasses",
      progress: 62.5,
      completed: false,
      icon: "💧",
      color: "cyan"
    }
  ]);

  const [_overallStats, _setOverallStats] = useState({
    completed: 3,
    total: 4,
    percentage: 75
  });

  // Calculate stats dynamically
  const overallStats = {
    completed: habits.filter(h => h.completed || (h.progress && h.progress >= 100)).length,
    total: habits.length,
    percentage: Math.round((habits.filter(h => h.completed || (h.progress && h.progress >= 100)).length / habits.length) * 100)
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000 * 60); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const getColorClasses = (color, variant = 'primary') => {
    const colors = {
      emerald: {
        primary: 'text-emerald-500',
        bg: 'bg-emerald-500',
        border: 'border-emerald-500',
        light: 'bg-emerald-50 dark:bg-emerald-900/20',
        ring: 'ring-emerald-500'
      },
      blue: {
        primary: 'text-blue-500',
        bg: 'bg-blue-500',
        border: 'border-blue-500',
        light: 'bg-blue-50 dark:bg-blue-900/20',
        ring: 'ring-blue-500'
      },
      orange: {
        primary: 'text-orange-500',
        bg: 'bg-orange-500',
        border: 'border-orange-500',
        light: 'bg-orange-50 dark:bg-orange-900/20',
        ring: 'ring-orange-500'
      },
      cyan: {
        primary: 'text-cyan-500',
        bg: 'bg-cyan-500',
        border: 'border-cyan-500',
        light: 'bg-cyan-50 dark:bg-cyan-900/20',
        ring: 'ring-cyan-500'
      }
    };
    return colors[color]?.[variant] || '';
  };

  const updateHabit = (habitId, field, value) => {
    setHabits(prev => prev.map(habit => 
      habit.id === habitId ? { ...habit, [field]: value } : habit
    ));
  };

  const addTime = (habitId, minutes) => {
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      const newCurrent = Math.min(habit.current + minutes, habit.goal);
      const newProgress = (newCurrent / habit.goal) * 100;
      updateHabit(habitId, 'current', newCurrent);
      updateHabit(habitId, 'progress', newProgress);
    }
  };

  const addCount = (habitId, count) => {
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      const newCurrent = habit.current + count;
      const goalField = habit.weeklyGoal ? 'weeklyGoal' : 'dailyGoal';
      const newProgress = (newCurrent / habit[goalField]) * 100;
      updateHabit(habitId, 'current', newCurrent);
      updateHabit(habitId, 'progress', Math.min(newProgress, 100));
    }
  };

  return (
    <div className="min-h-screen" style={{background: 'var(--color-bg)'}}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold" style={{color: 'var(--color-text)'}}>
              Good morning, <span className="text-gradient">Jordan!</span>
            </h1>
            <span className="text-3xl animate-bounce">👋</span>
          </div>
          <p className="text-lg" style={{color: 'var(--color-text-muted)'}}>
            {formatDate(currentDate)}
          </p>
        </div>

        {/* Overall Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold" style={{color: 'var(--color-text)'}}>
              Today's Progress
            </h2>
            <div className="flex items-center gap-6 text-right">
              <div>
                <div className="text-2xl font-bold text-emerald-500">{overallStats.completed}</div>
                <div className="text-sm" style={{color: 'var(--color-text-muted)'}}>Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold" style={{color: 'var(--color-text)'}}>{overallStats.total}</div>
                <div className="text-sm" style={{color: 'var(--color-text-muted)'}}>Total Habits</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-500">{overallStats.percentage}%</div>
                <div className="text-sm" style={{color: 'var(--color-text-muted)'}}>Complete</div>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="relative h-3 rounded-full overflow-hidden" style={{background: 'var(--color-border)'}}>
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500 ease-out"
              style={{width: `${overallStats.percentage}%`}}
            ></div>
            <div className="absolute top-0 right-4 text-xs font-medium text-right pt-0.5" style={{color: 'var(--color-text)'}}>
              {overallStats.completed} of {overallStats.total} habits
            </div>
          </div>
        </div>

        {/* Habits Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold" style={{color: 'var(--color-text)'}}>
            Today's Habits
          </h2>
          <button className="btn-glass px-6 py-3 rounded-xl magnetic micro-bounce">
            <span className="flex items-center gap-2">
              <span className="text-xl">➕</span>
              Add Habit
            </span>
          </button>
        </div>

        {/* Habits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {habits.map((habit) => (
            <div key={habit.id} className="card-floating magnetic micro-bounce hover-lift">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl ${getColorClasses(habit.color, 'light')} flex items-center justify-center text-xl`}>
                    {habit.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg" style={{color: 'var(--color-text)'}}>{habit.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm px-2 py-1 rounded-full ${getColorClasses(habit.color, 'light')} ${getColorClasses(habit.color, 'primary')}`}>
                        {habit.type}
                      </span>
                      {habit.streak && (
                        <div className="flex items-center gap-1">
                          <span className="text-orange-500">🔥</span>
                          <span className="text-sm font-medium" style={{color: 'var(--color-text-muted)'}}>{habit.streak}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Binary Habit */}
              {habit.type === 'Binary' && (
                <div className="text-center">
                  {habit.completed ? (
                    <div className={`w-full py-4 rounded-xl ${getColorClasses(habit.color, 'bg')} text-white font-medium text-lg`}>
                      ✅ Completed
                    </div>
                  ) : (
                    <button 
                      onClick={() => updateHabit(habit.id, 'completed', true)}
                      className={`w-full py-4 rounded-xl border-2 border-dashed ${getColorClasses(habit.color, 'border')} ${getColorClasses(habit.color, 'primary')} hover:bg-opacity-10 transition-all duration-200`}
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              )}

              {/* Time-based Habit */}
              {habit.type === 'Time-based' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm" style={{color: 'var(--color-text-muted)'}}>Goal: {habit.goal} {habit.unit}</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-12 h-12 rounded-full border-4 ${getColorClasses(habit.color, 'border')} flex items-center justify-center relative`}>
                        <span className="text-sm font-bold" style={{color: 'var(--color-text)'}}>{habit.progress}%</span>
                        <svg className="absolute inset-0 w-12 h-12 transform -rotate-90">
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            className="opacity-25"
                            style={{color: 'var(--color-border)'}}
                          />
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 20}`}
                            strokeDashoffset={`${2 * Math.PI * 20 * (1 - habit.progress / 100)}`}
                            className={getColorClasses(habit.color, 'primary')}
                            style={{transition: 'stroke-dashoffset 0.5s ease'}}
                          />
                        </svg>
                      </div>
                      <span className="text-lg font-semibold" style={{color: 'var(--color-text)'}}>{habit.current} {habit.unit}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => addTime(habit.id, 15)}
                      className={`flex-1 py-2 px-4 rounded-lg ${getColorClasses(habit.color, 'bg')} text-white font-medium hover:opacity-90 transition-opacity`}
                    >
                      +15m
                    </button>
                    <button 
                      onClick={() => addTime(habit.id, 30)}
                      className={`flex-1 py-2 px-4 rounded-lg ${getColorClasses(habit.color, 'bg')} text-white font-medium hover:opacity-90 transition-opacity`}
                    >
                      +30m
                    </button>
                    <div className="flex items-center px-3 text-sm" style={{color: 'var(--color-text-muted)'}}>
                      min
                    </div>
                    <button className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <span className="text-lg">➕</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Goal-oriented Habit */}
              {habit.type === 'Goal-oriented' && (
                <div>
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm" style={{color: 'var(--color-text-muted)'}}>
                        {habit.weeklyGoal ? `Weekly goal: ${habit.weeklyGoal}` : `Daily goal: ${habit.dailyGoal}`} {habit.unit}
                      </span>
                      <span className="text-sm font-medium" style={{color: 'var(--color-text)'}}>
                        {habit.current}/{habit.weeklyGoal || habit.dailyGoal}
                      </span>
                    </div>
                    
                    {habit.current === 0 ? (
                      <div className="text-right mb-2">
                        <span className="text-2xl font-bold" style={{color: 'var(--color-text)'}}>{habit.current} {habit.unit}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-16 h-16 rounded-full border-4 ${getColorClasses(habit.color, 'border')} flex items-center justify-center relative`}>
                          <span className="text-sm font-bold" style={{color: 'var(--color-text)'}}>{Math.round(habit.progress)}%</span>
                          <svg className="absolute inset-0 w-16 h-16 transform -rotate-90">
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              className="opacity-25"
                              style={{color: 'var(--color-border)'}}
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 28}`}
                              strokeDashoffset={`${2 * Math.PI * 28 * (1 - habit.progress / 100)}`}
                              className={getColorClasses(habit.color, 'primary')}
                              style={{transition: 'stroke-dashoffset 0.5s ease'}}
                            />
                          </svg>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold" style={{color: 'var(--color-text)'}}>{habit.current} {habit.unit}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => addCount(habit.id, 1)}
                    className={`w-full py-3 rounded-xl ${getColorClasses(habit.color, 'bg')} text-white font-medium hover:opacity-90 transition-all duration-200 magnetic micro-bounce`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span className="text-lg">➕</span>
                      +1 {habit.unit.slice(0, -1)}
                    </span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;