
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { I18nProvider } from './i18n/index';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppSettingsProvider } from './contexts/AppSettingsContext';
import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
      gcTime: 1000 * 60 * 30,   // Cache kept for 30 minutes
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider>
            <I18nProvider>
              <AuthProvider>
                <AppSettingsProvider>
                  <App />
                </AppSettingsProvider>
              </AuthProvider>
            </I18nProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
