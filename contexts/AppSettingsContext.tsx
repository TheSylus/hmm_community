import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

interface AppSettingsContextType {
  isAiEnabled: boolean;
  setIsAiEnabled: (enabled: boolean) => void;
  isBarcodeScannerEnabled: boolean;
  setIsBarcodeScannerEnabled: (enabled: boolean) => void;
  isOffSearchEnabled: boolean;
  setIsOffSearchEnabled: (enabled: boolean) => void;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export const AppSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAiEnabled, setIsAiEnabledState] = useState<boolean>(() => {
    const savedSetting = localStorage.getItem('isAiEnabled');
    return savedSetting ? JSON.parse(savedSetting) : true;
  });
  
  const [isBarcodeScannerEnabled, setIsBarcodeScannerEnabledState] = useState<boolean>(() => {
    const savedSetting = localStorage.getItem('isBarcodeScannerEnabled');
    return savedSetting ? JSON.parse(savedSetting) : true;
  });

  const [isOffSearchEnabled, setIsOffSearchEnabledState] = useState<boolean>(() => {
    const savedSetting = localStorage.getItem('isOffSearchEnabled');
    // Default to true
    return savedSetting !== null ? JSON.parse(savedSetting) : true;
  });

  const setIsAiEnabled = (enabled: boolean) => {
    setIsAiEnabledState(enabled);
    localStorage.setItem('isAiEnabled', JSON.stringify(enabled));
  };
  
  const setIsBarcodeScannerEnabled = (enabled: boolean) => {
    setIsBarcodeScannerEnabledState(enabled);
    localStorage.setItem('isBarcodeScannerEnabled', JSON.stringify(enabled));
  };
  
  const setIsOffSearchEnabled = (enabled: boolean) => {
    setIsOffSearchEnabledState(enabled);
    localStorage.setItem('isOffSearchEnabled', JSON.stringify(enabled));
  };

  const value = { isAiEnabled, setIsAiEnabled, isBarcodeScannerEnabled, setIsBarcodeScannerEnabled, isOffSearchEnabled, setIsOffSearchEnabled };

  return React.createElement(AppSettingsContext.Provider, { value }, children);
};

export const useAppSettings = (): AppSettingsContextType => {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};