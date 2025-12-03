
import React, { useState, useRef } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { BoundingBox } from '../services/geminiService';
import { useTranslation } from '../i18n/index';

interface ImageCropperProps {
  imageUrl: string;
  suggestedCrop?: BoundingBox | null;
  onCrop: (croppedImageUrl: string) => void;
  onCancel: () => void;
}

// Function to create a canvas preview of the crop
function getCroppedImg(
  image: HTMLImageElement,
  crop: Crop,
  canvas: HTMLCanvasElement
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No 2d context');
  }

  const pixelRatio = window.devicePixelRatio;
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = 'high';

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;

  ctx.drawImage(
    image,
    cropX,
    cropY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width * scaleX,
    crop.height * scaleY
  );
  
  return canvas.toDataURL('image/jpeg');
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageUrl, suggestedCrop, onCrop, onCancel }) => {
  const { t } = useTranslation();
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    let initialCrop: Crop;

    // Quality Gate: Only use suggested crop if dimensions are valid (non-zero)
    if (suggestedCrop && suggestedCrop.width > 0 && suggestedCrop.height > 0) {
      // Use pixel values directly as they now match the optimized image
      initialCrop = {
        unit: 'px',
        x: suggestedCrop.x,
        y: suggestedCrop.y,
        width: suggestedCrop.width,
        height: suggestedCrop.height,
      };
    } else {
      // Fallback: center a 1:1 aspect ratio crop
      const crop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 90,
          },
          1 / 1, // Aspect ratio 1:1
          width,
          height
        ),
        width,
        height
      );
      initialCrop = crop;
    }
    setCrop(initialCrop);
  }

  const handleCropConfirm = async () => {
    if (completedCrop?.width && completedCrop?.height && imgRef.current && previewCanvasRef.current) {
        try {
            const croppedImageUrl = getCroppedImg(
                imgRef.current,
                completedCrop,
                previewCanvasRef.current
            );
            onCrop(croppedImageUrl);
        } catch (e) {
            console.error(e);
            onCancel(); // Fallback if cropping fails
        }
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl relative w-full max-w-lg mx-4 text-gray-900 dark:text-white">
        <h3 className="text-xl font-bold text-center mb-4">{t('cropper.title')}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">{t('cropper.description')}</p>
        <div className="relative bg-gray-100 dark:bg-gray-900 rounded-md overflow-hidden max-h-[60vh]">
            <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                // Disabled enforced aspect ratio for better flexibility with AI boxes
                // aspect={1} 
                className="max-h-full"
            >
                <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imageUrl}
                    onLoad={onImageLoad}
                    className="w-full h-auto object-contain"
                />
            </ReactCrop>
            {/* Hidden canvas for generating the cropped image */}
            <canvas ref={previewCanvasRef} className="hidden" />
        </div>
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-md font-semibold transition-colors"
          >
            {t('cropper.button.cancel')}
          </button>
          <button
            onClick={handleCropConfirm}
            className="px-8 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors"
          >
            {t('cropper.button.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};
