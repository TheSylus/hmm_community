
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTranslation } from '../i18n/index';
import { XMarkIcon, PencilIcon, BarcodeIcon } from './Icons';
import { useAppSettings } from '../contexts/AppSettingsContext';

interface ExtendedMediaTrackConstraints extends MediaTrackConstraints {
  focusMode?: ConstrainDOMString;
}

interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
  focusMode?: string[];
}

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
  const [showShutter, setShowShutter] = useState(false);

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
        } as ExtendedMediaTrackConstraints,
        audio: false,
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Fokus-Optimierung nach dem Start
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as ExtendedMediaTrackCapabilities;
      
      // Falls das Gerät erweiterten Autofokus unterstützt, aktivieren wir ihn
      if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
        try {
          await track.applyConstraints({
            advanced: [{ focusMode: 'continuous' }]
          } as ExtendedMediaTrackConstraints);
        } catch (e) {
          console.warn("Konnte kontinuierlichen Autofokus nicht erzwingen", e);
        }
      }

      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          // Check if we have valid dimensions, if not wait for onloadeddata
          if (videoRef.current && videoRef.current.videoWidth > 0) {
            setIsCameraReady(true);
          }
        };
        videoRef.current.onloadeddata = () => {
          setIsCameraReady(true);
        };
      }
    } catch (err) {
      console.error("Fehler beim Zugriff auf die Kamera:", err);
      setError(t('camera.error'));
    }
  }, [t]);

  useEffect(() => {
    const timer = setTimeout(() => {
        setupCamera();
    }, 0);
    return () => {
      clearTimeout(timer);
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
    const capabilities = track.getCapabilities() as ExtendedMediaTrackCapabilities;

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
            } as ExtendedMediaTrackConstraints);
            // Kurz darauf zurück auf kontinuierlich für beste User Experience
            setTimeout(async () => {
                await track.applyConstraints({
                    advanced: [{ focusMode: 'continuous' }]
                } as ExtendedMediaTrackConstraints);
            }, 500);
        } catch (e) {
            console.warn("Fokus-Constraint fehlgeschlagen", e);
        }
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && isCameraReady) {
      // Visual feedback
      setShowShutter(true);
      setTimeout(() => setShowShutter(false), 150);
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Wir nutzen die native Auflösung des Videos für den Crop
        const videoW = video.videoWidth;
        const videoH = video.videoHeight;
        
        if (videoW === 0 || videoH === 0) {
            console.warn("Video dimensions are 0, cannot capture.");
            return;
        }

        // Capture the full video frame as requested by the user ("Vollbild")
        canvas.width = videoW;
        canvas.height = videoH;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(video, 0, 0, videoW, videoH);
        
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95); 
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
             <div className={`relative border border-white/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] transition-all duration-500 ${getOverlayStyle()}`}>
                {/* Technical Corner Markings */}
                <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-indigo-500 rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-indigo-500 rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-indigo-500 rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-indigo-500 rounded-br-xl"></div>
                
                {/* Animated Scan Line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_15px_rgba(129,140,248,0.8)] animate-scan-line z-10"></div>

                {/* Technical Labels */}
                <div className="absolute -top-6 left-0 flex items-center gap-3 text-[10px] font-mono text-indigo-400 tracking-widest uppercase opacity-80">
                    <span>REC ●</span>
                    <span>{mode}</span>
                </div>
                <div className="absolute -bottom-6 right-0 text-[10px] font-mono text-indigo-400 tracking-widest uppercase opacity-80">
                    4K_ULTRA_HD // 60FPS
                </div>
                
                <div className="absolute -bottom-14 left-0 right-0 text-center">
                    <span className="text-white/70 text-[11px] font-mono uppercase tracking-widest bg-black/60 px-4 py-2 rounded-full backdrop-blur-xl border border-white/10">
                        [ TAP_TO_FOCUS ]
                    </span>
                </div>
             </div>
          </div>

          {/* Shutter Flash Effect */}
          {showShutter && (
            <div className="absolute inset-0 bg-white z-50 animate-shutter-flash"></div>
          )}

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
            0% { transform: scale(1.4); opacity: 1; border-width: 3px; }
            100% { transform: scale(1); opacity: 0; border-width: 1px; }
        }
        @keyframes scanLine {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
        @keyframes shutterFlash {
            0% { opacity: 0; }
            50% { opacity: 1; }
            100% { opacity: 0; }
        }
        .animate-focus-pulse {
            animation: focusPulse 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .animate-scan-line {
            animation: scanLine 3s linear infinite;
        }
        .animate-shutter-flash {
            animation: shutterFlash 0.15s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
