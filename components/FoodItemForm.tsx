
import React from 'react';
import { FoodItem, FoodItemType } from '../types';
import { useTranslation } from '../i18n/index';
import { useFoodFormLogic } from '../hooks/useFoodFormLogic';
import { CameraCapture } from './CameraCapture';
import { BarcodeScanner } from './BarcodeScanner';
import { SpeechInputModal } from './SpeechInputModal';
import { ImageCropper } from './ImageCropper';

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
  itemType: FoodItemType;
  householdId: string | null;
}

export const FoodItemForm: React.FC<FoodItemFormProps> = ({ onSaveItem, onCancel, initialData, itemType, householdId }) => {
  const { t } = useTranslation();
  
  const isEditing = !!initialData;
  
  const {
    formState,
    formSetters,
    uiState,
    uiSetters,
    actions,
    fileInputRef
  } = useFoodFormLogic({ initialData, itemType, onSaveItem, onCancel });

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
            {/* 1. Image Capture & Preview */}
            <ImageCaptureSection 
                formState={formState} 
                uiState={uiState} 
                uiSetters={uiSetters} 
                actions={actions} 
                fileInputRef={fileInputRef} 
                itemType={itemType} 
            />

            {/* 2. Main Info (Name, Rating, Notes, Tags) - Common to all */}
            <MainInfoSection 
                formState={formState}
                formSetters={formSetters}
                uiState={uiState}
                itemType={itemType}
            />

            {/* 3. Type Specific Sections */}
            {itemType === 'dish' ? (
                <DishDetailsSection 
                    formState={formState}
                    formSetters={formSetters}
                    uiState={uiState}
                    actions={actions}
                />
            ) : (
                <>
                    <ProductMetadataSection 
                        formState={formState}
                        formSetters={formSetters}
                        uiState={uiState}
                        itemType={itemType}
                    />
                    <DietarySection 
                        formState={formState}
                        formSetters={formSetters}
                        uiState={uiState}
                        actions={actions}
                        itemType={itemType}
                    />
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
