import React, { createContext, useState, useContext, useMemo } from 'react';

interface SpinnerContextType {
  isVisible: boolean;
  showSpinner: () => void;
  hideSpinner: () => void;
}

const SpinnerContext = createContext<SpinnerContextType | undefined>(undefined);

export const SpinnerProvider = ({ children }: { children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);

  const showSpinner = () => setIsVisible(true);
  const hideSpinner = () => setIsVisible(false);

  const value = useMemo(() => ({ isVisible, showSpinner, hideSpinner }), [isVisible]);

  return <SpinnerContext.Provider value={value}>{children}</SpinnerContext.Provider>;
};

export const useSpinner = () => {
  const context = useContext(SpinnerContext);
  if (!context) {
    throw new Error('useSpinner must be used within a SpinnerProvider');
  }
  return context;
};
