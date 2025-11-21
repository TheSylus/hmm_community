
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

interface AppSettingsContextType {
  isAiEnabled: boolean;
  setIsAiEnabled: (enabled: boolean) => void;
  isBarcodeScannerEnabled: boolean;
  setIsBarcodeScannerEnabled: (enabled: boolean) => void;
  isOffSearchEnabled: boolean;
  setIsOffSearchEnabled: (enabled: boolean) => void;
  savedShops: string[];
  setSavedShops: (shops: string[]) => void;
  addSavedShop: (shop: string) => Promise<void>;
  removeSavedShop: (shop: string) => Promise<void>;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

const DEFAULT_SHOPS = ['Aldi', 'Lidl', 'Rewe', 'Edeka', 'DM'];

export const AppSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [householdId, setHouseholdId] = useState<string | null>(null);

  // Local settings (Device specific)
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
    return savedSetting !== null ? JSON.parse(savedSetting) : true;
  });

  // Synced settings (Household specific)
  const [savedShops, setSavedShopsState] = useState<string[]>(() => {
      // Initial load from local storage to prevent layout shift before DB loads
      const saved = localStorage.getItem('savedShops');
      return saved ? JSON.parse(saved) : DEFAULT_SHOPS;
  });

  // --- Effects ---

  // 1. Fetch Household ID and Sync Shops
  useEffect(() => {
    let mounted = true;

    const fetchHouseholdSettings = async () => {
      if (!user) {
          setHouseholdId(null);
          // Revert to local storage if logged out
          const saved = localStorage.getItem('savedShops');
          if(mounted) setSavedShopsState(saved ? JSON.parse(saved) : DEFAULT_SHOPS);
          return;
      }

      try {
        // Get User Profile to find Household ID
        const { data: profile } = await supabase
            .from('profiles')
            .select('household_id')
            .eq('id', user.id)
            .single();
        
        if (profile?.household_id) {
            if (mounted) setHouseholdId(profile.household_id);

            // Fetch Shops from Household
            const { data: household } = await supabase
                .from('households')
                .select('saved_shops')
                .eq('id', profile.household_id)
                .single();
            
            if (household && household.saved_shops && mounted) {
                // Combine DB shops with defaults if DB list is strangely empty but exists
                const shops = household.saved_shops.length > 0 ? household.saved_shops : DEFAULT_SHOPS;
                setSavedShopsState(shops);
                // Sync back to local storage for offline fallback
                localStorage.setItem('savedShops', JSON.stringify(shops));
            }
        } else {
            if (mounted) setHouseholdId(null);
        }
      } catch (error) {
        console.error("Error syncing settings:", error);
      }
    };

    fetchHouseholdSettings();

    // Subscribe to profile changes (e.g. joining/leaving household)
    const profileSubscription = supabase
        .channel(`settings_profile_${user?.id}`)
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'profiles', 
            filter: `id=eq.${user?.id}` 
        }, () => {
            fetchHouseholdSettings();
        })
        .subscribe();

    return () => {
        mounted = false;
        profileSubscription.unsubscribe();
    };
  }, [user]);


  // --- Setters ---

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

  // Wrapper to update state AND database
  const updateShops = async (newShops: string[]) => {
      setSavedShopsState(newShops);
      localStorage.setItem('savedShops', JSON.stringify(newShops)); // Always update local mirror

      if (householdId) {
          try {
              const { error } = await supabase
                  .from('households')
                  .update({ saved_shops: newShops })
                  .eq('id', householdId);
              
              if (error) throw error;
          } catch (e) {
              console.error("Failed to save shops to DB:", e);
              // We rely on optimistic update (setSavedShopsState) so UI feels fast
          }
      }
  };

  const setSavedShops = (shops: string[]) => {
      updateShops(shops);
  }

  const addSavedShop = async (shop: string) => {
      const trimmed = shop.trim();
      if (!trimmed || savedShops.includes(trimmed)) return;
      const newShops = [...savedShops, trimmed];
      await updateShops(newShops);
  }

  const removeSavedShop = async (shop: string) => {
      const newShops = savedShops.filter(s => s !== shop);
      await updateShops(newShops);
  }

  const value = { 
      isAiEnabled, setIsAiEnabled, 
      isBarcodeScannerEnabled, setIsBarcodeScannerEnabled, 
      isOffSearchEnabled, setIsOffSearchEnabled,
      savedShops, setSavedShops, addSavedShop, removeSavedShop
  };

  return React.createElement(AppSettingsContext.Provider, { value }, children);
};

export const useAppSettings = (): AppSettingsContextType => {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};
