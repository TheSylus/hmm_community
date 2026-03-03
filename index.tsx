
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { I18nProvider } from './i18n/index';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppSettingsProvider } from './contexts/AppSettingsContext';
import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { get, set, del } from 'idb-keyval';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // Cache kept for 24 hours for offline support
      retry: 1,
      refetchOnWindowFocus: true,
      networkMode: 'offlineFirst', // Allow queries to run even when offline
    },
    mutations: {
      networkMode: 'offlineFirst',
    }
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: {
    getItem: async (key) => {
      const value = await get(key);
      return value === undefined ? null : value;
    },
    setItem: set,
    removeItem: del,
  },
});

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <PersistQueryClientProvider 
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister }}
      >
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
      </PersistQueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
