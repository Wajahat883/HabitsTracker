import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from '../assets/logo-habit-tracker.png';
import bookImage from '../assets/book.jpeg';
import cyclingImage from '../assets/cycling.jpeg';
import horseRidingImage from '../assets/horse riding.jpeg';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: "Build Better Habits",
      description: "Transform your life one habit at a time with our intuitive tracking system",
      icon: "🎯",
      image: bookImage
    },
    {
      title: "Stay Motivated",
      description: "Visual progress tracking and streaks keep you motivated every single day",
      icon: "📈",
      image: cyclingImage
    },
    {
      title: "Track Your Progress",
      description: "Modern analytics help you understand your patterns and celebrate victories",
      icon: "🏆",
      image: horseRidingImage
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <img 
              src={logoImage} 
              alt="Habit Tracker Logo" 
              className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-lg"
            />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-slate-800 dark:text-white mb-6">
            Transform Your Life with
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {" "}Better Habits
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Build lasting habits, track your progress, and achieve your goals with our intuitive habit tracking platform. 
            Start your journey to a better you today!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button
              onClick={() => navigate('/signup')}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-lg"
            >
              🚀 Start Tracking Free
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 border-2 border-blue-600 text-blue-600 dark:text-blue-400 font-semibold rounded-xl hover:bg-blue-600 hover:text-white dark:border-blue-400 dark:hover:bg-blue-400 dark:hover:text-slate-900 transition-all duration-300 text-lg"
            >
              Already have an account? Login
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              <div className="h-48 overflow-hidden">
                <img 
                  src={feature.image} 
                  alt={feature.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-4">
              Why Habit Tracking Works
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Science-backed approach to building lasting positive changes in your life
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">✅</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Visual Progress</h4>
                  <p className="text-slate-600 dark:text-slate-300">See your streaks and patterns at a glance</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Smart Analytics</h4>
                  <p className="text-slate-600 dark:text-slate-300">Understand your behavior patterns</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🎯</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Goal Focused</h4>
                  <p className="text-slate-600 dark:text-slate-300">Set clear, achievable targets</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Daily Motivation</h4>
                  <p className="text-slate-600 dark:text-slate-300">Stay inspired with progress updates</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🔥</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Streak Building</h4>
                  <p className="text-slate-600 dark:text-slate-300">Build momentum with consecutive days</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🌟</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Personal Growth</h4>
                  <p className="text-slate-600 dark:text-slate-300">Transform your lifestyle step by step</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center mt-16">
          <h3 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-4">
            Ready to Start Your Journey?
          </h3>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
            Join thousands of users who have transformed their lives through better habits
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="px-10 py-4 bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-xl"
          >
            Get Started Now - It's Free! 🎉
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;