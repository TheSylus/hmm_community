
import React from 'react';
import { FoodItem } from '../types';
import { FoodItemCard } from './FoodItemCard';
import { SkeletonCard } from './SkeletonCard';
import { useTranslation } from '../i18n/index';
import { PlusCircleIcon, StarIcon } from './Icons';

interface DashboardProps {
  items: FoodItem[];
  isLoading?: boolean;
  onViewAll: () => void;
  onAddNew: () => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onViewDetails: (item: FoodItem) => void;
  onAddToShoppingList: (item: FoodItem) => void;
  shoppingListFoodIds?: Set<string>;
}

export const Dashboard: React.FC<DashboardProps> = ({ items, isLoading, onViewAll, onAddNew, shoppingListFoodIds, ...cardProps }) => {
  const { t } = useTranslation();

  const recentlyAdded = [...items].slice(0, 3);
  const topRated = [...items]
    .filter(item => item.rating >= 4)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  if (isLoading) {
      return (
        <div className="space-y-12">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">{t('dashboard.welcome')}</h1>
                <div className="h-16 w-48 mx-auto bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>
            <section>
                <div className="flex justify-between items-center mb-4">
                    <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            </section>
        </div>
      );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-10 px-4">
        <StarIcon className="w-16 h-16 mx-auto text-yellow-400" filled />
        <h2 className="mt-4 text-2xl font-semibold text-gray-700 dark:text-gray-300">{t('dashboard.empty.title')}</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6">{t('dashboard.empty.description')}</p>
        <button
            onClick={onAddNew}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center gap-2 mx-auto"
        >
            <PlusCircleIcon className="w-6 h-6" />
            <span>{t('form.addNewButton')}</span>
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">{t('dashboard.welcome')}</h1>
         <button
            onClick={onAddNew}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center gap-3 mx-auto"
        >
            <PlusCircleIcon className="w-8 h-8" />
            <span className="text-xl">{t('form.addNewButton')}</span>
        </button>
      </div>

      {/* Recently Added Section */}
      {recentlyAdded.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300">{t('dashboard.recentlyAdded')}</h2>
            <button onClick={onViewAll} className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
              {t('dashboard.viewAll')}
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {recentlyAdded.map(item => (
              <FoodItemCard key={item.id} item={item} isInShoppingList={shoppingListFoodIds?.has(item.id)} {...cardProps} />
            ))}
          </div>
        </section>
      )}

      {/* Top Rated Section */}
      {topRated.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300">{t('dashboard.topRated')}</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {topRated.map(item => (
              <FoodItemCard key={item.id} item={item} isInShoppingList={shoppingListFoodIds?.has(item.id)} {...cardProps} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
