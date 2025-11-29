
import React from 'react';
import { FoodItem } from '../types';
import { FoodItemList } from './FoodItemList';
import { useTranslation } from '../i18n/index';
import { PlusCircleIcon, StarIcon } from './Icons';

interface DashboardProps {
  items: FoodItem[];
  isLoading?: boolean;
  onAddNew: () => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onViewDetails: (item: FoodItem) => void;
  onAddToShoppingList: (item: FoodItem) => void;
  shoppingListFoodIds?: Set<string>;
  isFiltering?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  items, 
  isLoading, 
  onAddNew, 
  onDelete, 
  onEdit, 
  onViewDetails, 
  onAddToShoppingList, 
  shoppingListFoodIds,
  isFiltering
}) => {
  const { t } = useTranslation();

  if (isLoading) {
      return (
        <div className="space-y-8">
            <div className="text-center pt-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">{t('dashboard.welcome')}</h1>
            </div>
            <FoodItemList 
                items={[]} 
                isLoading={true} 
                onDelete={onDelete} 
                onEdit={onEdit} 
                onViewDetails={onViewDetails} 
                onAddToShoppingList={onAddToShoppingList}
            />
        </div>
      );
  }

  // Show "Onboarding" empty state only if we have NO items and are NOT filtering.
  // If we are filtering and have 0 results, FoodItemList handles the "No results" message.
  if (items.length === 0 && !isFiltering) {
    return (
      <div className="text-center py-16 px-4 animate-fade-in">
        <div className="bg-indigo-100 dark:bg-indigo-900/30 w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6">
            <StarIcon className="w-12 h-12 text-indigo-500 dark:text-indigo-400" filled />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3">{t('dashboard.empty.title')}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">{t('dashboard.empty.description')}</p>
        <button
            onClick={onAddNew}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-full shadow-xl transition-all transform hover:scale-105 hover:shadow-2xl flex items-center justify-center gap-3 mx-auto"
        >
            <PlusCircleIcon className="w-6 h-6" />
            <span className="text-lg">{t('form.addNewButton')}</span>
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 pb-20">
      <div className="text-center py-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">{t('dashboard.welcome')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {items.length} {items.length === 1 ? 'Eintrag' : 'Einträge'}
        </p>
      </div>

      <FoodItemList 
        items={items} 
        isLoading={false}
        onDelete={onDelete}
        onEdit={onEdit}
        onViewDetails={onViewDetails}
        onAddToShoppingList={onAddToShoppingList}
        shoppingListFoodIds={shoppingListFoodIds}
      />
    </div>
  );
};
