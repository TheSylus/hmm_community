
import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from '../i18n/index';
import { XMarkIcon, PencilIcon, BarcodeIcon } from './Icons';
import { useAppSettings } from '../contexts/AppSettingsContext';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onClose: () => void;
  mode?: 'main' | 'ingredients'; // 'main' = square crop (product), 'ingredients' = rectangle (text)
  onSwitchToManual?: () => void;
  onSwitchToBarcode?: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose, mode = 'main', onSwitchToManual, onSwitchToBarcode }) => {
  const { t } = useTranslation();
  const { isBarcodeScannerEnabled } = useAppSettings();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const startCamera = async () => {
      if (streamRef.current) return;
      
      try {
        const constraints = {
          video: { facingMode: 'environment' },
          audio: false,
        };
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (isMounted) {
            streamRef.current = mediaStream;
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.onloadedmetadata = () => {
                  if(isMounted) setIsCameraReady(true);
                };
            }
        }
      } catch (err: any) {
        console.error("Error accessing rear camera, trying fallback:", err);

        if (err.name === 'NotAllowedError') {
            if (isMounted) setError(t('camera.error.permission'));
            return;
        }
        
        try {
          const fallbackConstraints = { video: true, audio: false };
          const mediaStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
          if (isMounted) {
            streamRef.current = mediaStream;
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.onloadedmetadata = () => {
                  if(isMounted) setIsCameraReady(true);
                };
            }
          }
        } catch (fallbackErr: any) {
          if (isMounted) {
            if (fallbackErr.name === 'NotAllowedError') {
                setError(t('camera.error.permission'));
            } else {
                setError(t('camera.error'));
            }
          }
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [t]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && isCameraReady) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Calculate crop dimensions based on the overlay aspect ratio
        const videoW = video.videoWidth;
        const videoH = video.videoHeight;
        const minDim = Math.min(videoW, videoH);
        
        let cropW, cropH, startX, startY;

        if (mode === 'main') {
            // Square crop for products (saves tokens, focuses on object)
            // We take 80% of the smallest dimension to match the UI overlay roughly
            const cropSize = minDim * 0.8; 
            cropW = cropSize;
            cropH = cropSize;
        } else {
            // Taller rectangle for ingredients/receipts
            // Width 80% of minDim, Height based on 3:4 ratio roughly
            cropW = minDim * 0.8;
            cropH = cropW * 1.33;
            
            // Ensure we don't go out of bounds vertically
            if (cropH > videoH * 0.9) {
                cropH = videoH * 0.9;
                cropW = cropH / 1.33;
            }
        }

        // Center the crop area
        startX = (videoW - cropW) / 2;
        startY = (videoH - cropH) / 2;

        // Set canvas size to the crop size
        canvas.width = cropW;
        canvas.height = cropH;

        // Handle mirroring if user facing camera
        const isUserFacing = streamRef.current?.getVideoTracks()[0]?.getSettings().facingMode === 'user';
        
        if (isUserFacing) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }

        // Draw only the cropped area
        ctx.drawImage(
            video, 
            startX, startY, cropW, cropH, // Source coords
            0, 0, canvas.width, canvas.height // Dest coords
        );
        
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(imageDataUrl);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex flex-col items-center justify-center z-50">
      <div className="absolute top-0 left-0 w-full p-4 z-20 flex justify-between items-center">
         <h3 className="text-lg font-bold text-white drop-shadow-md">{t('camera.title')}</h3>
         <button onClick={onClose} className="text-white hover:text-gray-300 p-2">
            <XMarkIcon className="w-8 h-8" />
         </button>
      </div>

      {error ? (
        <div className="text-red-400 p-8 text-center max-w-xs">{error}</div>
      ) : (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          {/* Video Layer */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Dark Overlay with "Hole" via Clip Path or borders */}
          {/* Using a simpler border approach for cross-browser reliability visually */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
             <div 
                className={`relative border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] transition-all duration-300 ${
                    mode === 'main' 
                    ? 'aspect-square w-[80vw] max-w-[80vh] rounded-xl' 
                    : 'aspect-[3/4] w-[70vw] max-w-[60vh] rounded-lg'
                }`}
             >
                {/* Corner markers for aesthetics */}
                <div className="absolute top-[-2px] left-[-2px] w-6 h-6 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl"></div>
                <div className="absolute top-[-2px] right-[-2px] w-6 h-6 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl"></div>
                <div className="absolute bottom-[-2px] left-[-2px] w-6 h-6 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl"></div>
                <div className="absolute bottom-[-2px] right-[-2px] w-6 h-6 border-b-4 border-r-4 border-indigo-500 rounded-br-xl"></div>
                
                {/* Helper text inside the frame */}
                <div className="absolute bottom-4 left-0 right-0 text-center">
                    <span className="text-white/80 text-xs bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
                        {mode === 'main' ? 'Produkt hier platzieren' : 'Zutatenliste hier platzieren'}
                    </span>
                </div>
             </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
      
      {/* Footer Controls: Main Capture + Fallback Buttons */}
      <div className="absolute bottom-0 left-0 w-full p-8 z-20 flex justify-between items-center bg-gradient-to-t from-black/80 to-transparent">
        
        {/* Left: Manual Input Fallback */}
        <div className="flex-1 flex justify-start">
            {onSwitchToManual && (
                <button
                    onClick={onSwitchToManual}
                    className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors p-2"
                    aria-label={t('form.addNewButton')}
                >
                    <div className="p-2 bg-white/10 rounded-full backdrop-blur-md">
                        <PencilIcon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-medium hidden sm:block">Manuell</span>
                </button>
            )}
        </div>

        {/* Center: Capture Trigger */}
        <button
          onClick={handleCapture}
          disabled={!isCameraReady || !!error}
          className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 shadow-lg flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mx-4"
          aria-label={t('camera.captureButton')}
        >
            <div className="w-16 h-16 bg-white rounded-full border-2 border-black"></div>
        </button>

        {/* Right: Barcode Fallback */}
        <div className="flex-1 flex justify-end">
            {isBarcodeScannerEnabled && onSwitchToBarcode && (
                <button
                    onClick={onSwitchToBarcode}
                    className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors p-2"
                    aria-label={t('form.button.scanBarcode')}
                >
                    <div className="p-2 bg-white/10 rounded-full backdrop-blur-md">
                        <BarcodeIcon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-medium hidden sm:block">Barcode</span>
                </button>
            )}
        </div>
      </div>
    </div>
  );
};
