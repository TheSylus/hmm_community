import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { I18nProvider } from './i18n/index';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppSettingsProvider } from './contexts/AppSettingsContext';
import { AuthProvider } from './contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './contexts/ToastContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <AppSettingsProvider>
            <AuthProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </AuthProvider>
          </AppSettingsProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);