import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useProfile } from './ProfileContext';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { profile, updateProfile, isLoadingProfile } = useProfile();

  // Read from local storage for initial non-flicker state
  const getInitialTheme = (): Theme => (localStorage.getItem('theme') as Theme) || 'system';
  
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  // When profile loads, sync theme from DB, overriding localStorage
  useEffect(() => {
    if (!isLoadingProfile && profile?.theme) {
      if (theme !== profile.theme) {
        setThemeState(profile.theme);
      }
    }
  }, [profile, isLoadingProfile, theme]);
  
  // Effect to apply theme to DOM
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    root.classList.remove(isDark ? 'light' : 'dark');
    root.classList.add(isDark ? 'dark' : 'light');
  }, [theme]);

  // Listener for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        const root = window.document.documentElement;
        if (mediaQuery.matches) {
          root.classList.remove('light');
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
          root.classList.add('light');
        }
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    // Optimistically update DB if user is logged in
    if (profile) {
      updateProfile({ theme: newTheme }).catch(e => {
          console.error("Failed to sync theme to DB", e);
          // Optional: revert state or show toast
      });
    }
  };

  const value = { theme, setTheme };

  return React.createElement(ThemeContext.Provider, { value }, children);
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};