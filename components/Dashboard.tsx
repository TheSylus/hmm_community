
import React from 'react';
import { FoodItem } from '../types';
import { FoodItemList } from './FoodItemList';
import { useTranslation } from '../i18n/index';
import { PlusCircleIcon, SparklesIcon } from './Icons';

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
        <div className="space-y-8 pt-6">
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
  if (items.length === 0 && !isFiltering) {
    return (
      <div className="text-center py-16 px-4 animate-fade-in flex flex-col items-center">
        <div className="bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 w-32 h-32 rounded-full flex items-center justify-center mb-8 shadow-inner">
            <SparklesIcon className="w-16 h-16 text-indigo-500 dark:text-indigo-400 opacity-80" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-4">{t('dashboard.empty.title')}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-10 max-w-md mx-auto leading-relaxed text-lg">{t('dashboard.empty.description')}</p>
        
        {/* Internal Add Button for Empty State */}
        <button
            onClick={onAddNew}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-full shadow-xl transition-all transform hover:scale-105 hover:shadow-2xl flex items-center justify-center gap-3"
        >
            <PlusCircleIcon className="w-6 h-6" />
            <span className="text-lg">{t('form.addNewButton')}</span>
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 pb-24">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2 pt-2">
         <div>
             <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                {t('nav.myItems')}
             </h2>
             <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
                {items.length} {items.length === 1 ? 'Eintrag' : 'Einträge'} in deiner Sammlung
             </p>
         </div>
         
         <button
            onClick={onAddNew}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md transition-all hover:shadow-lg active:scale-95"
         >
            <PlusCircleIcon className="w-5 h-5" />
            <span>{t('form.addNewButton')}</span>
         </button>
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
