
import React, { useEffect, useRef } from 'react';
import { FoodItem, FoodItemType } from '../types';
import { useTranslation } from '../i18n/index';
import { useFoodFormLogic } from '../hooks/useFoodFormLogic';
import { CameraCapture } from './CameraCapture';
import { BarcodeScanner } from './BarcodeScanner';
import { SpeechInputModal } from './SpeechInputModal';
import { ImageCropper } from './ImageCropper';
import { ShoppingBagIcon, BuildingStorefrontIcon, BeakerIcon, ChevronDownIcon } from './Icons';

// Sub-components
import { ImageCaptureSection } from './form/ImageCaptureSection';
import { MainInfoSection } from './form/MainInfoSection';
import { ProductMetadataSection } from './form/ProductMetadataSection';
import { DietarySection } from './form/DietarySection';
import { DishDetailsSection } from './form/DishDetailsSection';

interface FoodItemFormProps {
  onSaveItem: (item: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) => void;
  onCancel: () => void;
  initialData?: FoodItem | null;
  initialItemType?: FoodItemType;
  householdId: string | null;
  startMode?: 'barcode' | 'camera' | 'none';
}

export const FoodItemForm: React.FC<FoodItemFormProps> = ({ onSaveItem, onCancel, initialData, initialItemType, householdId, startMode }) => {
  const { t } = useTranslation();
  
  const isEditing = !!initialData;
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  const {
    formState,
    formSetters,
    uiState,
    uiSetters,
    actions,
    fileInputRef
  } = useFoodFormLogic({ initialData, initialItemType, onSaveItem, onCancel, startMode });

  // Auto-focus name field ONLY if adding manually (no scanner started) and not analyzing
  useEffect(() => {
      if (!isEditing && startMode === 'none' && !uiState.isLoading && nameInputRef.current) {
          setTimeout(() => nameInputRef.current?.focus(), 100);
      }
  }, [isEditing, startMode, uiState.isLoading]);

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
        details > summary { list-style: none; }
        details > summary::-webkit-details-marker { display: none; }
        details[open] summary ~ * { animation: sweep .3s ease-in-out; }
        @keyframes sweep { 0% { opacity: 0; transform: translateY(-10px); } 100% { opacity: 1; transform: translateY(0); } }
      `}</style>
      <form onSubmit={actions.handleSubmit} className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg mb-8 relative">
         {/* Top Close Button */}
         <button type="button" onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
             <span className="sr-only">{t('form.button.cancel')}</span>
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
             </svg>
         </button>

         <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
            {isEditing ? t('form.editTitle') : t('form.addNewButton')}
        </h2>

        {/* Item Type Segmented Control - Only visible if manual control is needed, usually AI handles this but good for fallback */}
        <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg mb-6">
            {(['product', 'dish', 'drugstore'] as FoodItemType[]).map((type) => (
                <button
                    key={type}
                    type="button"
                    onClick={() => formSetters.setItemType(type)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                        formState.itemType === type
                            ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                >
                    {type === 'product' && <ShoppingBagIcon className="w-4 h-4" />}
                    {type === 'dish' && <BuildingStorefrontIcon className="w-4 h-4" />}
                    {type === 'drugstore' && <BeakerIcon className="w-4 h-4" />}
                    <span className="capitalize">{t(`modal.itemType.${type}`)}</span>
                </button>
            ))}
        </div>

        <div className="space-y-6">
            {/* 1. Image Capture & Preview */}
            <ImageCaptureSection 
                formState={formState} 
                uiState={uiState} 
                uiSetters={uiSetters} 
                actions={actions} 
                fileInputRef={fileInputRef} 
                itemType={formState.itemType} 
            />

            {/* 2. Main Info - Contains the UNIQUE Name Input */}
            <MainInfoSection 
                formState={formState}
                formSetters={formSetters}
                uiState={uiState}
                itemType={formState.itemType}
                nameInputRef={nameInputRef}
            />

            {/* 3. Type Specific Sections */}
            {formState.itemType === 'dish' ? (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <DishDetailsSection 
                        formState={formState}
                        formSetters={formSetters}
                        uiState={uiState}
                        actions={actions}
                    />
                </div>
            ) : (
                <>
                    {/* Collapsible Metadata */}
                    <details open={uiState.autoExpandDetails} className="group bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <summary className="flex items-center justify-between p-3 cursor-pointer select-none bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
                                {t('form.attributes.title')} / {t('form.category.title')}
                            </span>
                            <ChevronDownIcon className="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="p-4 space-y-4">
                            <ProductMetadataSection 
                                formState={formState}
                                formSetters={formSetters}
                                uiState={uiState}
                                itemType={formState.itemType}
                            />
                        </div>
                    </details>

                    {/* Collapsible Ingredients/Dietary */}
                    <details className="group bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <summary className="flex items-center justify-between p-3 cursor-pointer select-none bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
                                {t('form.ingredients.title')}
                            </span>
                            <ChevronDownIcon className="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="p-4">
                            <DietarySection 
                                formState={formState}
                                formSetters={formSetters}
                                uiState={uiState}
                                actions={actions}
                                itemType={formState.itemType}
                            />
                        </div>
                    </details>
                </>
            )}

            {/* 4. Household Sharing */}
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

        {/* Global Modals/Overlays */}
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
