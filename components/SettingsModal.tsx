import React from 'react';
import { useTranslation } from '../i18n/index';
import { useTheme } from '../contexts/ThemeContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { XMarkIcon } from './Icons';

interface SettingsModalProps {
  onClose: () => void;
  onOpenProfile: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onOpenProfile }) => {
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { isAiEnabled, setIsAiEnabled, isBarcodeScannerEnabled, setIsBarcodeScannerEnabled, isOffSearchEnabled, setIsOffSearchEnabled } = useAppSettings();
  const { signOut, user } = useAuth();

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <h2 id="settings-modal-title" className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label={t('settings.closeAria')}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
            {/* Language Selection */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('settings.language.title')}</h3>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-200 dark:bg-gray-900 rounded-lg">
                    <button onClick={() => setLanguage('en')} className={`px-4 py-2 font-semibold rounded-md transition-colors ${language === 'en' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}>
                        English
                    </button>
                    <button onClick={() => setLanguage('de')} className={`px-4 py-2 font-semibold rounded-md transition-colors ${language === 'de' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}>
                        Deutsch
                    </button>
                </div>
            </div>

            {/* Theme Selection */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('settings.theme.title')}</h3>
                <div className="grid grid-cols-3 gap-2 p-1 bg-gray-200 dark:bg-gray-900 rounded-lg">
                    <button onClick={() => setTheme('light')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${theme === 'light' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}>
                      {t('settings.theme.light')}
                    </button>
                    <button onClick={() => setTheme('dark')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${theme === 'dark' ? 'bg-gray-700 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}>
                      {t('settings.theme.dark')}
                    </button>
                    <button onClick={() => setTheme('system')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${theme === 'system' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}>
                      {t('settings.theme.system')}
                    </button>
                </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />
            
            {/* Food Database Search Toggle */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('settings.offSearch.title')}</h3>
              <label htmlFor="off-search-toggle" className="flex items-center justify-between bg-gray-100 dark:bg-gray-900/50 p-3 rounded-lg cursor-pointer">
                <span className="text-sm text-gray-600 dark:text-gray-400 max-w-[75%] pr-2">{t('settings.offSearch.description')}</span>
                <div className="relative">
                  <input
                    id="off-search-toggle"
                    type="checkbox"
                    className="sr-only peer"
                    checked={isOffSearchEnabled}
                    onChange={() => setIsOffSearchEnabled(!isOffSearchEnabled)}
                  />
                  <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-indigo-600"></div>
                </div>
              </label>
            </div>
            
            {/* Barcode Scanner Toggle */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('settings.barcodeScanner.title')}</h3>
              <label htmlFor="barcode-toggle" className="flex items-center justify-between bg-gray-100 dark:bg-gray-900/50 p-3 rounded-lg cursor-pointer">
                <span className="text-sm text-gray-600 dark:text-gray-400 max-w-[75%] pr-2">{t('settings.barcodeScanner.description')}</span>
                <div className="relative">
                  <input
                    id="barcode-toggle"
                    type="checkbox"
                    className="sr-only peer"
                    checked={isBarcodeScannerEnabled}
                    onChange={() => setIsBarcodeScannerEnabled(!isBarcodeScannerEnabled)}
                  />
                  <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-indigo-600"></div>
                </div>
              </label>
            </div>

            {/* AI Feature Toggle */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('settings.ai.title')}</h3>
              <label htmlFor="ai-toggle" className="flex items-center justify-between bg-gray-100 dark:bg-gray-900/50 p-3 rounded-lg cursor-pointer">
                <span className="text-sm text-gray-600 dark:text-gray-400 max-w-[75%] pr-2">{t('settings.ai.description')}</span>
                <div className="relative">
                  <input
                    id="ai-toggle"
                    type="checkbox"
                    className="sr-only peer"
                    checked={isAiEnabled}
                    onChange={() => setIsAiEnabled(!isAiEnabled)}
                  />
                  <div className={`w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-indigo-600`}></div>
                </div>
              </label>
            </div>

            {user && (
                <>
                <hr className="border-gray-200 dark:border-gray-700" />
                 <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('settings.profile.title')}</h3>
                    <button 
                        onClick={() => { onClose(); onOpenProfile(); }}
                        className="w-full text-center px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                        {t('settings.profile.button')}
                    </button>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('settings.session.title')}</h3>
                    <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                           {t('settings.session.loggedInAs')} <span className="font-semibold text-gray-800 dark:text-gray-200">{user.email}</span>
                        </p>
                        <button
                            onClick={signOut}
                            className="w-full sm:w-auto flex-shrink-0 px-4 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition-colors text-sm"
                        >
                            {t('settings.session.logout')}
                        </button>
                    </div>
                </div>
                </>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 text-center border-t border-gray-200 dark:border-gray-700 shrink-0">
            <button 
                onClick={onClose}
                className="w-full sm:w-auto px-10 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors"
            >
                {t('settings.button.done')}
            </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};