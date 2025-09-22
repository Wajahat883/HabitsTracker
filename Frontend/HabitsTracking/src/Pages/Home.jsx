import React, { useState, useEffect } from 'react';
import HabitModal from '../Components/Habits/HabitModal';
import EditHabitModal from '../Components/Habits/EditHabitModal';
import DeleteHabitModal from '../Components/Habits/DeleteHabitModal';
import { habitAPI } from '../services/api';
import { useAuth } from '../context/useAuth';

const Home = () => {
  const { user, authenticated, token } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [habits, setHabits] = useState([]);

  // Development helper - remove in production
  const setTestAuth = () => {
    const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGQwZWVhZDI1MjljZDczNDc3ZGE4NDAiLCJpYXQiOjE3NTg1MjMyNTksImV4cCI6MTc1ODYwOTY1OX0.Hjad2MFqt4Xs-twTGKwRP1fOp7cy_oRgqdmoDyHRJ2k";
    const testUser = { name: "Test User", email: "test@example.com", username: "testuser" };
    localStorage.setItem('authToken', testToken);
    localStorage.setItem('userProfile', JSON.stringify(testUser));
    window.location.reload();
  };

  // Calculate stats dynamically
  const overallStats = React.useMemo(() => {
    const completedHabits = habits.filter(h => {
      if (h.type === 'Binary') return h.completed;
      if (h.type === 'Time-based') return h.progress >= 100;
      if (h.type === 'Goal-oriented') return h.progress >= 100;
      return false;
    });
    
    return {
      completed: completedHabits.length,
      total: habits.length,
      percentage: habits.length > 0 ? Math.round((completedHabits.length / habits.length) * 100) : 0
    };
  }, [habits]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000 * 60); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Load habits and user data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Only load data if user is authenticated
        if (!authenticated || !token) {
          setError('Please log in to view your habits.');
          setLoading(false);
          return;
        }
        
        // User information is now handled by AuthContext
        
        // Load habits
        const habitsResponse = await habitAPI.getAllHabits();
        if (habitsResponse.success && habitsResponse.data) {
          setHabits(habitsResponse.data);
        } else {
          setError('Failed to load habits. Please try again.');
        }
      } catch (err) {
        console.error('Error loading data:', err);
        if (err.response?.status === 401) {
          setError('Authentication expired. Please log in again.');
        } else {
          setError('Failed to load habits. Please try refreshing the page.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authenticated, token]);

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

  const updateHabitWithDelay = React.useCallback((habitId, field, value) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === habitId) {
        const updatedHabit = { ...habit, [field]: value };
        
        // Update streak for binary habits
        if (field === 'completed' && value === true && habit.type === 'Binary') {
          updatedHabit.streak = (habit.streak || 0) + 1;
        }
        
        // Auto-complete time-based and goal-oriented habits when they reach 100%
        if (field === 'progress' && value >= 100 && !habit.completed) {
          updatedHabit.completed = true;
          updatedHabit.streak = (habit.streak || 0) + 1;
        }
        
        return updatedHabit;
      }
      return habit;
    }));
  }, []);

  const updateHabit = (habitId, field, value) => {
    updateHabitWithDelay(habitId, field, value);
  };

  const addTime = (habitId, minutes) => {
    const habit = habits.find(h => h.id === habitId);
    if (habit && habit.goal) {
      const newCurrent = Math.min((habit.current || 0) + minutes, habit.goal);
      const newProgress = Math.round((newCurrent / habit.goal) * 100);
      updateHabit(habitId, 'current', newCurrent);
      updateHabit(habitId, 'progress', newProgress);
    }
  };

  const addCount = (habitId, count) => {
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      const newCurrent = (habit.current || 0) + count;
      const goalField = habit.weeklyGoal ? 'weeklyGoal' : 'dailyGoal';
      const goalValue = habit[goalField];
      if (goalValue) {
        const newProgress = Math.round((newCurrent / goalValue) * 100);
        updateHabit(habitId, 'current', newCurrent);
        updateHabit(habitId, 'progress', Math.min(newProgress, 100));
      }
    }
  };

  const handleAddHabit = async (habitData) => {
    try {
      if (!authenticated || !token) {
        setError('Please log in to create habits.');
        return;
      }

      const response = await habitAPI.createHabit(habitData);
      if (response.success && response.data) {
        setHabits(prev => [...prev, response.data]);
      } else {
        setError('Failed to create habit. Please try again.');
      }
    } catch (err) {
      console.error('Error creating habit:', err);
      if (err.response?.status === 401) {
        setError('Authentication expired. Please log in again.');
      } else {
        setError('Failed to create habit. Please try again.');
      }
    }
  };

  const handleEditHabit = async (habitId, updatedData) => {
    try {
      if (!authenticated || !token) {
        setError('Please log in to edit habits.');
        return;
      }

      const response = await habitAPI.updateHabit(habitId, updatedData);
      if (response.success && response.data) {
        setHabits(prev => prev.map(habit => 
          habit.id === habitId ? { ...habit, ...response.data } : habit
        ));
      } else {
        setError('Failed to update habit. Please try again.');
      }
    } catch (err) {
      console.error('Error updating habit:', err);
      if (err.response?.status === 401) {
        setError('Authentication expired. Please log in again.');
      } else {
        setError('Failed to update habit. Please try again.');
      }
    }
  };

  const handleDeleteHabit = async (habitId) => {
    try {
      if (!authenticated || !token) {
        setError('Please log in to delete habits.');
        return;
      }

      const response = await habitAPI.deleteHabit(habitId);
      if (response.success) {
        setHabits(prev => prev.filter(h => h.id !== habitId));
      } else {
        setError('Failed to delete habit. Please try again.');
      }
    } catch (err) {
      console.error('Error deleting habit:', err);
      if (err.response?.status === 401) {
        setError('Authentication expired. Please log in again.');
      } else {
        setError('Failed to delete habit. Please try again.');
      }
    }
  };

  const handleEditClick = (habit) => {
    setSelectedHabit(habit);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (habit) => {
    setSelectedHabit(habit);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="min-h-screen" style={{background: 'var(--color-bg)'}}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p style={{color: 'var(--color-text-muted)'}}>Loading your habits...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <div className="flex gap-2 mt-2">
              {error.includes('log in') || error.includes('Authentication') ? (
                <>
                  <button 
                    onClick={() => window.location.href = '/login'} 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Go to Login
                  </button>
                  {import.meta.env.DEV && (
                    <button 
                      onClick={setTestAuth} 
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Use Test Login
                    </button>
                  )}
                </>
              ) : (
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        {!loading && (
          <>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold" style={{color: 'var(--color-text)'}}>
              Good morning, <span className="text-gradient">{user?.name || user?.username || 'User'}!</span>
            </h1>
            <span className="text-3xl">👋</span>
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
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-glass px-6 py-3 rounded-xl"
          >
            <span className="flex items-center gap-2">
              <span className="text-xl">➕</span>
              Add Habit
            </span>
          </button>
        </div>

        {/* Habits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {habits.map((habit, index) => (
            <div key={habit.id || habit._id || `habit-${index}`} className="card-static">
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
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEditClick(habit)}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors group"
                    title="Edit habit"
                  >
                    <span className="text-gray-400 group-hover:text-blue-500 transition-colors">✏️</span>
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(habit)}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors group"
                    title="Delete habit"
                  >
                    <span className="text-gray-400 group-hover:text-red-500 transition-colors">🗑️</span>
                  </button>
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
                    <span className="text-sm" style={{color: 'var(--color-text-muted)'}}>Goal: {habit.goal} {habit.unit || 'units'}</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-12 h-12 rounded-full border-4 ${getColorClasses(habit.color, 'border')} flex items-center justify-center relative`}>
                        <span className="text-sm font-bold" style={{color: 'var(--color-text)'}}>{Math.round(habit.progress || 0)}%</span>
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
                            strokeDashoffset={`${2 * Math.PI * 20 * (1 - (habit.progress || 0) / 100)}`}
                            className={getColorClasses(habit.color, 'primary')}
                            style={{transition: 'stroke-dashoffset 0.5s ease'}}
                          />
                        </svg>
                      </div>
                      <span className="text-lg font-semibold" style={{color: 'var(--color-text)'}}>{habit.current || 0} {habit.unit || 'units'}</span>
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
                        {habit.weeklyGoal ? `Weekly goal: ${habit.weeklyGoal}` : `Daily goal: ${habit.dailyGoal}`} {habit.unit || 'items'}
                      </span>
                      <span className="text-sm font-medium" style={{color: 'var(--color-text)'}}>
                        {habit.current}/{habit.weeklyGoal || habit.dailyGoal}
                      </span>
                    </div>
                    
                    {habit.current === 0 ? (
                      <div className="text-right mb-2">
                        <span className="text-2xl font-bold" style={{color: 'var(--color-text)'}}>{habit.current || 0} {habit.unit || 'items'}</span>
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
                              strokeDashoffset={`${2 * Math.PI * 28 * (1 - (habit.progress || 0) / 100)}`}
                              className={getColorClasses(habit.color, 'primary')}
                              style={{transition: 'stroke-dashoffset 0.5s ease'}}
                            />
                          </svg>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold" style={{color: 'var(--color-text)'}}>{habit.current || 0} {habit.unit || 'items'}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => addCount(habit.id, 1)}
                    className={`w-full py-3 rounded-xl ${getColorClasses(habit.color, 'bg')} text-white font-medium hover:opacity-90 transition-all duration-200`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span className="text-lg">➕</span>
                      +1 {habit.unit ? habit.unit.slice(0, -1) : 'item'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        </>
        )}

        {/* Modals */}
        <HabitModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddHabit}
        />
        
        <EditHabitModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleEditHabit}
          habit={selectedHabit}
        />
        
        <DeleteHabitModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteHabit}
          habit={selectedHabit}
        />
      </div>
    </div>
  );
};

export default Home;
