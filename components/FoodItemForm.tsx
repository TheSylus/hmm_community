
import React from 'react';
import { FoodItem, FoodItemType, NutriScore, GroceryCategory } from '../types';
import { StarIcon, SparklesIcon, CameraIcon, PlusCircleIcon, XMarkIcon, DocumentTextIcon, LactoseFreeIcon, VeganIcon, GlutenFreeIcon, BarcodeIcon, MicrophoneIcon, SpinnerIcon, MapPinIcon, CategoryProduceIcon, CategoryBakeryIcon, CategoryMeatIcon, CategoryDairyIcon, CategoryPantryIcon, CategoryFrozenIcon, CategorySnacksIcon, CategoryBeveragesIcon, CategoryHouseholdIcon, CategoryPersonalCareIcon, CategoryPetFoodIcon, CategoryOtherIcon } from './Icons';
import { useTranslation } from '../i18n/index';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useFoodFormLogic } from '../hooks/useFoodFormLogic';
import { StoreLogo } from './StoreLogo';
import { CameraCapture } from './CameraCapture';
import { BarcodeScanner } from './BarcodeScanner';
import { SpeechInputModal } from './SpeechInputModal';
import { ImageCropper } from './ImageCropper';

interface FoodItemFormProps {
  onSaveItem: (item: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) => void;
  onCancel: () => void;
  initialData?: FoodItem | null;
  itemType: FoodItemType;
  householdId: string | null;
}

const nutriScoreOptions: NutriScore[] = ['A', 'B', 'C', 'D', 'E'];
const nutriScoreColors: Record<NutriScore, string> = {
  A: 'bg-green-600',
  B: 'bg-lime-600',
  C: 'bg-yellow-500',
  D: 'bg-orange-500',
  E: 'bg-red-600',
};

const groceryCategories: GroceryCategory[] = [
    'produce', 'bakery', 'meat_fish', 'dairy_eggs', 'pantry', 'frozen', 
    'snacks', 'beverages', 'household', 'personal_care', 'pet_food', 'other'
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
    'pet_food': CategoryPetFoodIcon,
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
    'pet_food': 'bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-300',
    'other': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export const FoodItemForm: React.FC<FoodItemFormProps> = ({ onSaveItem, onCancel, initialData, itemType, householdId }) => {
  const { t } = useTranslation();
  const { isBarcodeScannerEnabled, savedShops } = useAppSettings();
  
  const isEditing = !!initialData;
  
  // Use the custom hook for logic
  const {
    formState,
    formSetters,
    uiState,
    uiSetters,
    actions,
    fileInputRef
  } = useFoodFormLogic({ initialData, itemType, onSaveItem, onCancel });

  const toggleShop = (shop: string) => {
      const currentShops = formState.purchaseLocation.split(',').map(s => s.trim()).filter(Boolean);
      let newShops;
      if (currentShops.includes(shop)) {
          newShops = currentShops.filter(s => s !== shop);
      } else {
          newShops = [...currentShops, shop];
      }
      formSetters.setPurchaseLocation(newShops.join(', '));
  };

  const isShopSelected = (shop: string) => {
      const currentShops = formState.purchaseLocation.split(',').map(s => s.trim()).filter(Boolean);
      return currentShops.includes(shop);
  };

  return (
    <>
      <style>{`
        .highlight-ai {
          animation: highlight-ai-anim 2.5s ease-out;
        }
        @keyframes highlight-ai-anim {
          0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
          25% { box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.5); }
          100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
        }
        .dark .highlight-ai {
            animation-name: highlight-ai-anim-dark;
        }
        @keyframes highlight-ai-anim-dark {
          0% { box-shadow: 0 0 0 0 rgba(129, 140, 248, 0); }
          25% { box-shadow: 0 0 0 4px rgba(129, 140, 248, 0.4); }
          100% { box-shadow: 0 0 0 0 rgba(129, 140, 248, 0); }
        }
      `}</style>
      <form onSubmit={actions.handleSubmit} className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg mb-8">
         <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">
            {isEditing ? t('form.editTitle') : t('form.addNewButton')}
        </h2>

        <div className="space-y-6">

            {/* ACTION BUTTONS & PREVIEW */}
            <div className="space-y-4">
                <div className={`grid grid-cols-2 ${isBarcodeScannerEnabled && itemType !== 'dish' ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-2`}>
                    {isBarcodeScannerEnabled && itemType !== 'dish' && (
                        <button type="button" onClick={() => uiSetters.setIsBarcodeScannerOpen(true)} className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-3 rounded-md transition disabled:bg-sky-400 dark:disabled:bg-gray-600 text-sm" disabled={uiState.isLoading || uiState.analysisProgress.active}>
                            <BarcodeIcon className="w-5 h-5" />
                            <span>{t('form.button.scanBarcode')}</span>
                        </button>
                    )}
                    <button type="button" onClick={actions.handleScanMainImage} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 rounded-md transition disabled:bg-indigo-400 dark:disabled:bg-gray-600 text-sm" disabled={uiState.isLoading || uiState.analysisProgress.active}>
                        <CameraIcon className="w-5 h-5" />
                        <span>{itemType !== 'dish' ? t('form.button.scanNew') : t('form.button.takePhoto')}</span>
                    </button>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-semibold py-2 px-3 rounded-md transition disabled:bg-gray-400 dark:disabled:bg-gray-500 text-sm" disabled={uiState.isLoading || uiState.analysisProgress.active}>
                        <PlusCircleIcon className="w-5 h-5" />
                        <span>{t('form.button.upload')}</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={actions.handleFileChange} accept="image/*" className="hidden" />
                    <button type="button" onClick={() => uiSetters.setIsSpeechModalOpen(true)} className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-3 rounded-md transition disabled:bg-teal-400 dark:disabled:bg-gray-600 text-sm" disabled={uiState.isLoading || uiState.analysisProgress.active}>
                        <MicrophoneIcon className="w-5 h-5" />
                        <span>{t('form.button.dictate')}</span>
                    </button>
                </div>
                
                {/* Status indicators and Image Preview */}
                <div className="min-h-[1rem]">
                    {uiState.analysisProgress.active && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-md flex items-center justify-center gap-2 text-indigo-700 dark:text-indigo-300">
                            <SparklesIcon className="w-5 h-5 animate-pulse" />
                            <p className="text-sm font-medium text-center">{uiState.analysisProgress.message}</p>
                        </div>
                    )}
                    {uiState.isLoading && !uiState.analysisProgress.active && (
                         <div className="bg-gray-100 dark:bg-gray-700/50 p-2 rounded-md flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300">
                            <SpinnerIcon className="w-5 h-5" />
                            <p className="text-sm font-medium">Loading...</p>
                         </div>
                    )}
                    {formState.image && !uiState.analysisProgress.active && !uiState.isLoading && (
                        <div className="relative w-28 h-28 rounded-lg overflow-hidden group shadow-md">
                            <img src={formState.image} alt="Preview" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={actions.removeImage}
                                className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition opacity-0 group-hover:opacity-100"
                                aria-label={t('form.image.removeAria')}
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* MAIN FORM FIELDS */}
            <div className="space-y-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder={itemType === 'dish' ? t('form.placeholder.dishName') : t('form.placeholder.name')}
                        value={formState.name}
                        onChange={e => formSetters.setName(e.target.value)}
                        required
                        className={`w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3 transition-shadow ${uiState.highlightedFields.includes('name') ? 'highlight-ai' : ''} ${uiState.isNameSearchLoading ? 'pr-10' : ''}`}
                    />
                    {uiState.isNameSearchLoading && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <SpinnerIcon className="w-5 h-5 text-gray-400" />
                        </div>
                    )}
                </div>

                {itemType === 'dish' && (
                  <>
                    <div>
                      <div className="relative">
                        <input
                            type="text"
                            placeholder={t('form.placeholder.restaurant')}
                            value={formState.restaurantName}
                            onChange={e => {
                                formSetters.setRestaurantName(e.target.value);
                            }}
                            className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3 pr-12"
                        />
                         {uiState.isAiAvailable && (
                            <button
                                type="button"
                                onClick={actions.handleFindNearby}
                                disabled={uiState.isFindingRestaurants}
                                className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors disabled:opacity-50"
                                aria-label={t('form.button.findNearby.aria')}
                            >
                                {uiState.isFindingRestaurants ? (
                                <SpinnerIcon className="w-5 h-5" />
                                ) : (
                                <MapPinIcon className="w-5 h-5" />
                                )}
                            </button>
                         )}
                      </div>
                      {uiState.isFindingRestaurants && !uiState.locationError && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('form.findRestaurants.loading')}</p>}
                      {uiState.locationError && <p className="text-xs text-red-500 mt-1">{uiState.locationError}</p>}
                      {uiState.nearbyRestaurants.length > 0 && (
                        <div className="mt-2">
                            <label htmlFor="restaurant-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('form.label.selectRestaurant')}</label>
                            <select
                            id="restaurant-select"
                            onChange={(e) => {
                                if (e.target.value) {
                                  actions.handleSelectRestaurant(parseInt(e.target.value, 10));
                                }
                            }}
                            className="w-full mt-1 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3"
                            >
                            <option value="">{t('form.placeholder.selectRestaurant')}</option>
                            {uiState.nearbyRestaurants.map((r, i) => (
                                <option key={`${r.name}-${i}`} value={i}>
                                {r.name} {r.cuisine ? `(${r.cuisine})` : ''}
                                </option>
                            ))}
                            </select>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                       <input
                            type="text"
                            placeholder={t('form.placeholder.cuisine')}
                            value={formState.cuisineType}
                            onChange={e => formSetters.setCuisineType(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3"
                        />
                         <input
                            type="number"
                            placeholder={t('form.placeholder.price')}
                            value={formState.price}
                            onChange={e => formSetters.setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                            step="0.01"
                            className="w-full sm:w-1/3 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3"
                        />
                    </div>
                  </>
                )}

                <div className="flex items-center gap-4">
                    <label className="text-gray-700 dark:text-gray-300 font-medium">{t('form.label.rating')}</label>
                    <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                type="button"
                                key={star}
                                onClick={() => formSetters.setRating(star)}
                                className="text-gray-400 dark:text-gray-600 hover:text-yellow-400 transition"
                                aria-label={t(star > 1 ? 'form.aria.ratePlural' : 'form.aria.rate', { star })}
                            >
                                <StarIcon className={`w-8 h-8 ${formState.rating >= star ? 'text-yellow-400' : ''}`} filled={formState.rating >= star} />
                            </button>
                        ))}
                    </div>
                </div>
                <textarea
                    placeholder={t('form.placeholder.notes')}
                    value={formState.notes}
                    onChange={e => formSetters.setNotes(e.target.value)}
                    rows={itemType !== 'dish' ? 3 : 5}
                    className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3"
                />
                
                {itemType !== 'dish' && (
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
                )}

                <input
                    type="text"
                    placeholder={t('form.placeholder.tags')}
                    value={formState.tags}
                    onChange={e => formSetters.setTags(e.target.value)}
                    className={`w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3 transition-shadow ${uiState.highlightedFields.includes('tags') ? 'highlight-ai' : ''}`}
                />
                
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

                {itemType === 'product' && (
                    <div className={`p-2 rounded-md transition-shadow ${uiState.highlightedFields.includes('nutriScore') ? 'highlight-ai' : ''}`}>
                        <div className="flex items-center gap-4">
                            <label className="text-gray-700 dark:text-gray-300 font-medium shrink-0">{t('form.label.nutriScore')}</label>
                            <div className="flex items-center gap-2 flex-wrap">
                                {nutriScoreOptions.map(score => (
                                    <button
                                        type="button"
                                        key={score}
                                        onClick={() => formSetters.setNutriScore(current => current === score ? '' : score)}
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

                {/* Ingredients and Dietary Section (Shared for Product and Drugstore) */}
                {itemType !== 'dish' && (
                    <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700/50">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('form.ingredients.title')}</h3>
                            {uiState.isAiAvailable && formState.image && (
                                <button
                                    type="button"
                                    onClick={actions.handleScanIngredients}
                                    disabled={uiState.isIngredientsLoading}
                                    className="flex items-center gap-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-1.5 px-3 rounded-md transition disabled:opacity-50"
                                >
                                    <DocumentTextIcon className="w-4 h-4" />
                                    <span>{t('form.button.scanIngredients')}</span>
                                </button>
                            )}
                        </div>
                        {uiState.isIngredientsLoading ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <SparklesIcon className="w-4 h-4 animate-pulse" />
                                <span>{t('form.ingredients.loading')}</span>
                            </div>
                        ) : (
                            <div>
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                        {t(itemType === 'drugstore' ? 'form.attributes.title' : 'form.dietary.title')}:
                                    </h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button type="button" onClick={() => actions.handleDietaryChange('isLactoseFree')} aria-pressed={formState.dietary.isLactoseFree} className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border-2 transition-colors ${formState.dietary.isLactoseFree ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700/50 border-transparent text-blue-600 dark:text-blue-400 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                            <LactoseFreeIcon className="w-7 h-7" />
                                            <span className="text-xs font-semibold">{t('form.dietary.lactoseFree')}</span>
                                        </button>
                                        <button type="button" onClick={() => actions.handleDietaryChange('isVegan')} aria-pressed={formState.dietary.isVegan} className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border-2 transition-colors ${formState.dietary.isVegan ? 'bg-green-100 dark:bg-green-900/50 border-green-500 dark:border-green-400 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700/50 border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                            <VeganIcon className="w-7 h-7" />
                                            <span className="text-xs font-semibold">{t('form.dietary.vegan')}</span>
                                        </button>
                                        <button type="button" onClick={() => actions.handleDietaryChange('isGlutenFree')} aria-pressed={formState.dietary.isGlutenFree} className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border-2 transition-colors ${formState.dietary.isGlutenFree ? 'bg-amber-100 dark:bg-amber-900/50 border-amber-500 dark:border-amber-400 text-amber-700 dark:text-amber-300' : 'bg-gray-100 dark:bg-gray-700/50 border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                            <GlutenFreeIcon className="w-7 h-7" />
                                            <span className="text-xs font-semibold">{t('form.dietary.glutenFree')}</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Ingredients Text Input */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('form.ingredients.ingredientsList')}</label>
                                    <textarea
                                        value={formState.ingredients?.join(', ')}
                                        onChange={(e) => formSetters.setIngredients(e.target.value.split(',').map(i => i.trim()).filter(Boolean))}
                                        placeholder={t('form.ingredients.placeholder')}
                                        rows={3}
                                        className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3 text-sm"
                                    />
                                </div>

                                {/* Allergens Text Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('form.allergens.title')}</label>
                                    <input
                                        type="text"
                                        value={formState.allergens?.join(', ')}
                                        onChange={(e) => formSetters.setAllergens(e.target.value.split(',').map(i => i.trim()).filter(Boolean))}
                                        placeholder="e.g. Peanuts, Soy"
                                        className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3 text-sm"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Family Favorite Toggle */}
                {householdId && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-md border border-gray-200 dark:border-gray-700">
                        <input
                            type="checkbox"
                            id="familyFavorite"
                            checked={formState.isFamilyFavorite}
                            onChange={(e) => formSetters.setIsFamilyFavorite(e.target.checked)}
                            className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <div>
                            <label htmlFor="familyFavorite" className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('form.familyFavorite.title')}</label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('form.familyFavorite.description')}</p>
                        </div>
                    </div>
                )}
                
                {uiState.error && (
                    <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
                        {uiState.error}
                    </div>
                )}
            </div>
        </div>

        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-md font-semibold transition-colors"
            >
                {t('form.button.cancel')}
            </button>
            <button
                type="submit"
                className="px-8 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold transition-colors shadow-md"
            >
                {isEditing ? t('form.button.update') : t('form.button.save')}
            </button>
        </div>

        {/* Modals */}
        {uiState.isCameraOpen && (
            <CameraCapture 
                onCapture={actions.handleImageFromCamera} 
                onClose={() => uiSetters.setIsCameraOpen(false)} 
                mode={uiState.scanMode}
            />
        )}
        {uiState.isBarcodeScannerOpen && (
            <BarcodeScanner 
                onScan={actions.handleBarcodeScanned} 
                onClose={() => uiSetters.setIsBarcodeScannerOpen(false)} 
            />
        )}
        {uiState.isSpeechModalOpen && (
            <SpeechInputModal 
                onDictate={actions.handleDictationResult} 
                onClose={() => uiSetters.setIsSpeechModalOpen(false)} 
            />
        )}
        {uiState.isCropperOpen && uiState.uncroppedImage && (
            <ImageCropper
                imageUrl={uiState.uncroppedImage}
                suggestedCrop={uiState.suggestedCrop}
                onCrop={actions.handleCropComplete}
                onCancel={actions.handleCropCancel}
            />
        )}
      </form>
    </>
  );
};
