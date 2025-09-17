import React, { memo } from 'react';

// Memoized wrapper for expensive components to prevent unnecessary re-renders
const MemoizedComponent = memo(({ children }) => {
  return children;
});

export default MemoizedComponent;