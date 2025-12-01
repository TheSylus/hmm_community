
import React from 'react';
import { useTranslation } from '../../i18n/index';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { StoreLogo } from '../StoreLogo';
import { GroceryCategory, NutriScore } from '../../types';
import { 
    CategoryProduceIcon, CategoryBakeryIcon, CategoryMeatIcon, CategoryDairyIcon, 
    CategoryPantryIcon, CategoryFrozenIcon, CategorySnacksIcon, CategoryBeveragesIcon, 
    CategoryHouseholdIcon, CategoryPersonalCareIcon, CategoryOtherIcon,
    CategoryRestaurantIcon
} from '../Icons';

interface ProductMetadataSectionProps {
  formState: any;
  formSetters: any;
  uiState: any;
  itemType: string;
}

const nutriScoreOptions: NutriScore[] = ['A', 'B', 'C', 'D', 'E'];
const nutriScoreColors: Record<NutriScore, string> = {
  A: 'bg-green-600',
  B: 'bg-lime-600',
  C: 'bg-yellow-500',
  D: 'bg-orange-500',
  E: 'bg-red-600',
};

// Updated Category List excluding Pet Food, including Restaurant
const groceryCategories: GroceryCategory[] = [
    'produce', 'bakery', 'meat_fish', 'dairy_eggs', 'pantry', 'frozen', 
    'snacks', 'beverages', 'household', 'personal_care', 'restaurant_food', 'other'
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
    'produce': 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    'bakery': 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    'meat_fish': 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    'dairy_eggs': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
    'pantry': 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    'frozen': 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300',
    'snacks': 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
    'beverages': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    'household': 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    'personal_care': 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    'restaurant_food': 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
    'other': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export const ProductMetadataSection: React.FC<ProductMetadataSectionProps> = ({
  formState,
  formSetters,
  uiState,
  itemType
}) => {
  const { t } = useTranslation();
  const { savedShops } = useAppSettings();

  const toggleShop = (shop: string) => {
    const currentShops = formState.purchaseLocation.split(',').map((s: string) => s.trim()).filter(Boolean);
    let newShops;
    if (currentShops.includes(shop)) {
        newShops = currentShops.filter((s: string) => s !== shop);
    } else {
        newShops = [...currentShops, shop];
    }
    formSetters.setPurchaseLocation(newShops.join(', '));
  };

  const isShopSelected = (shop: string) => {
    const currentShops = formState.purchaseLocation.split(',').map((s: string) => s.trim()).filter(Boolean);
    return currentShops.includes(shop);
  };

  return (
    <div className="space-y-4">
      {/* Unified Category Selection */}
      <div className={`space-y-2 transition-shadow rounded-md p-1 ${uiState.highlightedFields.includes('category') ? 'highlight-ai' : ''}`}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('form.category.title')}</label>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {groceryCategories.map(cat => {
            const Icon = CategoryIconMap[cat];
            const isSelected = formState.category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => formSetters.setCategory(cat)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${isSelected ? 'ring-2 ring-indigo-500 shadow-md scale-105' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 opacity-70 hover:opacity-100'} ${isSelected ? CategoryColorMap[cat] : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}
                title={t(`category.${cat}`)}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium truncate w-full text-center">{t(`category.${cat}`)}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Purchase Location (Hidden for Restaurant) */}
      {itemType !== 'dish' && (
        <div>
            <input
            type="text"
            placeholder={t('form.placeholder.purchaseLocation')}
            value={formState.purchaseLocation}
            onChange={e => formSetters.setPurchaseLocation(e.target.value)}
            className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3"
            />
            {savedShops.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
                {savedShops.map(shop => {
                const isSelected = isShopSelected(shop);
                return (
                    <button
                    key={shop}
                    type="button"
                    onClick={() => toggleShop(shop)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border transition-colors ${isSelected ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-300 dark:border-indigo-700' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                    <StoreLogo name={shop} size="sm" />
                    <span className={isSelected ? 'font-semibold text-indigo-800 dark:text-indigo-200' : 'text-gray-600 dark:text-gray-300'}>{shop}</span>
                    </button>
                );
                })}
            </div>
            )}
        </div>
      )}

      {/* NutriScore (Product Only) */}
      {itemType === 'product' && (
        <div className={`p-2 rounded-md transition-shadow ${uiState.highlightedFields.includes('nutriScore') ? 'highlight-ai' : ''}`}>
          <div className="flex items-center gap-4">
            <label className="text-gray-700 dark:text-gray-300 font-medium shrink-0">{t('form.label.nutriScore')}</label>
            <div className="flex items-center gap-2 flex-wrap">
              {nutriScoreOptions.map(score => (
                <button
                  type="button"
                  key={score}
                  onClick={() => formSetters.setNutriScore((current: string) => current === score ? '' : score)}
                  className={`w-8 h-8 rounded-full text-white font-bold flex items-center justify-center transition-transform transform ${nutriScoreColors[score]} ${formState.nutriScore === score ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 scale-110' : 'hover:scale-105'}`}
                  aria-pressed={formState.nutriScore === score}
                  aria-label={t('form.aria.selectNutriScore', { score })}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
