
import React from 'react';
import { useTranslation } from '../../i18n/index';
import { StarIcon, SpinnerIcon } from '../Icons';

interface MainInfoSectionProps {
  formState: any;
  formSetters: any;
  uiState: any;
  itemType: string;
}

export const MainInfoSection: React.FC<MainInfoSectionProps> = ({
  formState,
  formSetters,
  uiState,
  itemType
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          placeholder={itemType === 'dish' ? t('form.placeholder.dishName') : t('form.placeholder.name')}
          value={formState.name}
          onChange={e => formSetters.setName(e.target.value)}
          required
          className={`w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3 transition-shadow ${uiState.highlightedFields.includes('name') ? 'highlight-ai' : ''} ${uiState.isNameSearchLoading ? 'pr-10' : ''}`}
        />
        {uiState.isNameSearchLoading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <SpinnerIcon className="w-5 h-5 text-gray-400" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <label className="text-gray-700 dark:text-gray-300 font-medium">{t('form.label.rating')}</label>
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              type="button"
              key={star}
              onClick={() => formSetters.setRating(star)}
              className="text-gray-400 dark:text-gray-600 hover:text-yellow-400 transition"
              aria-label={t(star > 1 ? 'form.aria.ratePlural' : 'form.aria.rate', { star })}
            >
              <StarIcon className={`w-8 h-8 ${formState.rating >= star ? 'text-yellow-400' : ''}`} filled={formState.rating >= star} />
            </button>
          ))}
        </div>
      </div>

      <textarea
        placeholder={t('form.placeholder.notes')}
        value={formState.notes}
        onChange={e => formSetters.setNotes(e.target.value)}
        rows={itemType !== 'dish' ? 3 : 5}
        className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3"
      />

      <input
        type="text"
        placeholder={t('form.placeholder.tags')}
        value={formState.tags}
        onChange={e => formSetters.setTags(e.target.value)}
        className={`w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3 transition-shadow ${uiState.highlightedFields.includes('tags') ? 'highlight-ai' : ''}`}
      />
    </div>
  );
};
