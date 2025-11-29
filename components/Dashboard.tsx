
import React, { useState, useMemo } from 'react';
import { FoodItem, GroceryCategory } from '../types';
import { FoodItemList } from './FoodItemList';
import { useTranslation } from '../i18n/index';
import { PlusCircleIcon, SparklesIcon, ArrowsPointingInIcon, ArrowsPointingOutIcon } from './Icons';

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
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Logic to determine all categories currently present
  const allCategories = useMemo(() => {
      const cats = new Set<string>();
      items.forEach(item => cats.add(item.category || 'other'));
      return Array.from(cats);
  }, [items]);

  const isAllCollapsed = allCategories.length > 0 && collapsedCategories.size === allCategories.length;

  const toggleCategory = (category: string) => {
      setCollapsedCategories(prev => {
          const newSet = new Set(prev);
          if (newSet.has(category)) {
              newSet.delete(category);
          } else {
              newSet.add(category);
          }
          return newSet;
      });
  };

  const toggleAll = () => {
      if (isAllCollapsed) {
          setCollapsedCategories(new Set()); // Expand all
      } else {
          setCollapsedCategories(new Set(allCategories)); // Collapse all
      }
  };

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
                collapsedCategories={collapsedCategories}
                onToggleCategory={toggleCategory}
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
    <div className="space-y-4 pb-24">
      {/* Compact Smart Header */}
      <div className="flex justify-between items-center px-1 py-1 sticky top-[72px] z-10 bg-gray-100/90 dark:bg-gray-900/90 backdrop-blur-sm -mx-2 sm:mx-0 sm:rounded-lg">
         {/* Left: Title & Count */}
         <div className="flex items-center gap-2 pl-2">
             <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-none">
                {t('nav.myItems')}
             </h2>
             <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold px-2 py-0.5 rounded-full">
                {items.length}
             </span>
         </div>
         
         {/* Right: Actions */}
         <div className="flex items-center gap-2 pr-1">
             {items.length > 0 && (
                 <button 
                    onClick={toggleAll}
                    className="p-2 rounded-full text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                    title={isAllCollapsed ? "Alle ausklappen" : "Alle einklappen"}
                 >
                    {isAllCollapsed ? <ArrowsPointingOutIcon className="w-5 h-5" /> : <ArrowsPointingInIcon className="w-5 h-5" />}
                 </button>
             )}
             
             <button
                onClick={onAddNew}
                className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1.5 px-3 rounded-full shadow-md transition-all active:scale-95"
             >
                <PlusCircleIcon className="w-5 h-5" />
                <span className="hidden sm:inline text-sm">{t('form.addNewButton')}</span>
             </button>
         </div>
      </div>

      <FoodItemList 
        items={items} 
        isLoading={false}
        onDelete={onDelete}
        onEdit={onEdit}
        onViewDetails={onViewDetails}
        onAddToShoppingList={onAddToShoppingList}
        shoppingListFoodIds={shoppingListFoodIds}
        collapsedCategories={collapsedCategories}
        onToggleCategory={toggleCategory}
      />
    </div>
  );
};