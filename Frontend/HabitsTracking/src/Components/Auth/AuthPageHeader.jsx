import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from '../../assets/logo-habit-tracker.png';

const AuthPageHeader = ({ title, subtitle, showBackToLanding = true, showAuthToggle = true, authToggleText, authTogglePath }) => {
  const navigate = useNavigate();

  return (
    <div className="relative z-10 mb-8 page-enter">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 sm:gap-0">
        {/* Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer group hover-lift nav-button-enhance"
          onClick={() => navigate('/')}
        >
          <img 
            src={logoImage} 
            alt="HabitTracker Logo" 
            className="w-10 h-10 object-contain group-hover:animate-pulse transition-transform duration-300 group-hover:scale-110"
          />
          <span className="text-xl font-bold text-gradient transition-all duration-300 group-hover:text-shimmer">
            HabitTracker
          </span>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          {showBackToLanding && (
            <button
              onClick={() => navigate('/')}
              className="btn-ghost btn-sm magnetic nav-button-enhance order-2 sm:order-1"
            >
              <span className="flex items-center gap-2 transition-all duration-300">
                <span className="text-lg transform group-hover:-translate-x-1 transition-transform duration-300">←</span>
                Back to Home
              </span>
            </button>
          )}
          
          {showAuthToggle && authToggleText && authTogglePath && (
            <button
              onClick={() => navigate(authTogglePath)}
              className="btn-neon btn-sm magnetic nav-button-enhance order-1 sm:order-2"
            >
              <span className="transition-all duration-300 hover:text-shimmer">
                {authToggleText}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Page Title */}
      <div className="text-center px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-shadow-lg text-shimmer mb-4 transition-all duration-500 hover:scale-105" style={{color: 'var(--color-text)'}}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg sm:text-xl leading-relaxed transition-all duration-300 hover:text-opacity-90 max-w-2xl mx-auto" style={{color: 'var(--color-text-muted)'}}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthPageHeader;