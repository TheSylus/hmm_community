import React, { useState } from 'react';
import { useTranslation } from '../i18n/index';
import { SparklesIcon, SpinnerIcon } from './Icons';

interface ConversationalSearchInputProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const ConversationalSearchInput: React.FC<ConversationalSearchInputProps> = ({ onSearch, isLoading }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('conversationalSearch.placeholder')}
        className="w-full bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-full shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2 pl-4 pr-10 transition"
        disabled={isLoading}
      />
      <button
        type="submit"
        className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors disabled:opacity-50"
        disabled={isLoading || !query.trim()}
        aria-label={t('conversationalSearch.buttonAria')}
        title={t('conversationalSearch.tooltip')}
      >
        {isLoading ? (
          <SpinnerIcon className="w-5 h-5" />
        ) : (
          <SparklesIcon className="w-5 h-5" />
        )}
      </button>
    </form>
  );
};
