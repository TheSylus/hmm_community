import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

type Language = 'en' | 'de';

const translations: Record<Language, any> = {
  en: {
    header: {
      title: "Food Memory Tracker"
    },
    form: {
      addNewButton: 'Add New Item',
    },
    // Add other keys as needed with default values
    // This is just to make the app runnable
  },
  de: {
    header: {
      title: "Lebensmittel-Gedächtnis-Tracker"
    },
    form: {
      addNewButton: 'Neuen Eintrag hinzufügen',
    }
  }
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, options?: { [key: string]: string | number | undefined }) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLang = localStorage.getItem('language');
    if (savedLang === 'en' || savedLang === 'de') {
      return savedLang;
    }
    // Default to browser language if available
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'de') return 'de';
    return 'en';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  }, []);

  const t = useCallback((key: string, options?: { [key: string]: string | number | undefined }) => {
    const langTranslations = translations[language] || translations.en;
    let translation = key.split('.').reduce((obj, keyPart) => obj && obj[keyPart], langTranslations);
    
    if (!translation) {
      translation = key.split('.').reduce((obj, keyPart) => obj && obj[keyPart], translations.en);
    }
    
    if (typeof translation !== 'string') {
      return key;
    }

    let result = translation;
    if (options) {
      Object.keys(options).forEach(optionKey => {
        const value = options[optionKey];
        if (value !== undefined) {
          result = result.replace(new RegExp(`{{${optionKey}}}`, 'g'), String(value));
        }
      });
    }

    return result;
  }, [language]);

  const value = { language, setLanguage, t };

  return React.createElement(I18nContext.Provider, { value }, children);
};

export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a I18nProvider');
  }
  return context;
};
