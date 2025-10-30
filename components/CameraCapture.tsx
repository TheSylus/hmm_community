import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from '../i18n/index';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Use useRef for the stream to prevent re-renders from affecting it. This is the key to fixing the flicker.
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    // This flag prevents state updates if the component has already unmounted
    let isMounted = true;

    const startCamera = async () => {
      // Don't start a new stream if one is already active
      if (streamRef.current) {
        return;
      }
      
      try {
        const constraints = {
          video: { facingMode: 'environment' }, // Prefer rear camera
          audio: false,
        };
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (isMounted) {
            streamRef.current = mediaStream;
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                // Wait for the video to be ready before enabling the capture button
                videoRef.current.onloadedmetadata = () => {
                  if(isMounted) setIsCameraReady(true);
                };
            }
        }
      } catch (err: any) {
        console.error("Error accessing rear camera, trying fallback:", err);

        if (err.name === 'NotAllowedError') {
            if (isMounted) setError(t('camera.error.permission'));
            return; // Don't try fallback if permission is denied
        }
        
        // Fallback to any camera if environment (rear) camera fails for other reasons
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
          console.error("Error accessing any camera:", fallbackErr);
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

    // Cleanup function: this will be called when the component is unmounted.
    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [t]); // Add t to dependency array

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && isCameraReady) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        // Flip the image horizontally if it's a front-facing camera (user camera)
        // This makes "selfies" look natural instead of mirrored.
        if (streamRef.current?.getVideoTracks()[0]?.getSettings().facingMode === 'user') {
            context.translate(video.videoWidth, 0);
            context.scale(-1, 1);
        }
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        onCapture(imageDataUrl);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl relative w-full max-w-lg mx-4">
        <button onClick={onClose} className="absolute top-2 right-3 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white text-3xl font-bold z-10 leading-none">&times;</button>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">{t('camera.title')}</h3>
        {error ? (
          <div className="text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-4 rounded-md text-center">{error}</div>
        ) : (
          <div className="relative bg-gray-200 dark:bg-gray-900 rounded-md overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted // Muted is important for autoplay policies in many browsers
              className="w-full h-auto"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleCapture}
            disabled={!isCameraReady || !!error}
            className="px-8 py-4 bg-indigo-600 text-white text-lg rounded-full font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 transition-opacity"
            aria-label={t('camera.captureButton')}
          >
            {t('camera.captureButton')}
          </button>
        </div>
      </div>
    </div>
  );
};