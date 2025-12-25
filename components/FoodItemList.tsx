
import React, { useMemo } from 'react';
import { FoodItem, GroceryCategory } from '../types';
import { FoodItemCard } from './FoodItemCard';
import { SkeletonCard } from './SkeletonCard';
import { useTranslation } from '../i18n/index';
import { 
    CategoryProduceIcon, CategoryBakeryIcon, CategoryMeatIcon, CategoryDairyIcon, 
    CategoryPantryIcon, CategoryFrozenIcon, CategorySnacksIcon, CategoryBeveragesIcon, 
    CategoryHouseholdIcon, CategoryPersonalCareIcon, CategoryOtherIcon,
    CategoryRestaurantIcon, ChevronDownIcon, MagnifyingGlassIcon
} from './Icons';

interface FoodItemListProps {
  items: FoodItem[];
  isLoading?: boolean;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onViewDetails: (item: FoodItem) => void;
  onAddToShoppingList: (item: FoodItem) => void;
  shoppingListFoodIds?: Set<string>;
  collapsedCategories: Set<string>;
  onToggleCategory: (category: string) => void;
  onToggleFamilyStatus: (item: FoodItem) => void;
}

const CATEGORY_ORDER: GroceryCategory[] = [
    'produce', 'bakery', 'meat_fish', 'dairy_eggs', 'pantry', 
    'snacks', 'beverages', 'frozen', 'household', 'personal_care', 
    'restaurant_food', 'other'
];

const CategoryIconMap: Record<GroceryCategory, React.FC<{ className?: string }>> = {
    'produce': CategoryProduceIcon,
    'bakery': CategoryBakeryIcon,
    'meat_fish': CategoryMeatIcon,
    'dairy_eggs': CategoryDairyIcon,
    'pantry': CategoryPantryIcon,
    'frozen': CategoryFrozenIcon,
    'snacks': CategorySnacksIcon,
    'beverages': CategoryBeveragesIcon,
    'household': CategoryHouseholdIcon,
    'personal_care': CategoryPersonalCareIcon,
    'restaurant_food': CategoryRestaurantIcon,
    'other': CategoryOtherIcon,
};

const CategoryColorMap: Record<GroceryCategory, string> = {
    'produce': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800',
    'bakery': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    'meat_fish': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800',
    'dairy_eggs': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    'pantry': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    'frozen': 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    'snacks': 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300 border-pink-200 dark:border-pink-800',
    'beverages': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    'household': 'bg-gray-200 text-gray-800 dark:bg-gray-700/60 dark:text-gray-300 border-gray-300 dark:border-gray-600',
    'personal_care': 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    'restaurant_food': 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    'other': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
};

const CategorySection: React.FC<{
    category: GroceryCategory;
    items: FoodItem[];
    onToggle: (cat: string) => void;
    isCollapsed: boolean;
    onDelete: (id: string) => void;
    onEdit: (id: string) => void;
    onViewDetails: (item: FoodItem) => void;
    onAddToShoppingList: (item: FoodItem) => void;
    onToggleFamilyStatus: (item: FoodItem) => void;
    shoppingListFoodIds?: Set<string>;
}> = ({ category, items, onToggle, isCollapsed, ...props }) => {
    const { t } = useTranslation();
    const Icon = CategoryIconMap[category];
    const colorClass = CategoryColorMap[category];

    if (items.length === 0) return null;

    return (
        <div className="mb-6 last:mb-0 transition-all duration-300 ease-in-out">
            <button 
                onClick={() => onToggle(category)}
                className={`w-full flex items-center justify-between p-3 rounded-xl mb-3 transition-all duration-200 border sticky top-[calc(130px+env(safe-area-inset-top,0px))] z-10 shadow-sm backdrop-blur-md ${colorClass} bg-opacity-95 dark:bg-opacity-90 active:scale-[0.99]`}
            >
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-white dark:bg-black/20 rounded-full shadow-sm">
                        <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-base">{t(`category.${category}`)}</span>
                    <span className="bg-white/50 dark:bg-black/20 px-2.5 py-0.5 rounded-full text-xs font-bold">
                        {items.length}
                    </span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : ''}`} />
            </button>

            {!isCollapsed && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 px-1">
                    {items.map((item, index) => (
                        <div 
                            key={item.id} 
                            className="transition-all duration-300 animate-fade-in-staggered"
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <FoodItemCard 
                                item={item} 
                                onDelete={props.onDelete} 
                                onEdit={props.onEdit}
                                onViewDetails={props.onViewDetails}
                                onAddToShoppingList={props.onAddToShoppingList}
                                onToggleFamilyStatus={props.onToggleFamilyStatus}
                                isInShoppingList={props.shoppingListFoodIds?.has(item.id)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const FoodItemList: React.FC<FoodItemListProps> = ({ items, isLoading, onDelete, onEdit, onViewDetails, onAddToShoppingList, shoppingListFoodIds, collapsedCategories, onToggleCategory, onToggleFamilyStatus }) => {
  const { t } = useTranslation();

  const groupedItems = useMemo(() => {
      const groups: Record<string, FoodItem[]> = {};
      items.forEach(item => {
          const cat = item.category || 'other';
          if (!groups[cat]) groups[cat] = [];
          groups[cat].push(item);
      });
      return groups;
  }, [items]);

  if (isLoading) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 px-1">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      );
  }

  if (items.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-4 shadow-inner">
                <MagnifyingGlassIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300">{t('list.empty.title')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-[250px]">{t('list.empty.description')}</p>
        </div>
    );
  }

  return (
    <div className="pb-24">
        {CATEGORY_ORDER.map(category => (
            <CategorySection
                key={category}
                category={category}
                items={groupedItems[category] || []}
                onToggle={onToggleCategory}
                isCollapsed={collapsedCategories.has(category)}
                onDelete={onDelete}
                onEdit={onEdit}
                onViewDetails={onViewDetails}
                onAddToShoppingList={onAddToShoppingList}
                onToggleFamilyStatus={onToggleFamilyStatus}
                shoppingListFoodIds={shoppingListFoodIds}
            />
        ))}

        {Object.keys(groupedItems)
            .filter(cat => !CATEGORY_ORDER.includes(cat as GroceryCategory))
            .map(category => (
                <CategorySection
                    key={category}
                    category={category as GroceryCategory}
                    items={groupedItems[category]}
                    onToggle={onToggleCategory}
                    isCollapsed={collapsedCategories.has(category)}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onViewDetails={onViewDetails}
                    onAddToShoppingList={onAddToShoppingList}
                    onToggleFamilyStatus={onToggleFamilyStatus}
                    shoppingListFoodIds={shoppingListFoodIds}
                />
            ))
        }
        <style>{`
            @keyframes fadeInStaggered { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            .animate-fade-in-staggered { animation: fadeInStaggered 0.4s ease-out forwards; opacity: 0; }
            .animate-fade-in { animation: fadeInStaggered 0.4s ease-out; }
        `}</style>
    </div>
  );
};
