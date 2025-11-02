import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: Add .tsx extension to file path
import App from './App.tsx';
// FIX: Add .ts extension to file path
import { I18nProvider } from './i18n/index.ts';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppSettingsProvider } from './contexts/AppSettingsContext';
import { AuthProvider } from './contexts/AuthContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <AppSettingsProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </AppSettingsProvider>
      </I18nProvider>
    </ThemeProvider>
  </React.StrictMode>
);