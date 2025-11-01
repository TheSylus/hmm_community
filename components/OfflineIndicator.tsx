import React from 'react';
import { useTranslation } from '../i18n/index';

interface OfflineIndicatorProps {
  isOnline: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ isOnline }) => {
  const { t } = useTranslation();

  if (isOnline) {
    return null;
  }

  return (
    <div className="bg-yellow-500 text-yellow-900 font-semibold p-3 text-center text-sm animate-slide-down" role="status">
      <p>{t('offline.message')}</p>
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
