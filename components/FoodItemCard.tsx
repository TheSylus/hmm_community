
import React from 'react';
import { FoodItem, NutriScore } from '../types';
import { StarIcon, TrashIcon, PencilIcon, LactoseFreeIcon, VeganIcon, GlutenFreeIcon, ShoppingBagIcon, BuildingStorefrontIcon, GlobeAltIcon, LockClosedIcon } from './Icons';
import { AllergenDisplay } from './AllergenDisplay';
import { useTranslation } from '../i18n/index';
import { useTranslatedItem } from '../hooks/useTranslatedItem';
import { StoreLogo } from './StoreLogo';

interface FoodItemCardProps {
  item: FoodItem;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onViewDetails: (item: FoodItem) => void;
  onAddToShoppingList: (item: FoodItem) => void;
  isPreview?: boolean;
}

const nutriScoreColors: Record<NutriScore, string> = {
  A: 'bg-green-600',
  B: 'bg-lime-600',
  C: 'bg-yellow-500',
  D: 'bg-orange-500',
  E: 'bg-red-600',
};

const DietaryIcon: React.FC<{ type: 'lactoseFree' | 'vegan' | 'glutenFree', className?: string }> = ({ type, className }) => {
    const { t } = useTranslation();
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

export const FoodItemCard: React.FC<FoodItemCardProps> = ({ item, onDelete, onEdit, onViewDetails, onAddToShoppingList, isPreview = false }) => {
  const { t } = useTranslation();
  const displayItem = useTranslatedItem(item);

  if (!displayItem) {
    return null; // Render nothing if the item is not available
  }
  
  const hasDietaryOrAllergens = displayItem.itemType === 'product' && (displayItem.isLactoseFree || displayItem.isVegan || displayItem.isGlutenFree || (displayItem.allergens && displayItem.allergens.length > 0));
  const hasTags = displayItem.tags && displayItem.tags.length > 0;
  const isClickable = !!onViewDetails;

  return (
    <div 
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden transition-all duration-300 hover:shadow-md relative ${isClickable ? 'cursor-pointer' : ''}`}
        onClick={() => isClickable && onViewDetails(item)}
    >
        <div className="flex flex-row h-full">
            {/* Left Side: Image & Status Overlays */}
            <div className="relative w-28 sm:w-32 shrink-0 bg-gray-100 dark:bg-gray-700">
                {displayItem.image ? (
                    <img src={displayItem.image} alt={displayItem.name} className="w-full h-full object-cover absolute inset-0" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                        {displayItem.itemType === 'dish' ? <BuildingStorefrontIcon className="w-8 h-8"/> : <ShoppingBagIcon className="w-8 h-8"/>}
                    </div>
                )}
                
                {/* Overlay Icons (Status) - Moved onto image to save space */}
                <div className="absolute top-1 left-1 flex flex-col gap-1">
                    <div className="bg-black/60 backdrop-blur-sm p-1 rounded-full text-white shadow-sm">
                        {displayItem.itemType === 'dish' ? (
                            <BuildingStorefrontIcon className="w-3.5 h-3.5" />
                        ) : (
                            <ShoppingBagIcon className="w-3.5 h-3.5" />
                        )}
                    </div>
                    <div className="bg-black/60 backdrop-blur-sm p-1 rounded-full text-white shadow-sm">
                        {displayItem.isFamilyFavorite ? (
                            <GlobeAltIcon className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                            <LockClosedIcon className="w-3.5 h-3.5 text-gray-300" />
                        )}
                    </div>
                </div>
                
                {/* NutriScore Overlay (Bottom Right of Image) */}
                {displayItem.itemType === 'product' && displayItem.nutriScore && (
                    <div className={`absolute bottom-1 right-1 text-[10px] w-5 h-5 rounded-full text-white font-bold flex items-center justify-center shadow-sm ${nutriScoreColors[displayItem.nutriScore]}`}>
                        {displayItem.nutriScore}
                    </div>
                )}
            </div>

            {/* Right Side: Content */}
            <div className="flex-1 flex flex-col justify-between p-3 min-w-0">
                <div>
                    <div className="flex justify-between items-start gap-2">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white truncate leading-tight" title={displayItem.name}>
                            {displayItem.name}
                        </h3>
                        
                        {!isPreview && (
                            <div className="flex items-center -mr-1 -mt-1 shrink-0">
                                {displayItem.itemType === 'product' && (
                                    <button
                                    onClick={(e) => { e.stopPropagation(); onAddToShoppingList(item); }}
                                    className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                                    aria-label={t('shoppingList.addAria', { name: displayItem.name })}
                                    >
                                    <ShoppingBagIcon className="w-4 h-4" />
                                </button>
                                )}
                                <button
                                onClick={(e) => { e.stopPropagation(); onEdit(item.id); }}
                                className="text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                                aria-label={t('card.editAria', { name: displayItem.name })}
                                >
                                <PencilIcon className="w-4 h-4" />
                                </button>
                                <button
                                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                                className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                                aria-label={t('card.deleteAria', { name: displayItem.name })}
                                >
                                <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1 mt-1">
                        <div className="flex">
                            {[1, 2, 3, 4, 5].map(star => (
                                <StarIcon key={star} className={`w-3.5 h-3.5 ${displayItem.rating >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} filled={displayItem.rating >= star} />
                            ))}
                        </div>
                    </div>

                    {/* Location / Restaurant Line */}
                    <div className="mt-1.5 min-h-[1.25rem]">
                        {displayItem.itemType === 'dish' && displayItem.restaurantName && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate italic flex items-center gap-1">
                                <BuildingStorefrontIcon className="w-3 h-3"/> {displayItem.restaurantName}
                            </p>
                        )}

                        {displayItem.itemType === 'product' && displayItem.purchaseLocation && displayItem.purchaseLocation.length > 0 && (
                            <div className="flex items-center gap-1 overflow-hidden">
                                {displayItem.purchaseLocation.slice(0, 3).map((loc, idx) => (
                                    <StoreLogo key={idx} name={loc} size="sm" showName={false} className="w-5 h-5" />
                                ))}
                                {displayItem.purchaseLocation.length > 3 && (
                                    <span className="text-[10px] text-gray-400">+{displayItem.purchaseLocation.length - 3}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Bottom Row: Tags & Dietary */}
                <div className="mt-2 flex items-center justify-between gap-2 overflow-hidden h-6">
                    {hasTags ? (
                        <div className="flex gap-1 overflow-x-auto scrollbar-hide py-0.5 mask-linear-fade">
                            {displayItem.tags!.map(tag => (
                            <span key={tag} className="flex-shrink-0 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 text-[10px] font-medium px-1.5 py-0.5 rounded">
                                {tag}
                            </span>
                            ))}
                        </div>
                    ) : <div />}

                    {hasDietaryOrAllergens && (
                         <div className="flex items-center gap-1 flex-shrink-0 pl-1 bg-white dark:bg-gray-800 shadow-[-4px_0_4px_rgba(255,255,255,0.8)] dark:shadow-[-4px_0_4px_rgba(31,41,55,0.8)]">
                            {displayItem.isLactoseFree && <DietaryIcon type="lactoseFree" className="w-4 h-4" />}
                            {displayItem.isVegan && <DietaryIcon type="vegan" className="w-4 h-4" />}
                            {displayItem.isGlutenFree && <DietaryIcon type="glutenFree" className="w-4 h-4" />}
                            {/* Show just a generic allergen warning icon if allergens exist but no room for specific icons */}
                            {displayItem.allergens && displayItem.allergens.length > 0 && !displayItem.isVegan && !displayItem.isGlutenFree && (
                                <span className="text-[10px] font-bold text-orange-500 border border-orange-200 rounded px-1">!</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>

      {/* Custom scrollbar styling & line clamp */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .mask-linear-fade {
            mask-image: linear-gradient(to right, black 90%, transparent 100%);
            -webkit-mask-image: linear-gradient(to right, black 90%, transparent 100%);
        }
      `}</style>
    </div>
  );
};
