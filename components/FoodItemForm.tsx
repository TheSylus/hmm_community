
import React, { useEffect, useRef } from 'react';
import { FoodItem, FoodItemType } from '../types';
import { useTranslation } from '../i18n/index';
import { useFoodFormLogic } from '../hooks/useFoodFormLogic';
import { CameraCapture } from './CameraCapture';
import { BarcodeScanner } from './BarcodeScanner';
import { SpeechInputModal } from './SpeechInputModal';
import { ImageCropper } from './ImageCropper';
import { ChevronDownIcon, XMarkIcon } from './Icons';

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

  useEffect(() => {
      if (!isEditing && startMode === 'none' && !uiState.isLoading && nameInputRef.current) {
          setTimeout(() => nameInputRef.current?.focus(), 100);
      }
  }, [isEditing, startMode, uiState.isLoading]);

  const handleSwitchToManual = () => {
      uiSetters.setIsCameraOpen(false);
      setTimeout(() => {
          nameInputRef.current?.focus();
      }, 300);
  };

  const handleSwitchToBarcode = () => {
      uiSetters.setIsCameraOpen(false);
      uiSetters.setIsBarcodeScannerOpen(true);
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
        details > summary { list-style: none; }
        details > summary::-webkit-details-marker { display: none; }
        details[open] summary ~ * { animation: sweep .3s ease-in-out; }
        @keyframes sweep { 0% { opacity: 0; transform: translateY(-10px); } 100% { opacity: 1; transform: translateY(0); } }
      `}</style>
      
      {/* 
        UX Improvement: Sticky Footer Structure 
        The form has extra bottom padding (pb-32) to ensure content isn't hidden behind the fixed footer.
      */}
      <form onSubmit={actions.handleSubmit} className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl shadow-lg mb-8 relative pb-32">
         {/* Top Close Button */}
         <button type="button" onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
             <span className="sr-only">{t('form.button.cancel')}</span>
             <XMarkIcon className="w-6 h-6" />
         </button>

         <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">
            {isEditing ? t('form.editTitle') : t('form.addNewButton')}
        </h2>

        <div className="space-y-8">
            {/* 1. Image Capture & Preview */}
            <ImageCaptureSection 
                formState={formState} 
                uiState={uiState} 
                uiSetters={uiSetters} 
                actions={actions} 
                fileInputRef={fileInputRef} 
                itemType={formState.itemType} 
            />

            {/* 2. Main Info */}
            <MainInfoSection 
                formState={formState}
                formSetters={formSetters}
                uiState={uiState}
                itemType={formState.itemType}
                nameInputRef={nameInputRef}
            />

            {/* 3. Category & Type Context */}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
                <ProductMetadataSection 
                    formState={formState}
                    formSetters={formSetters}
                    uiState={uiState}
                    itemType={formState.itemType}
                />

                {formState.itemType === 'dish' && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <DishDetailsSection 
                            formState={formState}
                            formSetters={formSetters}
                            uiState={uiState}
                            actions={actions}
                        />
                    </div>
                )}
            </div>

            {/* 4. Collapsible Ingredients/Dietary */}
            {formState.itemType !== 'dish' && (
                <details className="group bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all" open={uiState.autoExpandDetails}>
                    <summary className="flex items-center justify-between p-4 cursor-pointer select-none bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm flex items-center gap-2">
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
            )}

            {/* 5. Household Sharing */}
            {householdId && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/30">
                    <input
                        type="checkbox"
                        id="familyFavorite"
                        checked={formState.isFamilyFavorite}
                        onChange={(e) => formSetters.setIsFamilyFavorite(e.target.checked)}
                        className="h-5 w-5 text-amber-600 focus:ring-amber-500 border-gray-300 rounded cursor-pointer"
                    />
                    <div className="cursor-pointer" onClick={() => formSetters.setIsFamilyFavorite(!formState.isFamilyFavorite)}>
                        <label htmlFor="familyFavorite" className="text-sm font-bold text-gray-800 dark:text-gray-200 cursor-pointer">{t('form.familyFavorite.title')}</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('form.familyFavorite.description')}</p>
                    </div>
                </div>
            )}
            
            {uiState.error && (
                <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800 animate-pulse">
                    {uiState.error}
                </div>
            )}
        </div>

        {/* Sticky Action Footer */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 border-t border-gray-200 dark:border-gray-800 backdrop-blur-md z-40 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <div className="container mx-auto max-w-4xl flex gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-bold transition-colors"
                >
                    {t('form.button.cancel')}
                </button>
                <button
                    type="submit"
                    className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all active:scale-95"
                >
                    {isEditing ? t('form.button.update') : t('form.button.save')}
                </button>
            </div>
        </div>

        {/* Global Modals */}
        {uiState.isCameraOpen && (
            <CameraCapture 
                onCapture={actions.handleImageFromCamera} 
                onClose={() => uiSetters.setIsCameraOpen(false)} 
                mode={uiState.scanMode}
                onSwitchToManual={handleSwitchToManual}
                onSwitchToBarcode={handleSwitchToBarcode}
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
