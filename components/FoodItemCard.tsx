
import React, { useState } from 'react';
import { FoodItem, NutriScore } from '../types';
import { StarIcon, TrashIcon, LactoseFreeIcon, VeganIcon, GlutenFreeIcon, ShoppingBagIcon, BuildingStorefrontIcon, UserGroupIcon, LockClosedIcon, ShoppingCartIcon, BeakerIcon } from './Icons';
import { useTranslation } from '../i18n/index';
import { useTranslatedItem } from '../hooks/useTranslatedItem';
import { StoreLogo } from './StoreLogo';
import { useAuth } from '../contexts/AuthContext';
import { triggerHaptic } from '../utils/haptics';

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

// Internal component for the actual content
const FoodItemCardContent: React.FC<FoodItemCardProps> = ({ item, onDelete, onEdit, onViewDetails, onAddToShoppingList, onToggleFamilyStatus, isPreview = false, isInShoppingList = false }) => {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const displayItem = useTranslatedItem(item);

  // Swipe State
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchOffset, setTouchOffset] = useState(0);
  const SWIPE_THRESHOLD = 80;

  if (!displayItem) {
    return null;
  }
  
  const hasDietaryOrAllergens = displayItem.itemType === 'product' && (displayItem.isLactoseFree || displayItem.isVegan || displayItem.isGlutenFree || (displayItem.allergens && displayItem.allergens.length > 0));
  const hasTags = displayItem.tags && displayItem.tags.length > 0;
  // If not a preview, the card is clickable to Edit
  const isClickable = !isPreview;
  const isFamilyShared = displayItem.isFamilyFavorite;
  const isOwner = user?.id === displayItem.user_id;

  const getPlaceholderIcon = () => {
      switch(displayItem.itemType) {
          case 'dish': return <BuildingStorefrontIcon className="w-6 h-6 text-gray-400/50"/>;
          case 'drugstore': return <BeakerIcon className="w-6 h-6 text-gray-400/50"/>;
          default: return <ShoppingBagIcon className="w-6 h-6 text-gray-400/50"/>;
      }
  };

  const getStatusIcon = () => {
      switch(displayItem.itemType) {
          case 'dish': return <BuildingStorefrontIcon className="w-2.5 h-2.5" />;
          case 'drugstore': return <BeakerIcon className="w-2.5 h-2.5" />;
          default: return null;
      }
  };

  const statusIcon = getStatusIcon();

  let borderClass = 'border-gray-100 dark:border-gray-700';
  let ringClass = '';

  if (isFamilyShared) {
      borderClass = 'border-amber-200 dark:border-amber-800';
      ringClass = 'ring-1 ring-amber-100 dark:ring-amber-900/30';
  }

  // Swipe Handlers
  const onTouchStart = (e: React.TouchEvent) => {
      if (isPreview) return;
      setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
      if (touchStart === null || isPreview) return;
      const currentTouch = e.targetTouches[0].clientX;
      const diff = currentTouch - touchStart;
      if (diff < 0) {
          setTouchOffset(Math.max(diff, -150));
      }
  };

  const onTouchEnd = () => {
      if (touchStart === null || isPreview) return;
      if (touchOffset < -SWIPE_THRESHOLD) {
          triggerHaptic('warning');
          onDelete(item.id);
          setTouchOffset(0); 
      } else {
          setTouchOffset(0);
      }
      setTouchStart(null);
  };

  const handleCardClick = () => {
      if (Math.abs(touchOffset) > 5) return;
      
      if (isPreview) {
          // In preview mode (e.g. Discover or Duplicate check), show details modal if available
          if (onViewDetails) onViewDetails(item);
      } else {
          // In Dashboard, go straight to Edit Form
          onEdit(item.id);
      }
  };

  return (
    <div className={`relative h-24 sm:h-28 w-full select-none touch-pan-y rounded-xl ${isPreview ? '' : 'overflow-hidden'}`}>
        
        {/* Background Action Layer */}
        {!isPreview && (
            <div 
                className="absolute inset-0 bg-red-500 flex items-center justify-end pr-6 rounded-xl transition-opacity duration-200"
                style={{ opacity: Math.abs(touchOffset) > 20 ? 1 : 0 }}
            >
                <TrashIcon className="w-6 h-6 text-white" />
            </div>
        )}

        {/* Foreground Card */}
        <div 
            className={`group bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden transition-transform duration-200 relative flex flex-row h-full w-full ${isClickable ? 'cursor-pointer' : ''} ${borderClass} ${ringClass}`}
            style={{ transform: `translateX(${touchOffset}px)` }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onClick={handleCardClick}
        >
            {/* Left Side: Image */}
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
                <div className="absolute top-1 left-1 flex flex-col gap-1">
                    {statusIcon && (
                        <div className="bg-white/90 dark:bg-black/60 backdrop-blur-md p-0.5 rounded-full text-gray-700 dark:text-gray-200 shadow-sm border border-black/5 dark:border-white/10">
                            {statusIcon}
                        </div>
                    )}
                    
                    <button
                        type="button" 
                        className={`backdrop-blur-md p-0.5 rounded-full shadow-sm transition-all duration-200 border border-black/5 dark:border-white/10 ${isFamilyShared ? 'bg-amber-100/90 text-amber-700 dark:bg-amber-900/80 dark:text-amber-300' : 'bg-white/90 text-gray-400 dark:bg-black/60 dark:text-gray-400'} ${isOwner && !isPreview ? 'cursor-pointer hover:scale-110 active:scale-95' : ''}`}
                        onClick={(e) => {
                            if (isOwner && !isPreview && onToggleFamilyStatus) {
                                e.stopPropagation();
                                onToggleFamilyStatus(item);
                            }
                        }}
                        disabled={!isOwner || isPreview}
                    >
                        {isFamilyShared ? <UserGroupIcon className="w-2.5 h-2.5" /> : <LockClosedIcon className="w-2.5 h-2.5" />}
                    </button>
                </div>
                
                {/* NutriScore */}
                {displayItem.itemType === 'product' && displayItem.nutriScore && (
                    <div className={`absolute bottom-1 right-1 text-[9px] w-4 h-4 rounded-full text-white font-bold flex items-center justify-center shadow-sm border border-white/20 ${nutriScoreColors[displayItem.nutriScore]}`}>
                        {displayItem.nutriScore}
                    </div>
                )}
            </div>

            {/* Right Side: Content - Compact Layout */}
            <div className="flex-1 flex flex-col justify-between p-2 min-w-0 relative">
                
                <div>
                    <div className="flex justify-between items-start gap-1">
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate leading-tight tracking-tight" title={displayItem.name}>
                            {displayItem.name}
                        </h3>
                        
                        {!isPreview && (
                            <div className="flex items-center gap-0.5 -mr-1 -mt-1 shrink-0">
                                {displayItem.itemType !== 'dish' && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onAddToShoppingList(item); }}
                                        className={`p-1 rounded-full transition-all duration-200 ${
                                            isInShoppingList 
                                            ? 'bg-indigo-600 text-white shadow-sm' 
                                            : 'text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300'
                                        }`}
                                    >
                                        {isInShoppingList ? <ShoppingCartIcon className="w-3.5 h-3.5" /> : <ShoppingBagIcon className="w-3.5 h-3.5" />}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-0.5 mt-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                            <StarIcon key={star} className={`w-3 h-3 ${displayItem.rating >= star ? 'text-yellow-400 fill-current' : 'text-gray-200 dark:text-gray-700'}`} filled={displayItem.rating >= star} />
                        ))}
                    </div>

                    <div className="mt-1 min-h-[1rem] flex items-center justify-between">
                        <div className="overflow-hidden flex-1">
                            {displayItem.itemType === 'dish' && displayItem.restaurantName && (
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate italic flex items-center gap-1">
                                    <BuildingStorefrontIcon className="w-2.5 h-2.5"/> {displayItem.restaurantName}
                                </p>
                            )}

                            {(displayItem.itemType === 'product' || displayItem.itemType === 'drugstore') && displayItem.purchaseLocation && displayItem.purchaseLocation.length > 0 && (
                                <div className="flex items-center gap-0.5 overflow-hidden">
                                    {displayItem.purchaseLocation.slice(0, 3).map((loc, idx) => (
                                        <StoreLogo key={idx} name={loc} size="sm" showName={false} className="w-3.5 h-3.5 opacity-80 grayscale-[0.3]" />
                                    ))}
                                    {displayItem.purchaseLocation.length > 3 && (
                                        <span className="text-[9px] text-gray-400">+{displayItem.purchaseLocation.length - 3}</span>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {/* PRICE BADGE ON CARD */}
                        {typeof displayItem.price === 'number' && (
                            <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 px-1.5 py-0.5 rounded ml-1 shrink-0 whitespace-nowrap">
                                {displayItem.price.toFixed(2)}€
                            </span>
                        )}
                    </div>
                </div>
                
                {/* Footer Row: Tags & Dietary Badges */}
                <div className="flex items-end justify-between gap-2 overflow-hidden h-5">
                    {hasTags ? (
                        <div className="flex gap-1 overflow-x-auto scrollbar-hide py-0.5 mask-linear-fade w-full">
                            {displayItem.tags!.map(tag => (
                            <span key={tag} className="flex-shrink-0 bg-gray-50 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400 text-[9px] font-medium px-1.5 py-0 rounded-full border border-gray-100 dark:border-gray-700 whitespace-nowrap">
                                {tag}
                            </span>
                            ))}
                        </div>
                    ) : <div />}

                    {hasDietaryOrAllergens && (
                        <div className="flex items-center gap-0.5 flex-shrink-0 pl-1 bg-gradient-to-l from-white via-white to-transparent dark:from-gray-800 dark:via-gray-800">
                            {displayItem.isLactoseFree && <DietaryIcon type="lactoseFree" className="w-3.5 h-3.5" />}
                            {displayItem.isVegan && <DietaryIcon type="vegan" className="w-3.5 h-3.5" />}
                            {displayItem.isGlutenFree && <DietaryIcon type="glutenFree" className="w-3.5 h-3.5" />}
                            {displayItem.allergens && displayItem.allergens.length > 0 && !displayItem.isVegan && !displayItem.isGlutenFree && (
                                <span className="text-[9px] font-bold text-orange-500 border border-orange-200 dark:border-orange-800 rounded px-0.5" title="Allergens">!</span>
                            )}
                        </div>
                    )}
                </div>
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
