import React from 'react';
import { FoodItem } from '../types';
import { useTranslation } from '../i18n/index';
import { XMarkIcon, PencilIcon } from './Icons';
import { FoodItemDetailView } from './FoodItemDetailView';

interface FoodItemDetailModalProps {
  item: FoodItem;
  onClose: () => void;
  onEdit: (item: FoodItem) => void;
  onImageClick: (imageUrl: string) => void;
}

export const FoodItemDetailModal: React.FC<FoodItemDetailModalProps> = ({ item, onClose, onEdit, onImageClick }) => {
  const { t } = useTranslation();

  const handleEditClick = () => {
    onClose(); // Close detail view
    onEdit(item); // Open edit form
  };
  
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative bg-white dark:bg-gray-900 p-6 rounded-lg shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            <FoodItemDetailView item={item} onImageClick={onImageClick} />
        </div>
        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-4 border-t border-gray-200 dark:border-gray-700 pt-6">
          <button onClick={onClose} className="w-full sm:w-auto px-6 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-md font-semibold transition-colors">{t('modal.shared.close')}</button>
          <button onClick={handleEditClick} className="w-full sm:w-auto px-8 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
            <PencilIcon className="w-5 h-5" />
            <span>{t('form.editTitle')}</span>
          </button>
        </div>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label={t('settings.closeAria')}
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
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
    </div>
  );
};