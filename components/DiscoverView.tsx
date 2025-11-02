import React from 'react';
import { FoodItem } from '../types';
import { FoodItemCard } from './FoodItemCard';
import { useTranslation } from '../i18n/index';
import { GlobeAltIcon, SpinnerIcon } from './Icons';

interface DiscoverViewProps {
  items: FoodItem[];
  isLoading: boolean;
  onViewDetails: (item: FoodItem) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({ items, isLoading, onViewDetails }) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center pt-20">
            <SpinnerIcon className="w-12 h-12 text-indigo-500" />
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">{t('discover.loading')}</p>
        </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6 text-center">{t('discover.title')}</h1>
      {items.length === 0 ? (
        <div className="text-center py-10 px-4">
            <GlobeAltIcon className="w-16 h-16 mx-auto text-indigo-400" />
            <h2 className="mt-4 text-2xl font-semibold text-gray-600 dark:text-gray-400">{t('discover.empty.title')}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">{t('discover.empty.description')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map(item => (
            <FoodItemCard 
              key={item.id} 
              item={item} 
              onDelete={() => {}} 
              onEdit={() => {}}
              onViewDetails={onViewDetails}
              onAddToShoppingList={() => {}}
              isPreview={true} // Community cards are always in preview mode (no edit/delete)
            />
          ))}
        </div>
      )}
    </div>
  );
};