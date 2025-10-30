import React from 'react';
import { useTranslation } from '../i18n/index';
import { XMarkIcon, SparklesIcon } from './Icons';

interface ApiKeyBannerProps {
  onDismiss: () => void;
  onOpenSettings: () => void;
}

export const ApiKeyBanner: React.FC<ApiKeyBannerProps> = ({ onDismiss, onOpenSettings }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-green-500 text-white p-3 text-sm relative animate-slide-down">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
        <SparklesIcon className="w-5 h-5 flex-shrink-0 hidden sm:block" />
        <span className="font-medium pr-8 sm:pr-0">{t('apiKeyBanner.text')}</span>
        <button 
          onClick={onOpenSettings}
          className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md font-semibold transition-colors flex-shrink-0"
        >
          {t('apiKeyBanner.button')}
        </button>
      </div>
      <button 
        onClick={onDismiss}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Dismiss"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
       <style>{`
        @keyframes slide-down {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
