// Simple test for streakUtils functions
import { getUserStats, calculateEnhancedStats, cleanupOldData, checkMilestones } from './src/utils/streakUtils.js';

// Mock localStorage for testing
global.localStorage = {
  store: {},
  getItem: function(key) {
    return this.store[key] || null;
  },
  setItem: function(key, value) {
    this.store[key] = value;
  },
  removeItem: function(key) {
    delete this.store[key];
  },
  clear: function() {
    this.store = {};
  }
};

console.log('Testing streakUtils functions...');

// Test 1: getUserStats should return valid structure
console.log('\n1. Testing getUserStats()...');
try {
  const stats = getUserStats();
  console.log('✓ getUserStats returned:', {
    hasLongestStreak: typeof stats.longestOverallStreak === 'number',
    hasCurrentStreak: typeof stats.currentOverallStreak === 'number',
    hasStreakHistory: Array.isArray(stats.streakHistory),
    hasMilestones: Array.isArray(stats.milestones),
    hasBreakHistory: Array.isArray(stats.streakBreakHistory)
  });
} catch (error) {
  console.error('✗ getUserStats failed:', error.message);
}

// Test 2: calculateEnhancedStats should handle empty data
console.log('\n2. Testing calculateEnhancedStats with empty data...');
try {
  const mockHabits = [];
  const mockProgressData = {};
  const mockStats = getUserStats();
  
  const result = calculateEnhancedStats(mockHabits, mockProgressData, mockStats);
  console.log('✓ calculateEnhancedStats returned:', {
    hasUserStats: !!result.userStats,
    hasDashboardStats: !!result.dashboardStats,
    hasNewMilestones: Array.isArray(result.newMilestones)
  });
} catch (error) {
  console.error('✗ calculateEnhancedStats failed:', error.message);
}

// Test 3: cleanupOldData should not throw errors
console.log('\n3. Testing cleanupOldData()...');
try {
  cleanupOldData();
  console.log('✓ cleanupOldData completed without errors');
} catch (error) {
  console.error('✗ cleanupOldData failed:', error.message);
}

// Test 4: checkMilestones should return array
console.log('\n4. Testing checkMilestones()...');
try {
  const milestones = checkMilestones(10, 5);
  console.log('✓ checkMilestones returned array:', Array.isArray(milestones), 'with length:', milestones.length);
} catch (error) {
  console.error('✗ checkMilestones failed:', error.message);
}

console.log('\nTest completed!');