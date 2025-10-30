import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException, ChecksumException, FormatException } from '@zxing/library';
import { useTranslation } from '../i18n/index';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    if (videoRef.current) {
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      const startScan = async () => {
        try {
          // Use decodeFromConstraints which is the modern approach for continuous scanning
          await reader.decodeFromConstraints(
            { video: { facingMode: 'environment' } },
            videoRef.current,
            (result, err) => {
              if (!isMounted) return; // Don't do anything if component is unmounted

              if (result) {
                onScan(result.getText());
              }
              
              if (err) {
                // NotFoundException, ChecksumException, and FormatException are common for blurry/partial codes.
                // We can safely ignore these to allow for continuous scanning without logging errors.
                if (
                  !(err instanceof NotFoundException) &&
                  !(err instanceof ChecksumException) &&
                  !(err instanceof FormatException)
                ) {
                  console.error('Barcode scan error:', err);
                  if (err.name === 'NotAllowedError') {
                    setError(t('barcodeScanner.error.permission'));
                  } else {
                    setError(t('camera.error'));
                  }
                }
              }
            }
          );
        } catch (err) {
          if (!isMounted) return;
          console.error('Failed to start scanner:', err);
          if (err instanceof Error) {
              if (err.name === 'NotAllowedError') {
                  setError(t('barcodeScanner.error.permission'));
              } else {
                  setError(t('camera.error'));
              }
          }
        }
      };

      startScan();
    }

    // Cleanup function to stop the camera stream when the component unmounts
    return () => {
      isMounted = false;
      if (readerRef.current) {
        readerRef.current.reset();
        readerRef.current = null;
      }
    };
  }, [onScan, t]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl relative w-full max-w-lg mx-4">
        <button onClick={onClose} className="absolute top-2 right-3 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white text-3xl font-bold z-10 leading-none">&times;</button>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">{t('barcodeScanner.title')}</h3>
        <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-4">{t('barcodeScanner.description')}</p>
        <div className="bg-black rounded-md overflow-hidden relative w-full aspect-video flex items-center justify-center">
          {error ? (
            <div className="text-red-500 p-4 text-center">{error}</div>
          ) : (
            <>
              <video ref={videoRef} className="w-full h-full object-cover" />
              <div 
                className="absolute inset-0"
                style={{
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                  clipPath: 'polygon(0% 0%, 0% 100%, 10% 100%, 10% 35%, 90% 35%, 90% 65%, 10% 65%, 10% 100%, 100% 100%, 100% 0%)'
                }}
              ></div>
              <div className="absolute w-[80%] h-0.5 bg-red-500/70 animate-scan"></div>
            </>
          )}
        </div>
        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-md font-semibold hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            {t('form.button.cancel')}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes scan-animation {
          0% { transform: translateY(-50px); opacity: 0.6; }
          50% { transform: translateY(50px); opacity: 1; }
          100% { transform: translateY(-50px); opacity: 0.6; }
        }
        .animate-scan {
            animation: scan-animation 2.5s infinite cubic-bezier(0.5, 0, 0.5, 1);
        }
      `}</style>
    </div>
  );
};
