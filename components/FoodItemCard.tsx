
import React from 'react';
import { FoodItem, NutriScore } from '../types';
import { StarIcon, TrashIcon, PencilIcon, LactoseFreeIcon, VeganIcon, GlutenFreeIcon, ShoppingBagIcon, BuildingStorefrontIcon, UserGroupIcon, LockClosedIcon, ShoppingCartIcon, BeakerIcon } from './Icons';
import { useTranslation } from '../i18n/index';
import { useTranslatedItem } from '../hooks/useTranslatedItem';
import { StoreLogo } from './StoreLogo';
import { useAuth } from '../contexts/AuthContext';

interface FoodItemCardProps {
  item: FoodItem;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onViewDetails: (item: FoodItem) => void;
  onAddToShoppingList: (item: FoodItem) => void;
  onToggleFamilyStatus?: (item: FoodItem) => void;
  isPreview?: boolean;
  isInShoppingList?: boolean;
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

// Internal component for the actual card content
const FoodItemCardContent: React.FC<FoodItemCardProps> = ({ item, onDelete, onEdit, onViewDetails, onAddToShoppingList, onToggleFamilyStatus, isPreview = false, isInShoppingList = false }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const displayItem = useTranslatedItem(item);

  if (!displayItem) {
    return null;
  }
  
  const hasDietaryOrAllergens = displayItem.itemType === 'product' && (displayItem.isLactoseFree || displayItem.isVegan || displayItem.isGlutenFree || (displayItem.allergens && displayItem.allergens.length > 0));
  const hasTags = displayItem.tags && displayItem.tags.length > 0;
  const isClickable = !!onViewDetails;
  const isFamilyShared = displayItem.isFamilyFavorite;
  const isDrugstore = displayItem.itemType === 'drugstore';
  
  const isOwner = user?.id === displayItem.user_id;

  // Visual indicator for item type on the image
  const getPlaceholderIcon = () => {
      switch(displayItem.itemType) {
          case 'dish': return <BuildingStorefrontIcon className="w-8 h-8 text-gray-400/50"/>;
          case 'drugstore': return <BeakerIcon className="w-8 h-8 text-gray-400/50"/>;
          default: return <ShoppingBagIcon className="w-8 h-8 text-gray-400/50"/>;
      }
  };

  const getStatusIcon = () => {
      switch(displayItem.itemType) {
          case 'dish': return <BuildingStorefrontIcon className="w-3 h-3" />;
          case 'drugstore': return <BeakerIcon className="w-3 h-3" />;
          default: return null;
      }
  };

  const statusIcon = getStatusIcon();

  // Dynamic Border/Ring Color Logic (Subtler for Premium Feel)
  let borderClass = 'border-gray-100 dark:border-gray-700';
  let ringClass = '';

  if (isFamilyShared) {
      borderClass = 'border-amber-200 dark:border-amber-800';
      ringClass = 'ring-1 ring-amber-100 dark:ring-amber-900/30';
  }

  return (
    <div 
        className={`group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 relative flex flex-row h-32 sm:h-36 ${isClickable ? 'cursor-pointer' : ''} ${borderClass} ${ringClass}`}
        onClick={() => isClickable && onViewDetails(item)}
    >
        {/* Left Side: Image (Strict Aspect Ratio) */}
        <div className="relative aspect-square h-full shrink-0 bg-gray-50 dark:bg-gray-700/50 overflow-hidden">
            {displayItem.image ? (
                <img 
                    src={displayItem.image} 
                    alt={displayItem.name} 
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700/50">
                    {getPlaceholderIcon()}
                </div>
            )}
            
            {/* Top Left Status Overlay */}
            <div className="absolute top-1.5 left-1.5 flex flex-col gap-1.5">
                {/* Type Icon */}
                {statusIcon && (
                    <div className="bg-white/90 dark:bg-black/60 backdrop-blur-md p-1 rounded-full text-gray-700 dark:text-gray-200 shadow-sm border border-black/5 dark:border-white/10">
                        {statusIcon}
                    </div>
                )}
                
                {/* Family/Private Toggle */}
                <button
                    type="button" 
                    className={`backdrop-blur-md p-1 rounded-full shadow-sm transition-all duration-200 border border-black/5 dark:border-white/10 ${isFamilyShared ? 'bg-amber-100/90 text-amber-700 dark:bg-amber-900/80 dark:text-amber-300' : 'bg-white/90 text-gray-400 dark:bg-black/60 dark:text-gray-400'} ${isOwner && !isPreview ? 'cursor-pointer hover:scale-110 active:scale-95' : ''}`}
                    onClick={(e) => {
                        if (isOwner && !isPreview && onToggleFamilyStatus) {
                            e.stopPropagation();
                            onToggleFamilyStatus(item);
                        }
                    }}
                    title={isOwner ? t('card.toggleFamilyStatus') : (isFamilyShared ? t('card.familyFavoriteTooltip') : t('card.privateTooltip'))}
                    disabled={!isOwner || isPreview}
                >
                    {isFamilyShared ? <UserGroupIcon className="w-3 h-3" /> : <LockClosedIcon className="w-3 h-3" />}
                </button>
            </div>
            
            {/* NutriScore (Bottom Right) */}
            {displayItem.itemType === 'product' && displayItem.nutriScore && (
                <div className={`absolute bottom-1.5 right-1.5 text-[10px] w-5 h-5 rounded-full text-white font-bold flex items-center justify-center shadow-sm border border-white/20 ${nutriScoreColors[displayItem.nutriScore]}`}>
                    {displayItem.nutriScore}
                </div>
            )}
        </div>

        {/* Right Side: Content */}
        <div className="flex-1 flex flex-col justify-between p-3 min-w-0 relative">
            
            {/* Header Section */}
            <div>
                <div className="flex justify-between items-start gap-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white truncate leading-tight tracking-tight" title={displayItem.name}>
                        {displayItem.name}
                    </h3>
                    
                    {!isPreview && (
                        <div className="flex items-center gap-1 -mr-1 -mt-1 shrink-0">
                            {displayItem.itemType !== 'dish' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onAddToShoppingList(item); }}
                                    className={`p-1.5 rounded-full transition-all duration-200 ${
                                        isInShoppingList 
                                        ? 'bg-indigo-600 text-white shadow-md' 
                                        : 'text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300'
                                    }`}
                                >
                                    {isInShoppingList ? <ShoppingCartIcon className="w-4 h-4" /> : <ShoppingBagIcon className="w-4 h-4" />}
                                </button>
                            )}
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(item.id); }}
                                className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-colors"
                            >
                                <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                                className="p-1.5 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Rating Stars */}
                <div className="flex items-center gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map(star => (
                        <StarIcon key={star} className={`w-3.5 h-3.5 ${displayItem.rating >= star ? 'text-yellow-400 fill-current' : 'text-gray-200 dark:text-gray-700'}`} filled={displayItem.rating >= star} />
                    ))}
                </div>

                {/* Metadata Line (Restaurant / Store) */}
                <div className="mt-2 min-h-[1.25rem]">
                    {displayItem.itemType === 'dish' && displayItem.restaurantName && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate italic flex items-center gap-1">
                            <BuildingStorefrontIcon className="w-3 h-3"/> {displayItem.restaurantName}
                        </p>
                    )}

                    {(displayItem.itemType === 'product' || displayItem.itemType === 'drugstore') && displayItem.purchaseLocation && displayItem.purchaseLocation.length > 0 && (
                        <div className="flex items-center gap-1 overflow-hidden">
                            {displayItem.purchaseLocation.slice(0, 3).map((loc, idx) => (
                                <StoreLogo key={idx} name={loc} size="sm" showName={false} className="w-4 h-4 opacity-80 grayscale-[0.3]" />
                            ))}
                            {displayItem.purchaseLocation.length > 3 && (
                                <span className="text-[10px] text-gray-400">+{displayItem.purchaseLocation.length - 3}</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Footer Row: Tags & Dietary Badges */}
            <div className="flex items-end justify-between gap-2 overflow-hidden h-6 mt-1">
                {hasTags ? (
                    <div className="flex gap-1 overflow-x-auto scrollbar-hide py-0.5 mask-linear-fade w-full">
                        {displayItem.tags!.map(tag => (
                        <span key={tag} className="flex-shrink-0 bg-gray-50 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400 text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-100 dark:border-gray-700 whitespace-nowrap">
                            {tag}
                        </span>
                        ))}
                    </div>
                ) : <div />}

                {/* Dietary Icons stuck to the right */}
                {hasDietaryOrAllergens && (
                     <div className="flex items-center gap-1 flex-shrink-0 pl-2 bg-gradient-to-l from-white via-white to-transparent dark:from-gray-800 dark:via-gray-800">
                        {displayItem.isLactoseFree && <DietaryIcon type="lactoseFree" className="w-4 h-4" />}
                        {displayItem.isVegan && <DietaryIcon type="vegan" className="w-4 h-4" />}
                        {displayItem.isGlutenFree && <DietaryIcon type="glutenFree" className="w-4 h-4" />}
                        {displayItem.allergens && displayItem.allergens.length > 0 && !displayItem.isVegan && !displayItem.isGlutenFree && (
                            <span className="text-[10px] font-bold text-orange-500 border border-orange-200 dark:border-orange-800 rounded px-1" title="Allergens">!</span>
                        )}
                    </div>
                )}
            </div>
        </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .mask-linear-fade {
            mask-image: linear-gradient(to right, black 85%, transparent 100%);
            -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
        }
      `}</style>
    </div>
  );
};

export const FoodItemCard = React.memo(FoodItemCardContent);
