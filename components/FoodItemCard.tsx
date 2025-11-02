import React, { useCallback } from 'react';
import { FoodItem, NutriScore } from '../types';
import { StarIcon, TrashIcon, PencilIcon, LactoseFreeIcon, VeganIcon, GlutenFreeIcon, ShareIcon, ShoppingBagIcon, BuildingStorefrontIcon, GlobeAltIcon, LockClosedIcon } from './Icons';
import { AllergenDisplay } from './AllergenDisplay';
import { useTranslation } from '../i18n/index';
import { useTranslatedItem } from '../hooks/useTranslatedItem';

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

// Helper function to compress data and encode it to a URL-safe Base64 string
const compressAndEncode = async (data: object): Promise<string> => {
  const jsonString = JSON.stringify(data);
  // Use the CompressionStream API to gzip the data
  const stream = new Blob([jsonString]).stream().pipeThrough(new CompressionStream('gzip'));
  const compressed = await new Response(stream).arrayBuffer();
  
  // Convert the compressed ArrayBuffer to a binary string
  const bytes = new Uint8Array(compressed);
  let binaryString = '';
  bytes.forEach((byte) => {
    binaryString += String.fromCharCode(byte);
  });
  
  // Encode the binary string to Base64 and make it URL-safe
  return btoa(binaryString)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
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

  const handleShare = useCallback(async () => {
    if (!item || !displayItem) return;

    try {
      // Create a minified object for sharing. To keep the URL short,
      // we exclude potentially long fields like notes, ingredients, and allergens.
      const { id, image, ...dataToShare } = item;
      const minified: any = {
        n: dataToShare.name,
        r: dataToShare.rating,
        it: dataToShare.itemType,
        t: dataToShare.tags,
      };

      if (dataToShare.itemType === 'product') {
          minified.ns = dataToShare.nutriScore;
          minified.lf = dataToShare.isLactoseFree;
          minified.v = dataToShare.isVegan;
          minified.gf = dataToShare.isGlutenFree;
      } else {
          minified.rn = dataToShare.restaurantName;
          minified.ct = dataToShare.cuisineType;
          minified.p = dataToShare.price;
      }
      
      // Clean up undefined/null values and empty arrays to make the JSON string even smaller
      Object.keys(minified).forEach((key) => {
        const k = key as keyof typeof minified;
        if (minified[k] === undefined || minified[k] === null || (Array.isArray(minified[k]) && (minified[k] as any[]).length === 0)) {
          delete (minified as any)[k];
        }
      });
      
      const serializedItem = await compressAndEncode(minified);

      const shareUrl = `${window.location.origin}${window.location.pathname}?s=${serializedItem}`;
      
      const shareTitle = t('share.title', { name: displayItem.name });
      const shareBody = displayItem.rating > 0
        ? t('share.text', { name: displayItem.name, rating: displayItem.rating })
        : t('share.text_unrated', { name: displayItem.name });
      
      const shareData = {
        title: shareTitle,
        // The URL is part of the text. Most apps will parse it and create a rich preview.
        // This avoids the issue where some apps append the 'url' field as plain text when it's separate.
        text: `${shareBody}\n${shareUrl}`,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        alert("Sharing is not supported on this browser.");
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        console.log('Share cancelled by user.');
      } else {
        console.error('Share failed:', err);
      }
    }
  }, [item, displayItem, t]);

  if (!displayItem) {
    return null; // Render nothing if the item is not available
  }
  
  const hasDietaryOrAllergens = displayItem.itemType === 'product' && (displayItem.isLactoseFree || displayItem.isVegan || displayItem.isGlutenFree || (displayItem.allergens && displayItem.allergens.length > 0));
  const hasTags = displayItem.tags && displayItem.tags.length > 0;
  const isClickable = onViewDetails;

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
                {displayItem.isPublic ? (
                    <GlobeAltIcon className="w-5 h-5 text-green-500" />
                ) : (
                    <LockClosedIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                )}
                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {t(displayItem.isPublic ? 'card.publicTooltip' : 'card.privateTooltip')}
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
                                <button
                                onClick={(e) => { e.stopPropagation(); onAddToShoppingList(item); }}
                                className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
                                aria-label={t('shoppingList.addAria', { name: displayItem.name })}
                                >
                                <ShoppingBagIcon className="w-5 h-5" />
                            </button>
                            )}
                            {navigator.share && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleShare(); }}
                                className="text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
                                aria-label={t('card.shareAria', { name: displayItem.name })}
                            >
                                <ShareIcon className="w-5 h-5" />
                            </button>
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
        {displayItem.notes && (
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