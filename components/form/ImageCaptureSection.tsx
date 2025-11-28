
import React from 'react';
import { useTranslation } from '../../i18n/index';
import { CameraIcon, PlusCircleIcon, BarcodeIcon, MicrophoneIcon, SparklesIcon, SpinnerIcon, XMarkIcon } from '../Icons';
import { useAppSettings } from '../../contexts/AppSettingsContext';

interface ImageCaptureSectionProps {
  formState: any;
  uiState: any;
  uiSetters: any;
  actions: any;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  itemType: string;
}

export const ImageCaptureSection: React.FC<ImageCaptureSectionProps> = ({
  formState,
  uiState,
  uiSetters,
  actions,
  fileInputRef,
  itemType
}) => {
  const { t } = useTranslation();
  const { isBarcodeScannerEnabled } = useAppSettings();

  return (
    <div className="space-y-4">
      <div className={`grid grid-cols-2 ${isBarcodeScannerEnabled && itemType !== 'dish' ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-2`}>
        {isBarcodeScannerEnabled && itemType !== 'dish' && (
          <button
            type="button"
            onClick={() => uiSetters.setIsBarcodeScannerOpen(true)}
            className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-3 rounded-md transition disabled:bg-sky-400 dark:disabled:bg-gray-600 text-sm"
            disabled={uiState.isLoading || uiState.analysisProgress.active}
          >
            <BarcodeIcon className="w-5 h-5" />
            <span>{t('form.button.scanBarcode')}</span>
          </button>
        )}
        <button
          type="button"
          onClick={actions.handleScanMainImage}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 rounded-md transition disabled:bg-indigo-400 dark:disabled:bg-gray-600 text-sm"
          disabled={uiState.isLoading || uiState.analysisProgress.active}
        >
          <CameraIcon className="w-5 h-5" />
          <span>{itemType !== 'dish' ? t('form.button.scanNew') : t('form.button.takePhoto')}</span>
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-semibold py-2 px-3 rounded-md transition disabled:bg-gray-400 dark:disabled:bg-gray-500 text-sm"
          disabled={uiState.isLoading || uiState.analysisProgress.active}
        >
          <PlusCircleIcon className="w-5 h-5" />
          <span>{t('form.button.upload')}</span>
        </button>
        <input type="file" ref={fileInputRef} onChange={actions.handleFileChange} accept="image/*" className="hidden" />
        <button
          type="button"
          onClick={() => uiSetters.setIsSpeechModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-3 rounded-md transition disabled:bg-teal-400 dark:disabled:bg-gray-600 text-sm"
          disabled={uiState.isLoading || uiState.analysisProgress.active}
        >
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
  );
};
