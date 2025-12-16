
import React, { useEffect, useState } from 'react';
import { FoodItem, NutriScore } from '../types';
import { StarIcon, LactoseFreeIcon, VeganIcon, GlutenFreeIcon, BuildingStorefrontIcon, DocumentTextIcon, UserGroupIcon, LockClosedIcon, BeakerIcon } from './Icons';
import { AllergenDisplay } from './AllergenDisplay';
import { useTranslation } from '../i18n/index';
import { useTranslatedItem } from '../hooks/useTranslatedItem';
import { StoreLogo } from './StoreLogo';
import { PriceHistoryChart } from './PriceHistoryChart';
import { fetchPriceHistory, PricePoint } from '../services/priceService';
import { useAuth } from '../contexts/AuthContext';

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

export const FoodItemDetailView: React.FC<FoodItemDetailViewProps> = ({ item, onImageClick }) => {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const displayItem = useTranslatedItem(item);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Fetch History Logic
  useEffect(() => {
      let isMounted = true;
      const loadHistory = async () => {
          if (!user || !displayItem) return;
          
          // Only fetch for products and drugstore, dishes have their own fixed price logic usually
          if (displayItem.itemType !== 'product' && displayItem.itemType !== 'drugstore') return;

          setIsHistoryLoading(true);
          try {
              const history = await fetchPriceHistory(displayItem.name, user.id);
              if (isMounted) setPriceHistory(history);
          } catch (e) {
              console.error("Failed to load price history", e);
          } finally {
              if (isMounted) setIsHistoryLoading(false);
          }
      };
      loadHistory();
      return () => { isMounted = false; };
  }, [user, displayItem?.name, displayItem?.itemType]);

  if (!displayItem) {
    return null; // Or a loading state
  }
  
  const isConsumableOrDrugstore = displayItem.itemType === 'product' || displayItem.itemType === 'drugstore';
  const hasAttributes = isConsumableOrDrugstore && (displayItem.isLactoseFree || displayItem.isVegan || displayItem.isGlutenFree);
  const hasAllergens = isConsumableOrDrugstore && displayItem.allergens && displayItem.allergens.length > 0;
  const hasIngredients = isConsumableOrDrugstore && displayItem.ingredients && displayItem.ingredients.length > 0;
  const hasTags = displayItem.tags && displayItem.tags.length > 0;

  return (
    <div className="space-y-6 text-sm">
      {/* Header with Image, Name, Rating */}
      <div className="flex items-start gap-4">
        {displayItem.image && (
          <div 
            className="w-24 h-24 flex-shrink-0 rounded-md overflow-hidden cursor-pointer group shadow-sm border border-gray-100 dark:border-gray-700"
            onClick={() => displayItem.image && onImageClick(displayItem.image)}
          >
            <img src={displayItem.image} alt={displayItem.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
             <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{displayItem.name}</h3>
             {displayItem.itemType === 'drugstore' && (
                 <div className="bg-purple-100 dark:bg-purple-900/50 p-1 rounded-full text-purple-600 dark:text-purple-300 shrink-0" title={t('modal.itemType.drugstore')}>
                     <BeakerIcon className="w-5 h-5" />
                 </div>
             )}
          </div>
          
          {/* Purchase location for products/drugstore */}
          {isConsumableOrDrugstore && displayItem.purchaseLocation && displayItem.purchaseLocation.length > 0 && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
               {displayItem.purchaseLocation.map((loc, idx) => (
                   <StoreLogo key={idx} name={loc} size="sm" showName={true} className="bg-gray-100 dark:bg-gray-700 rounded-full pr-2 py-0.5 border border-gray-200 dark:border-gray-600" />
               ))}
            </div>
          )}

          {/* Restaurant details for dishes */}
          {displayItem.itemType === 'dish' && (
            <div className="mt-1 space-y-1">
              {displayItem.restaurantName && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                  <BuildingStorefrontIcon className="w-4 h-4" />
                  <p className="truncate italic" title={displayItem.restaurantName}>{displayItem.restaurantName}</p>
                </div>
              )}
              {displayItem.cuisineType && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                  <DocumentTextIcon className="w-4 h-4" />
                  <p className="truncate" title={displayItem.cuisineType}>{displayItem.cuisineType}</p>
                </div>
              )}
            </div>
          )}
          
          {/* Unified Price Display for All Types */}
          {typeof displayItem.price === 'number' && displayItem.price > 0 && (
            <div className="flex items-center gap-1 mt-1 text-lg text-gray-800 dark:text-gray-100 font-bold">
              <span>{displayItem.price.toLocaleString(language === 'de' ? 'de-DE' : 'en-US', { style: 'currency', currency: language === 'de' ? 'EUR' : 'USD' })}</span>
            </div>
          )}

          <div className="flex items-center mt-2">
            {[1, 2, 3, 4, 5].map(star => (
              <StarIcon key={star} className={`w-5 h-5 ${displayItem.rating >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} filled={displayItem.rating >= star} />
            ))}
            
            {displayItem.itemType === 'product' && (
                <div className="flex items-center gap-2 ml-3">
                    {displayItem.nutriScore && (
                    <div className={`text-xs w-6 h-6 rounded-full text-white font-bold flex items-center justify-center flex-shrink-0 shadow-sm ${nutriScoreColors[displayItem.nutriScore]}`}>
                        {displayItem.nutriScore}
                    </div>
                    )}
                    {displayItem.calories && (
                        <div className="text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap border border-orange-200 dark:border-orange-800">
                            🔥 {displayItem.calories} kcal
                        </div>
                    )}
                </div>
            )}
          </div>
           <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-2">
              <span className="font-semibold text-xs uppercase tracking-wide opacity-70">{t('detail.status')}:</span>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${displayItem.isFamilyFavorite ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800' : 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}>
                  {displayItem.isFamilyFavorite ? <UserGroupIcon className="w-3 h-3" /> : <LockClosedIcon className="w-3 h-3" />}
                  <span>{t(displayItem.isFamilyFavorite ? 'detail.statusFamilyFavorite' : 'detail.statusPrivate')}</span>
              </div>
          </div>
        </div>
      </div>

      {/* PRICE WATCH CHART (New Feature) */}
      {!isHistoryLoading && isConsumableOrDrugstore && (
          <div className="animate-fade-in">
              <PriceHistoryChart 
                  history={priceHistory} 
                  currentPrice={displayItem.price} 
                  itemName={displayItem.name} 
              />
          </div>
      )}
      
      {/* Notes */}
      {displayItem.notes && (
        <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-100 dark:border-yellow-800/30">
          <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-1 text-xs uppercase tracking-wide">{t('detail.notesTitle')}</h4>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{displayItem.notes}</p>
        </div>
      )}

      {/* Tags */}
      {hasTags && (
        <div>
          <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2 text-xs uppercase tracking-wide">{t('detail.tagsTitle')}</h4>
          <div className="flex flex-wrap gap-2">
            {displayItem.tags!.map(tag => (
              <span key={tag} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">{tag}</span>
            ))}
          </div>
        </div>
      )}

      {isConsumableOrDrugstore && (hasAttributes || hasAllergens) && (
        <div className="grid grid-cols-1 gap-4 pt-2">
          {hasAttributes && (
            <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
              <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-2 text-xs uppercase tracking-wide">
                  {t(displayItem.itemType === 'drugstore' ? 'form.attributes.title' : 'detail.dietaryTitle')}
              </h4>
              <div className="flex items-center gap-3">
                {displayItem.isLactoseFree && <DietaryIcon type="lactoseFree" className="w-8 h-8" />}
                {displayItem.isVegan && <DietaryIcon type="vegan" className="w-8 h-8" />}
                {displayItem.isGlutenFree && <DietaryIcon type="glutenFree" className="w-8 h-8" />}
              </div>
            </div>
          )}
          {hasAllergens && (
            <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-800/30">
              <h4 className="font-bold text-red-900 dark:text-red-200 mb-2 text-xs uppercase tracking-wide">{t('detail.allergensTitle')}</h4>
              <AllergenDisplay allergens={displayItem.allergens!} />
            </div>
          )}
        </div>
      )}

      {/* Ingredients */}
      {hasIngredients && (
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
          <h4 className="font-bold text-gray-500 dark:text-gray-400 mb-2 text-xs uppercase tracking-wide">
            {t(displayItem.itemType === 'drugstore' ? 'form.ingredients.inciList' : 'detail.ingredientsTitle')}
          </h4>
          <p className="text-gray-600 dark:text-gray-400 italic text-xs leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700/50">
              {displayItem.ingredients!.join(', ')}
          </p>
        </div>
      )}
    </div>
  );
};
