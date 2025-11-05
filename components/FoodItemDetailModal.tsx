// FIX: Implemented the FoodItemDetailModal component to display detailed food item information in a modal view, resolving module errors.
import React from 'react';
import { FoodItem } from '../types';
import { FoodItemDetailView } from './FoodItemDetailView';
import { useTranslation } from '../i18n/index';
import { XMarkIcon } from './Icons';
import { ImageModal } from './ImageModal';

interface FoodItemDetailModalProps {
  item: FoodItem;
  onClose: () => void;
}

export const FoodItemDetailModal: React.FC<FoodItemDetailModalProps> = ({ item, onClose }) => {
  const { t } = useTranslation();
  const [isImageModalOpen, setIsImageModalOpen] = React.useState(false);

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
      >
        <div
          className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 id="detail-modal-title" className="text-xl font-bold text-gray-900 dark:text-white">{item.name}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label={t('settings.closeAria')}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <FoodItemDetailView item={item} onImageClick={() => setIsImageModalOpen(true)} />
          </div>
        </div>
      </div>

      {isImageModalOpen && item.image && (
        <ImageModal imageUrl={item.image} onClose={() => setIsImageModalOpen(false)} />
      )}
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </>
  );
};
