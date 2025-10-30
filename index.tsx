import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { I18nProvider } from './i18n/index';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppSettingsProvider } from './contexts/AppSettingsContext';

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
          <App />
        </AppSettingsProvider>
      </I18nProvider>
    </ThemeProvider>
  </React.StrictMode>
);