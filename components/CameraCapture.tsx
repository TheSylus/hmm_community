
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTranslation } from '../i18n/index';
import { XMarkIcon, PencilIcon, BarcodeIcon } from './Icons';
import { useAppSettings } from '../contexts/AppSettingsContext';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onClose: () => void;
  mode?: 'main' | 'ingredients' | 'receipt';
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
  const [focusPoint, setFocusPoint] = useState<{ x: number, y: number } | null>(null);

  const setupCamera = useCallback(async () => {
    if (streamRef.current) return;
    
    try {
      // Höhere Auflösung anfordern für maximale Schärfe
      const constraints = {
        video: { 
          facingMode: 'environment',
          width: { ideal: 4096 }, // 4K ideal
          height: { ideal: 2160 },
          focusMode: 'continuous' // Nur manche Browser/Systeme unterstützen das direkt in den Initial Constraints
        } as any,
        audio: false,
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Fokus-Optimierung nach dem Start
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      
      // Falls das Gerät erweiterten Autofokus unterstützt, aktivieren wir ihn
      if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
        try {
          await track.applyConstraints({
            advanced: [{ focusMode: 'continuous' }]
          } as any);
        } catch (e) {
          console.warn("Konnte kontinuierlichen Autofokus nicht erzwingen", e);
        }
      }

      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
        };
      }
    } catch (err: any) {
      console.error("Fehler beim Zugriff auf die Kamera:", err);
      setError(t('camera.error'));
    }
  }, [t]);

  useEffect(() => {
    setupCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [setupCamera]);

  // Funktion um den Fokus manuell zu triggern (Tap-to-Focus Simulation)
  const handleTapToFocus = async (e: React.MouseEvent | React.TouchEvent) => {
    if (!streamRef.current) return;
    
    const track = streamRef.current.getVideoTracks()[0];
    const capabilities = track.getCapabilities() as any;

    // Koordinaten für die visuelle Anzeige berechnen
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    setFocusPoint({ x: clientX - rect.left, y: clientY - rect.top });
    setTimeout(() => setFocusPoint(null), 1000);

    // Wenn das Gerät manuellen Fokus unterstützt
    if (capabilities.focusMode && capabilities.focusMode.includes('manual')) {
        try {
            await track.applyConstraints({
                advanced: [{ focusMode: 'manual' }] // Kurz umschalten triggert oft eine Neuausrichtung
            } as any);
            // Kurz darauf zurück auf kontinuierlich für beste User Experience
            setTimeout(async () => {
                await track.applyConstraints({
                    advanced: [{ focusMode: 'continuous' }]
                } as any);
            }, 500);
        } catch (e) {
            console.warn("Fokus-Constraint fehlgeschlagen", e);
        }
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && isCameraReady) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Wir nutzen die native Auflösung des Videos für den Crop
        const videoW = video.videoWidth;
        const videoH = video.videoHeight;
        const minDim = Math.min(videoW, videoH);
        
        let cropW, cropH, startX, startY;

        if (mode === 'main') {
            const cropSize = minDim * 0.85; 
            cropW = cropSize;
            cropH = cropSize;
        } else if (mode === 'ingredients') {
            cropW = minDim * 0.8;
            cropH = cropW * 1.33;
        } else {
            cropH = videoH * 0.9; 
            cropW = cropH * 0.5;
        }

        startX = (videoW - cropW) / 2;
        startY = (videoH - cropH) / 2;

        canvas.width = cropW;
        canvas.height = cropH;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(video, startX, startY, cropW, cropH, 0, 0, canvas.width, canvas.height);
        
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95); // Hohe Qualität beim Speichern
        onCapture(imageDataUrl);
      }
    }
  };

  const getOverlayStyle = () => {
      switch(mode) {
          case 'main': return 'aspect-square w-[85vw] max-w-[80vh] rounded-2xl';
          case 'ingredients': return 'aspect-[3/4] w-[75vw] max-w-[60vh] rounded-lg';
          case 'receipt': return 'aspect-[1/2] h-[80vh] max-w-[90vw] rounded-lg border-dashed';
          default: return 'aspect-square w-[80vw]';
      }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex flex-col items-center justify-center z-50 overflow-hidden">
      <div className="absolute top-0 left-0 w-full p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
         <h3 className="text-lg font-bold text-white drop-shadow-md">{t('camera.title')}</h3>
         <button onClick={onClose} className="text-white hover:text-gray-300 p-2 rounded-full hover:bg-white/10 transition-colors">
            <XMarkIcon className="w-8 h-8" />
         </button>
      </div>

      {error ? (
        <div className="text-red-400 p-8 text-center max-w-xs bg-red-900/20 rounded-xl border border-red-900/50">{error}</div>
      ) : (
        <div 
          className="relative w-full h-full flex items-center justify-center cursor-crosshair"
          onClick={handleTapToFocus}
          onTouchStart={handleTapToFocus}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Fokus-Indikator Animation */}
          {focusPoint && (
            <div 
                className="absolute border-2 border-yellow-400 rounded-lg w-16 h-16 pointer-events-none z-30 animate-focus-pulse"
                style={{ left: focusPoint.x - 32, top: focusPoint.y - 32 }}
            ></div>
          )}

          {/* Dark Overlay with Scan Window */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
             <div className={`relative border-2 border-white/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] transition-all duration-300 ${getOverlayStyle()}`}>
                <div className="absolute top-[-2px] left-[-2px] w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-2xl"></div>
                <div className="absolute top-[-2px] right-[-2px] w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-2xl"></div>
                <div className="absolute bottom-[-2px] left-[-2px] w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-2xl"></div>
                <div className="absolute bottom-[-2px] right-[-2px] w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-2xl"></div>
                
                <div className="absolute -bottom-10 left-0 right-0 text-center">
                    <span className="text-white/90 text-sm font-medium bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-md">
                        Tippen zum Fokussieren
                    </span>
                </div>
             </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
      
      <div className="absolute bottom-0 left-0 w-full p-8 z-20 flex justify-between items-center bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <div className="flex-1 flex justify-start">
            {onSwitchToManual && (
                <button onClick={onSwitchToManual} className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors p-2">
                    <div className="p-3 bg-white/10 rounded-full backdrop-blur-md border border-white/10">
                        <PencilIcon className="w-6 h-6" />
                    </div>
                </button>
            )}
        </div>

        <button
          onClick={handleCapture}
          disabled={!isCameraReady || !!error}
          className="w-20 h-20 bg-white rounded-full border-4 border-gray-400 shadow-2xl flex items-center justify-center hover:bg-gray-100 active:scale-90 transition-all disabled:opacity-50 mx-4"
        >
            <div className="w-16 h-16 bg-white rounded-full border-2 border-black/80"></div>
        </button>

        <div className="flex-1 flex justify-end">
            {isBarcodeScannerEnabled && onSwitchToBarcode && (
                <button onClick={onSwitchToBarcode} className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors p-2">
                    <div className="p-3 bg-white/10 rounded-full backdrop-blur-md border border-white/10">
                        <BarcodeIcon className="w-6 h-6" />
                    </div>
                </button>
            )}
        </div>
      </div>
      <style>{`
        @keyframes focusPulse {
            0% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(1); opacity: 0; }
        }
        .animate-focus-pulse {
            animation: focusPulse 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
