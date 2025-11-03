import React, { useState, useEffect } from 'react';
import { FoodItem } from '../types';
import { FoodItemCard } from './FoodItemCard';
import { useTranslation } from '../i18n/index';
import { translateTexts } from '../services/translationService';

interface DuplicateConfirmationModalProps {
  items: FoodItem[];
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DuplicateConfirmationModal: React.FC<DuplicateConfirmationModalProps> = ({ items, itemName, onConfirm, onCancel }) => {
  const { t, language } = useTranslation();
  const [translatedItemName, setTranslatedItemName] = useState(itemName);

  useEffect(() => {
    let isMounted = true;
    const translateName = async () => {
      if (language === 'en') {
        if(isMounted) setTranslatedItemName(itemName);
        return;
      }
      try {
        const result = await translateTexts([itemName], language);
        if (isMounted && result.length > 0) {
          setTranslatedItemName(result[0]);
        }
      } catch (e) {
        console.error("Failed to translate item name for modal:", e);
        if(isMounted) setTranslatedItemName(itemName); // fallback
      }
    };

    translateName();
    return () => { isMounted = false; }
  }, [itemName, language]);
  
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="duplicate-modal-title"
    >
      <div
        className="relative bg-white dark:bg-gray-900 p-6 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="duplicate-modal-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('modal.duplicate.title')}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {t('modal.duplicate.description', { itemName: translatedItemName })}
        </p>
        
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 -mr-2 bg-gray-100 dark:bg-gray-800/50 p-4 rounded-md">
            {items.map(item => (
                <FoodItemCard
                    key={item.id}
                    item={item}
                    onDelete={() => {}} // No delete action in this context
                    onEdit={() => {}} // No edit action in this context
                    onViewDetails={() => {}} // No details view in this context
                    onAddToGroupShoppingList={() => {}} // No action in this context
                    isPreview={true}
                />
            ))}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-4 border-t border-gray-200 dark:border-gray-700 pt-6">
          <button
            onClick={onCancel}
            className="w-full sm:w-auto px-6 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-md font-semibold transition-colors"
          >
            {t('modal.duplicate.button.goBack')}
          </button>
          <button
            onClick={onConfirm}
            className="w-full sm:w-auto px-8 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition-colors"
          >
            {t('modal.duplicate.button.addAnyway')}
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
        .pr-2.-mr-2::-webkit-scrollbar {
          width: 8px;
        }
        .pr-2.-mr-2::-webkit-scrollbar-track {
          background: #f1f5f9; /* gray-100 */
          border-radius: 4px;
        }
        .dark .pr-2.-mr-2::-webkit-scrollbar-track {
          background: #374151; /* gray-700 */
        }
        .pr-2.-mr-2::-webkit-scrollbar-thumb {
          background: #9ca3af; /* gray-400 */
          border-radius: 4px;
        }
        .dark .pr-2.-mr-2::-webkit-scrollbar-thumb {
          background: #4b5563; /* gray-600 */
        }
        .pr-2.-mr-2::-webkit-scrollbar-thumb:hover {
          background: #6b7280; /* gray-500 */
        }
        .dark .pr-2.-mr-2::-webkit-scrollbar-thumb:hover {
           background: #9ca3af; /* gray-400 */
        }
      `}</style>
    </div>
  );
};