import React from 'react';
import { useTranslation } from '../i18n/index';
import { XMarkIcon } from './Icons';
import { SortKey, RatingFilter, TypeFilter } from '../App';
import { ConversationalSearchInput } from './ConversationalSearchInput';

interface FilterPanelProps {
  onClose: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  typeFilter: TypeFilter;
  setTypeFilter: (filter: TypeFilter) => void;
  ratingFilter: RatingFilter;
  setRatingFilter: (filter: RatingFilter) => void;
  sortBy: SortKey;
  setSortBy: (key: SortKey) => void;
  onReset: () => void;
  onAiSearch: (query: string) => void;
  isAiSearchLoading: boolean;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  onClose,
  searchTerm,
  setSearchTerm,
  typeFilter,
  setTypeFilter,
  ratingFilter,
  setRatingFilter,
  sortBy,
  setSortBy,
  onReset,
  onAiSearch,
  isAiSearchLoading,
}) => {
  const { t } = useTranslation();

  const handleReset = () => {
    onReset();
    onClose();
  };
  
  const handleAiSearch = (query: string) => {
      onAiSearch(query);
      // We don't close the panel automatically here, user can apply other filters too
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-60 z-30 animate-fade-in-fast"
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <div
        className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white dark:bg-gray-800 shadow-2xl z-40 flex flex-col animate-slide-in-right"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-panel-title"
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 id="filter-panel-title" className="text-xl font-bold text-gray-900 dark:text-white">{t('filterPanel.title')}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label={t('settings.closeAria')}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* AI Search Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('filterPanel.aiSearchTitle')}</label>
            <ConversationalSearchInput onSearch={handleAiSearch} isLoading={isAiSearchLoading} />
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Search Term */}
          <div>
            <label htmlFor="search-term" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('filterPanel.search')}</label>
            <input
                id="search-term"
                type="text"
                placeholder={t('header.searchPlaceholder')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2"
            />
          </div>

          {/* Type Filter */}
          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('filterPanel.filterByType')}</label>
            <select
                id="type-filter"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as TypeFilter)}
                className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2"
            >
                <option value="all">{t('header.filter.type.all')}</option>
                <option value="product">{t('header.filter.type.products')}</option>
                <option value="dish">{t('header.filter.type.dishes')}</option>
            </select>
          </div>
          
          {/* Rating Filter */}
          <div>
             <label htmlFor="rating-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('filterPanel.filterByRating')}</label>
              <select
                  id="rating-filter"
                  value={ratingFilter}
                  onChange={e => setRatingFilter(e.target.value as RatingFilter)}
                  className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2"
              >
                  <option value="all">{t('header.filter.all')}</option>
                  <option value="liked">{t('header.filter.liked')}</option>
                  <option value="disliked">{t('header.filter.disliked')}</option>
              </select>
          </div>

           {/* Sort By */}
           <div>
              <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('filterPanel.sortBy')}</label>
              <select
                  id="sort-by"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortKey)}
                  className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2"
              >
                  <option value="date_desc">{t('header.sort.dateDesc')}</option>
                  <option value="date_asc">{t('header.sort.dateAsc')}</option>
                  <option value="rating_desc">{t('header.sort.ratingDesc')}</option>
                  <option value="rating_asc">{t('header.sort.ratingAsc')}</option>
                  <option value="name_asc">{t('header.sort.nameAsc')}</option>
                  <option value="name_desc">{t('header.sort.nameDesc')}</option>
              </select>
           </div>
        </div>

        <div className="p-4 flex gap-3 border-t border-gray-200 dark:border-gray-700">
            <button onClick={handleReset} className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                {t('filterPanel.reset')}
            </button>
            <button onClick={onClose} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors">
                {t('filterPanel.apply')}
            </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeInFast { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in-fast { animation: fadeInFast 0.3s ease-out; }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in-right { animation: slideInRight 0.3s ease-out; }
      `}</style>
    </>
  );
};