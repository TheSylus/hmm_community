import React, { useMemo } from 'react';
import { FoodItem, NutriScore, ShoppingListItem } from '../types';
import { StarIcon, TrashIcon, PencilIcon, LactoseFreeIcon, VeganIcon, GlutenFreeIcon, ShoppingBagIcon, BuildingStorefrontIcon, GlobeAltIcon, LockClosedIcon } from './Icons';
import { AllergenDisplay } from './AllergenDisplay';
import { useTranslation } from '../i18n/index';
import { useTranslatedItem } from '../hooks/useTranslatedItem';

interface FoodItemCardProps {
  item: FoodItem;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onViewDetails: (item: FoodItem) => void;
  onAddToShoppingList: (item: FoodItem) => void;
  onUpdateQuantity: (shoppingListItemId: string, newQuantity: number) => void;
  shoppingListItems: ShoppingListItem[];
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

export const FoodItemCard: React.FC<FoodItemCardProps> = ({ item, onDelete, onEdit, onViewDetails, onAddToShoppingList, onUpdateQuantity, shoppingListItems, isPreview = false }) => {
  const { t } = useTranslation();
  const displayItem = useTranslatedItem(item);

  const shoppingListItem = useMemo(() => shoppingListItems.find(sli => sli.food_item_id === item.id), [shoppingListItems, item.id]);

  if (!displayItem) {
    return null; // Render nothing if the item is not available
  }
  
  const hasDietaryOrAllergens = displayItem.itemType === 'product' && (displayItem.isLactoseFree || displayItem.isVegan || displayItem.isGlutenFree || (displayItem.allergens && displayItem.allergens.length > 0));
  const hasTags = displayItem.tags && displayItem.tags.length > 0;
  const isClickable = !!onViewDetails;

  return (
    <div 
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg flex flex-col p-4 transition-all duration-300 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 relative ${isClickable ? 'cursor-pointer' : ''}`}
        onClick={() => isClickable && onViewDetails(item)}
    >
        <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
            <div className="group relative">
                {displayItem.itemType === 'dish' ? (
                    <BuildingStorefrontIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                ) : (
                    <ShoppingBagIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                )}
                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {t(displayItem.itemType === 'dish' ? 'card.dishTooltip' : 'card.productTooltip')}
                </span>
            </div>
             <div className="group relative">
                {displayItem.isFamilyFavorite ? (
                    <GlobeAltIcon className="w-5 h-5 text-green-500" />
                ) : (
                    <LockClosedIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                )}
                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {t(displayItem.isFamilyFavorite ? 'card.familyFavoriteTooltip' : 'card.privateTooltip')}
                </span>
            </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Image Thumbnail */}
            {displayItem.image && (
                <div className="w-full h-32 sm:w-24 sm:h-24 flex-shrink-0 rounded-md overflow-hidden group">
                    <img src={displayItem.image} alt={displayItem.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
            )}

            {/* Core Details Section */}
            <div className={`flex-1 flex flex-col justify-start overflow-hidden w-full ${!displayItem.image ? 'pl-16' : ''}`}>
                <div className="flex justify-between items-start gap-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate" title={displayItem.name}>{displayItem.name}</h3>
                    
                    {!isPreview && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                            {displayItem.itemType === 'product' && (
                                shoppingListItem ? (
                                    <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                                        <button onClick={(e) => { e.stopPropagation(); onUpdateQuantity(shoppingListItem.id, shoppingListItem.quantity - 1);}} className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                                            <span className="font-bold text-md leading-none">{shoppingListItem.quantity === 1 ? <TrashIcon className="w-4 h-4" /> : '-'}</span>
                                        </button>
                                        <span className="font-bold text-sm text-gray-800 dark:text-gray-200 min-w-[20px] text-center">{shoppingListItem.quantity}</span>
                                        <button onClick={(e) => { e.stopPropagation(); onAddToShoppingList(item); }} className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                                            <span className="font-bold text-md leading-none">+</span>
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={(e) => { e.stopPropagation(); onAddToShoppingList(item); }} className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors" aria-label={t('shoppingList.addAria', { name: displayItem.name })}>
                                        <ShoppingBagIcon className="w-5 h-5" />
                                    </button>
                                )
                            )}
                            <button
                            onClick={(e) => { e.stopPropagation(); onEdit(item.id); }}
                            className="text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
                            aria-label={t('card.editAria', { name: displayItem.name })}
                            >
                            <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                            className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
                            aria-label={t('card.deleteAria', { name: displayItem.name })}
                            >
                            <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
                
                {displayItem.itemType === 'dish' && displayItem.restaurantName && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate italic" title={displayItem.restaurantName}>
                      {t('card.dishAt', { restaurant: displayItem.restaurantName })}
                  </p>
                )}

                {displayItem.itemType === 'product' && displayItem.purchaseLocation && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                    <BuildingStorefrontIcon className="w-4 h-4" />
                    <p className="truncate italic" title={displayItem.purchaseLocation}>{displayItem.purchaseLocation}</p>
                  </div>
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
                
                <div className="mt-1.5 space-y-2">
                    {hasDietaryOrAllergens && (
                         <div className="flex items-center gap-2 flex-wrap">
                            {displayItem.isLactoseFree && <DietaryIcon type="lactoseFree" className="w-6 h-6" />}
                            {displayItem.isVegan && <DietaryIcon type="vegan" className="w-6 h-6" />}
                            {displayItem.isGlutenFree && <DietaryIcon type="glutenFree" className="w-6 h-6" />}
                            {displayItem.allergens && displayItem.allergens.length > 0 && <AllergenDisplay allergens={displayItem.allergens} />}
                        </div>
                    )}

                    {hasTags && (
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {displayItem.tags!.map(tag => (
                            <span key={tag} className="flex-shrink-0 bg-indigo-100 text-indigo-800 dark:bg-indigo-600 dark:text-indigo-100 text-xs font-semibold px-2 py-1 rounded-full">
                                {tag}
                            </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
        
        {/* Notes Section */}
        {displayItem.notes && !isPreview && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/50">
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-tight line-clamp-2">{displayItem.notes}</p>
            </div>
        )}

      {/* Custom scrollbar styling & line clamp */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .line-clamp-2 {
            overflow: hidden;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
        }
      `}</style>
    </div>
  );
};