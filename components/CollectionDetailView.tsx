import React from 'react';
import { Collection, FoodItem, UserProfile } from '../types';
import { useTranslation } from '../i18n';
import { FoodItemCard } from './FoodItemCard';
import { SpinnerIcon } from './Icons';

interface CollectionDetailViewProps {
  collection: Collection;
  author: UserProfile | null;
  onViewDetails: (item: FoodItem) => void;
  onClose: () => void;
}

export const CollectionDetailView: React.FC<CollectionDetailViewProps> = ({ collection, author, onViewDetails, onClose }) => {
  const { t } = useTranslation();

  const items = collection.collection_items.map(ci => ci.food_items);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 text-center">
        {t('collection.view.title', { name: collection.name })}
      </h1>
      {author && (
        <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
          {t('collection.view.by', { name: author.display_name })}
        </p>
      )}

      {collection.description && (
        <p className="text-center text-gray-600 dark:text-gray-300 mb-6 italic">
          {collection.description}
        </p>
      )}

      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(item => (
            <FoodItemCard
              key={item.id}
              item={item}
              onViewDetails={onViewDetails}
              onDelete={() => {}}
              onEdit={() => {}}
              onAddToShoppingList={() => {}}
              isPreview
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">{t('collection.view.empty')}</p>
        </div>
      )}
    </div>
  );
};