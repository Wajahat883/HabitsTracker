import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaTrophy } from 'react-icons/fa';

const MilestoneNotification = ({ milestones, onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const [currentMilestoneIndex, setCurrentMilestoneIndex] = useState(0);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      onDismiss();
    }, 300);
  }, [onDismiss]);

  const handleNext = useCallback(() => {
    if (currentMilestoneIndex < milestones.length - 1) {
      setCurrentMilestoneIndex(prev => prev + 1);
    } else {
      handleClose();
    }
  }, [currentMilestoneIndex, milestones.length, handleClose]);

  useEffect(() => {
    if (milestones && milestones.length > 0) {
      setVisible(true);
      setCurrentMilestoneIndex(0);
      
      // Auto-dismiss after 5 seconds for each milestone
      const timer = setTimeout(() => {
        handleNext();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [milestones, handleNext]);

  if (!visible || !milestones || milestones.length === 0) {
    return null;
  }

  const currentMilestone = milestones[currentMilestoneIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadein">
      <div className="glass-morphism p-8 rounded-3xl shadow-2xl text-center max-w-md w-full mx-4 animate-pop border-2 border-yellow-400/30">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors text-xl"
        >
          <FaTimes />
        </button>
        
        <div className="text-8xl mb-4 animate-bounce-in">
          {currentMilestone.emoji}
        </div>
        
        <div className="flex items-center justify-center gap-2 mb-4">
          <FaTrophy className="text-yellow-400 text-2xl animate-pulse" />
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            Milestone Achieved!
          </h2>
          <FaTrophy className="text-yellow-400 text-2xl animate-pulse" />
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-2">
          {currentMilestone.title}
        </h3>
        
        <p className="text-neutral-300 mb-6 text-lg">
          {currentMilestone.description}
        </p>
        
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient">
              {currentMilestone.value}
            </div>
            <div className="text-xs text-neutral-400 uppercase tracking-wide">
              Day Streak
            </div>
          </div>
        </div>
        
        {milestones.length > 1 && (
          <div className="flex justify-center gap-2 mb-4">
            {milestones.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentMilestoneIndex ? 'bg-yellow-400' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all duration-200 border border-white/20"
          >
            {milestones.length > 1 ? 'Skip All' : 'Awesome!'}
          </button>
          
          {milestones.length > 1 && currentMilestoneIndex < milestones.length - 1 && (
            <button
              onClick={handleNext}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Next ({currentMilestoneIndex + 1} of {milestones.length})
            </button>
          )}
        </div>
        
        <div className="mt-4 text-xs text-neutral-500">
          Keep up the amazing work! 🎉
        </div>
      </div>
    </div>
  );
};

export default MilestoneNotification;