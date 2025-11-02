import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { Collection, FoodItem } from '../types';
import { XMarkIcon, SpinnerIcon, PlusCircleIcon } from './Icons';

interface AddToCollectionModalProps {
  item: FoodItem;
  collections: Collection[];
  onClose: () => void;
  onSave: (collectionId: string, foodItemId: string) => Promise<void>;
  onCreateAndSave: (collectionName: string, foodItemId: string) => Promise<void>;
}

export const AddToCollectionModal: React.FC<AddToCollectionModalProps> = ({
  item,
  collections,
  onClose,
  onSave,
  onCreateAndSave,
}) => {
  const { t } = useTranslation();
  const [selectedCollection, setSelectedCollection] = useState<string>(collections[0]?.id || '');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveToExisting = async () => {
    if (!selectedCollection) return;
    setIsLoading(true);
    setError(null);
    try {
      await onSave(selectedCollection, item.id);
      onClose();
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        setError(t('collection.addError', { error: message }));
    } finally {
        setIsLoading(false);
    }
  };

  const handleCreateAndSave = async () => {
    if (!newCollectionName.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
        await onCreateAndSave(newCollectionName.trim(), item.id);
        onClose();
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        setError(t('collection.addError', { error: message }));
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('collection.modal.title', { itemName: item.name })}
        </h2>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label={t('settings.closeAria')}
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="space-y-6 mt-6">
          {/* Add to existing collection */}
          <div>
            <label htmlFor="collection-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('collection.selectExisting')}
            </label>
            <div className="flex gap-2">
              <select
                id="collection-select"
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                disabled={collections.length === 0}
                className="flex-grow w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2 disabled:opacity-50"
              >
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                onClick={handleSaveToExisting}
                disabled={!selectedCollection || isLoading}
                className="w-28 flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 dark:disabled:bg-gray-600"
              >
                {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <span>{t('collection.existing.addButton')}</span>}
              </button>
            </div>
          </div>

          {/* Create new collection */}
          <div>
            <label htmlFor="new-collection" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('collection.createNew')}
            </label>
            <div className="flex gap-2">
              <input
                id="new-collection"
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder={t('collection.new.placeholder')}
                className="flex-grow w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2"
              />
              <button
                onClick={handleCreateAndSave}
                disabled={!newCollectionName.trim() || isLoading}
                className="w-40 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition-colors disabled:bg-green-400 dark:disabled:bg-gray-600"
              >
                 {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <span>{t('collection.new.saveButton')}</span>}
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
        </div>
      </div>
       <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
};