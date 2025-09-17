// Home component - shows landing page or habits manager based on auth
import React, { useMemo } from 'react';
import { useAuth } from '../context/useAuth';
import LandingPage from './LandingPage';
import HabitsManager from './HabitsManager';
import LoadingSpinner from '../Components/Common/LoadingSpinner';

const Home = () => {
  const { authenticated, loading } = useAuth();
  if (import.meta.env.DEV) {
    // Will log each render; should not spam after stabilization
    // Using console.debug to keep noise lower
    console.debug('[Home] render', { authenticated, loading, ts: Date.now() });
  }
  
  // Memoize content to prevent unnecessary re-renders
  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <LoadingSpinner size="lg" message="Initializing application..." />
        </div>
      );
    }
    
    return authenticated ? <HabitsManager /> : <LandingPage />;
  }, [authenticated, loading]);
  
  return content;
};

export default Home;
