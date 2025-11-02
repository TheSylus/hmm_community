import React, { useState, useEffect } from 'react';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../i18n';
import { ApiKeyTester } from './ApiKeyTester';
import { XMarkIcon, SpinnerIcon, CheckIcon } from './Icons';
import { setApiKey } from '../services/geminiService';
import { UserProfile } from '../types';


interface SettingsModalProps {
  onClose: () => void;
  onUpdateProfile: (displayName: string) => Promise<boolean>;
  currentUserProfile: UserProfile | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onUpdateProfile, currentUserProfile }) => {
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { 
    isAiEnabled, setIsAiEnabled, 
    isBarcodeScannerEnabled, setIsBarcodeScannerEnabled,
    isOffSearchEnabled, setIsOffSearchEnabled 
  } = useAppSettings();

  const [displayName, setDisplayName] = useState('');
  const [profileSaveStatus, setProfileSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  useEffect(() => {
    if (currentUserProfile) {
      setDisplayName(currentUserProfile.display_name || '');
    }
  }, [currentUserProfile]);

  const handleProfileSave = async () => {
    if (!displayName.trim()) return;
    setProfileSaveStatus('saving');
    const success = await onUpdateProfile(displayName.trim());
    if (success) {
      setProfileSaveStatus('success');
      setTimeout(() => setProfileSaveStatus('idle'), 2000);
    } else {
      setProfileSaveStatus('idle');
      // Optionally show an error message
    }
  };

  const handleKeyVerified = (apiKey: string) => {
    setApiKey(apiKey);
  };

  const Toggle: React.FC<{ label: string; description: string; checked: boolean; onChange: (checked: boolean) => void; }> = ({ label, description, checked, onChange }) => (
    <label htmlFor={label} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700/50 p-3 rounded-lg cursor-pointer transition hover:bg-gray-200 dark:hover:bg-gray-700">
      <div className="max-w-[75%] pr-2">
        <span className="font-semibold text-gray-800 dark:text-gray-200">{label}</span>
        <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <div className="relative">
        <input id={label} type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-green-600"></div>
      </div>
    </label>
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div
        className="relative bg-white dark:bg-gray-900 p-6 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="settings-title" className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label={t('settings.closeAria')}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-8 pr-2 -mr-2">
          <section>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">{t('settings.profile.title')}</h3>
             <div>
                <label htmlFor="display-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.profile.displayName')}</label>
                <div className="flex gap-2">
                    <input
                        id="display-name"
                        type="text"
                        placeholder={t('settings.profile.placeholder')}
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="flex-grow w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2"
                    />
                     <button
                        onClick={handleProfileSave}
                        disabled={profileSaveStatus !== 'idle' || !displayName.trim() || displayName.trim() === currentUserProfile?.display_name}
                        className="w-32 flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 dark:disabled:bg-gray-600"
                    >
                       {profileSaveStatus === 'saving' && <SpinnerIcon className="w-5 h-5 animate-spin" />}
                       {profileSaveStatus === 'success' && <CheckIcon className="w-5 h-5" />}
                       {profileSaveStatus === 'idle' && <span>{t('settings.profile.saveButton')}</span>}
                    </button>
                </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">{t('settings.general')}</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="theme-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.theme.label')}</label>
                <select
                  id="theme-select"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                  className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2"
                >
                  <option value="light">{t('settings.theme.light')}</option>
                  <option value="dark">{t('settings.theme.dark')}</option>
                  <option value="system">{t('settings.theme.system')}</option>
                </select>
              </div>
              <div>
                <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.language.label')}</label>
                <select
                  id="language-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'en' | 'de')}
                  className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2"
                >
                  <option value="en">English</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">{t('settings.features')}</h3>
            <div className="space-y-3">
              <Toggle label={t('settings.features.ai.label')} description={t('settings.features.ai.description')} checked={isAiEnabled} onChange={setIsAiEnabled} />
              <Toggle label={t('settings.features.barcode.label')} description={t('settings.features.barcode.description')} checked={isBarcodeScannerEnabled} onChange={setIsBarcodeScannerEnabled} />
              <Toggle label={t('settings.features.off.label')} description={t('settings.features.off.description')} checked={isOffSearchEnabled} onChange={setIsOffSearchEnabled} />
            </div>
          </section>
          
          <section>
             <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('settings.apiKey.title')}</h3>
             <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('settings.apiKey.description')}</p>
             <ApiKeyTester onKeyVerified={handleKeyVerified} />
          </section>
        </div>

      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        .pr-2.-mr-2::-webkit-scrollbar { width: 8px; }
        .pr-2.-mr-2::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .dark .pr-2.-mr-2::-webkit-scrollbar-track { background: #374151; }
        .pr-2.-mr-2::-webkit-scrollbar-thumb { background: #9ca3af; border-radius: 4px; }
        .dark .pr-2.-mr-2::-webkit-scrollbar-thumb { background: #4b5563; }
        .pr-2.-mr-2::-webkit-scrollbar-thumb:hover { background: #6b7280; }
        .dark .pr-2.-mr-2::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
      `}</style>
    </div>
  );
};