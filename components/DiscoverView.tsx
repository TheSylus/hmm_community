import React from 'react';
import { FoodItem, Like, CommentWithProfile } from '../types';
import { FoodItemCard } from './FoodItemCard';
import { useTranslation } from '../i18n/index';
import { GlobeAltIcon, SpinnerIcon } from './Icons';

interface DiscoverViewProps {
  items: FoodItem[];
  isLoading: boolean;
  onViewDetails: (item: FoodItem) => void;
  likes: Like[];
  comments: CommentWithProfile[];
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({ items, isLoading, onViewDetails, likes, comments }) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <SpinnerIcon className="w-12 h-12 text-indigo-500" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">{t('discover.loading')}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">{t('discover.title')}</h1>
      
      {items.length === 0 ? (
        <div className="text-center py-10 px-4">
          <GlobeAltIcon className="w-16 h-16 mx-auto text-gray-400" />
          <h2 className="mt-4 text-2xl font-semibold text-gray-600 dark:text-gray-400">{t('discover.empty.title')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">{t('discover.empty.description')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map(item => (
            <FoodItemCard
              key={item.id}
              item={item}
              onDelete={() => {}} // No delete action on discover view
              onEdit={() => {}}   // No edit action on discover view
              onAddToGroupShoppingList={() => {}} // No add to list action on discover view
              onViewDetails={onViewDetails}
              isPreview={true}
              likes={likes.filter(l => l.food_item_id === item.id)}
              comments={comments.filter(c => c.food_item_id === item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
