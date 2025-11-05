import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useProfile } from './ProfileContext';

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
  const { profile, updateProfile, isLoadingProfile } = useProfile();

  const [isAiEnabled, setIsAiEnabledState] = useState<boolean>(() => JSON.parse(localStorage.getItem('isAiEnabled') ?? 'true'));
  const [isBarcodeScannerEnabled, setIsBarcodeScannerEnabledState] = useState<boolean>(() => JSON.parse(localStorage.getItem('isBarcodeScannerEnabled') ?? 'true'));
  const [isOffSearchEnabled, setIsOffSearchEnabledState] = useState<boolean>(() => JSON.parse(localStorage.getItem('isOffSearchEnabled') ?? 'true'));

  useEffect(() => {
    if (!isLoadingProfile && profile) {
      setIsAiEnabledState(profile.is_ai_enabled ?? true);
      setIsBarcodeScannerEnabledState(profile.is_barcode_scanner_enabled ?? true);
      setIsOffSearchEnabledState(profile.is_off_search_enabled ?? true);
    }
  }, [profile, isLoadingProfile]);

  const createSetter = (
    stateSetter: React.Dispatch<React.SetStateAction<boolean>>,
    storageKey: string,
    profileKey: keyof Pick<AppSettingsContextType, 'isAiEnabled' | 'isBarcodeScannerEnabled' | 'isOffSearchEnabled'>
  ) => (enabled: boolean) => {
    stateSetter(enabled);
    localStorage.setItem(storageKey, JSON.stringify(enabled));
    if (profile) {
      const profileUpdate: { [key: string]: boolean } = {};
      
      // Map context key to DB key
      const dbKeyMap = {
          'isAiEnabled': 'is_ai_enabled',
          'isBarcodeScannerEnabled': 'is_barcode_scanner_enabled',
          'isOffSearchEnabled': 'is_off_search_enabled'
      };

      profileUpdate[dbKeyMap[profileKey]] = enabled;

      updateProfile(profileUpdate).catch(e => console.error(`Failed to sync ${profileKey}`, e));
    }
  };
  
  const setIsAiEnabled = createSetter(setIsAiEnabledState, 'isAiEnabled', 'isAiEnabled');
  const setIsBarcodeScannerEnabled = createSetter(setIsBarcodeScannerEnabledState, 'isBarcodeScannerEnabled', 'isBarcodeScannerEnabled');
  const setIsOffSearchEnabled = createSetter(setIsOffSearchEnabledState, 'isOffSearchEnabled', 'isOffSearchEnabled');

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