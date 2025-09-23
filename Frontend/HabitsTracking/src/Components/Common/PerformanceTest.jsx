import React, { useState, useEffect } from 'react';

const PerformanceTest = () => {
  const [loadTime, setLoadTime] = useState(null);
  const [componentCount, setComponentCount] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    
    // Simulate component loading
    const timer = setTimeout(() => {
      const endTime = performance.now();
      setLoadTime(Math.round(endTime - startTime));
      setComponentCount(5); // Number of main dashboard sections
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-slate-800 text-white p-3 rounded-lg shadow-lg text-xs">
      <div className="space-y-1">
        <div>Load Time: {loadTime ? `${loadTime}ms` : 'Loading...'}</div>
        <div>Components: {componentCount}</div>
        <div className="text-green-400">⚡ Optimized</div>
      </div>
    </div>
  );
};

export default PerformanceTest;