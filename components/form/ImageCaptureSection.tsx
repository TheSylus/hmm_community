
import React from 'react';
import { useTranslation } from '../../i18n/index';
import { CameraIcon, PlusCircleIcon, BarcodeIcon, MicrophoneIcon, SparklesIcon, SpinnerIcon, XMarkIcon } from '../Icons';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { useFoodFormLogic } from '../../hooks/useFoodFormLogic';

type FormLogic = ReturnType<typeof useFoodFormLogic>;

interface ImageCaptureSectionProps {
  formState: FormLogic['formState'];
  uiState: FormLogic['uiState'];
  uiSetters: FormLogic['uiSetters'];
  actions: FormLogic['actions'];
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
          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-xl flex flex-col items-center justify-center gap-3 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50 shadow-sm animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-400 dark:bg-indigo-500 rounded-full blur-md opacity-50 animate-pulse"></div>
              <SparklesIcon className="w-8 h-8 relative z-10 animate-bounce" />
            </div>
            <p className="text-sm font-bold text-center tracking-wide">{uiState.analysisProgress.message}</p>
            <div className="w-full max-w-[200px] h-1.5 bg-indigo-200 dark:bg-indigo-800 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full w-1/2 animate-[pulse_1.5s_ease-in-out_infinite] origin-left scale-x-150"></div>
            </div>
          </div>
        )}
        {uiState.isLoading && !uiState.analysisProgress.active && (
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl flex items-center justify-center gap-3 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm animate-fade-in">
            <SpinnerIcon className="w-6 h-6 animate-spin text-indigo-500" />
            <p className="text-sm font-bold">{t('common.loading') || 'Loading...'}</p>
          </div>
        )}
        {formState.image && !uiState.analysisProgress.active && !uiState.isLoading && (
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-xl overflow-hidden group shadow-lg animate-fade-in border-2 border-white dark:border-gray-700">
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
