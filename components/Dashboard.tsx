
import React, { useState, useMemo } from 'react';
import { FoodItem, GroceryCategory } from '../types';
import { FoodItemList } from './FoodItemList';
import { useTranslation } from '../i18n/index';
import { ArrowsPointingInIcon, ArrowsPointingOutIcon, CameraIcon, SparklesIcon } from './Icons';

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
        
        <button
            onClick={onAddNew}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-full shadow-xl transition-all transform hover:scale-105 hover:shadow-2xl flex items-center justify-center gap-3"
        >
            <CameraIcon className="w-6 h-6" />
            <span className="text-lg">{t('form.button.takePhoto')}</span>
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 pb-24">
      {/* Utility Row: Expand/Collapse Control */}
      {items.length > 0 && (
         <div className="flex justify-end px-1 pt-2 animate-fade-in">
             <button 
                onClick={toggleAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-full shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all active:scale-95"
                title={isAllCollapsed ? "Alle ausklappen" : "Alle einklappen"}
             >
                {isAllCollapsed ? (
                    <>
                        <ArrowsPointingOutIcon className="w-3.5 h-3.5" />
                        <span>Alles anzeigen</span>
                    </>
                ) : (
                    <>
                        <ArrowsPointingInIcon className="w-3.5 h-3.5" />
                        <span>Alles einklappen</span>
                    </>
                )}
             </button>
         </div>
      )}

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
