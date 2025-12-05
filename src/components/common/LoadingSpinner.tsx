import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="fixed top-0 left-0 z-50 flex h-screen w-screen items-center justify-center bg-black bg-opacity-50">
      <div className="h-32 w-32 animate-spin rounded-full border-t-4 border-b-4 border-primary"></div>
    </div>
  );
};

export default LoadingSpinner;
