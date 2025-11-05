import React from 'react';
import { FoodItem, NutriScore } from '../types';
import { StarIcon, LactoseFreeIcon, VeganIcon, GlutenFreeIcon } from './Icons';
import { AllergenDisplay } from './AllergenDisplay';
import { useTranslation } from '../i18n/index';
import { useTranslatedItem } from '../hooks/useTranslatedItem';

interface FoodItemDetailViewProps {
  item: FoodItem;
  onImageClick: (imageUrl: string) => void;
}

const nutriScoreColors: Record<NutriScore, string> = {
  A: 'bg-green-600',
  B: 'bg-lime-600',
  C: 'bg-yellow-500',
  D: 'bg-orange-500',
  E: 'bg-red-600',
};

export const FoodItemDetailView: React.FC<FoodItemDetailViewProps> = ({ item, onImageClick }) => {
  const { t } = useTranslation();
  const displayItem = useTranslatedItem(item);

  if (!displayItem) {
    return null; // Or a loading state
  }
  
  const hasDietary = displayItem.itemType === 'product' && (displayItem.isLactoseFree || displayItem.isVegan || displayItem.isGlutenFree);
  const hasAllergens = displayItem.itemType === 'product' && displayItem.allergens && displayItem.allergens.length > 0;
  const hasIngredients = displayItem.itemType === 'product' && displayItem.ingredients && displayItem.ingredients.length > 0;
  const hasTags = displayItem.tags && displayItem.tags.length > 0;
  
  const DietaryIcon: React.FC<{ type: 'lactoseFree' | 'vegan' | 'glutenFree', className?: string }> = ({ type, className }) => {
      const icons = {
          lactoseFree: <LactoseFreeIcon className={`${className} text-blue-600 dark:text-blue-400`} />,
          vegan: <VeganIcon className={`${className}`} />,
          glutenFree: <GlutenFreeIcon className={`${className}`} />,
      };
      const tooltips = {
          lactoseFree: t('card.lactoseFreeTooltip'),
          vegan: t('card.veganTooltip'),
          glutenFree: t('card.glutenFreeTooltip'),
      };
      return (
          <div className="relative group flex items-center justify-center">
              {icons[type]}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {tooltips[type]}
              </span>
          </div>
      );
  }

  return (
    <div className="space-y-4 text-sm">
      {/* Header with Image, Name, Rating */}
      <div className="flex items-start gap-4">
        {displayItem.image && (
          <div 
            className="w-24 h-24 flex-shrink-0 rounded-md overflow-hidden cursor-pointer group"
            onClick={() => displayItem.image && onImageClick(displayItem.image)}
          >
            <img src={displayItem.image} alt={displayItem.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{displayItem.name}</h3>
          
          {displayItem.itemType === 'dish' && displayItem.restaurantName && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate italic" title={displayItem.restaurantName}>
                  {t('card.dishAt', { restaurant: displayItem.restaurantName })}
              </p>
          )}

          <div className="flex items-center my-1.5">
            {[1, 2, 3, 4, 5].map(star => (
              <StarIcon key={star} className={`w-5 h-5 ${displayItem.rating >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} filled={displayItem.rating >= star} />
            ))}
            {displayItem.itemType === 'product' && displayItem.nutriScore && (
              <div className={`ml-3 text-xs w-6 h-6 rounded-full text-white font-bold flex items-center justify-center flex-shrink-0 ${nutriScoreColors[displayItem.nutriScore]}`}>
                {displayItem.nutriScore}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Notes */}
      {displayItem.notes && (
        <div>
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('detail.notesTitle')}</h4>
          <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{displayItem.notes}</p>
        </div>
      )}

      {/* Tags */}
      {hasTags && (
        <div>
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('detail.tagsTitle')}</h4>
          <div className="flex flex-wrap gap-2">
            {displayItem.tags!.map(tag => (
              <span key={tag} className="bg-indigo-100 text-indigo-800 dark:bg-indigo-600 dark:text-indigo-100 text-xs font-semibold px-2 py-1 rounded-full">{tag}</span>
            ))}
          </div>
        </div>
      )}

      {displayItem.itemType === 'product' && (hasDietary || hasAllergens) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-200 dark:border-gray-700/50">
          {hasDietary && (
            <div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('detail.dietaryTitle')}</h4>
              <div className="flex items-center gap-2">
                {displayItem.isLactoseFree && <DietaryIcon type="lactoseFree" className="w-6 h-6" />}
                {displayItem.isVegan && <DietaryIcon type="vegan" className="w-6 h-6" />}
                {displayItem.isGlutenFree && <DietaryIcon type="glutenFree" className="w-6 h-6" />}
              </div>
            </div>
          )}
          {hasAllergens && (
            <div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('detail.allergensTitle')}</h4>
              <AllergenDisplay allergens={displayItem.allergens!} />
            </div>
          )}
        </div>
      )}

      {/* Ingredients */}
      {hasIngredients && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700/50">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('detail.ingredientsTitle')}</h4>
          <p className="text-gray-500 dark:text-gray-500 italic text-xs leading-snug">{displayItem.ingredients!.join(', ')}</p>
        </div>
      )}
    </div>
  );
};