import React, { useEffect } from 'react';
import { XMarkIcon } from './Icons';
import { useTranslation } from '../i18n/index';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
  const { t } = useTranslation();

  // Effect to handle Escape key press for closing the modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
        document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose} // Close on background click
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative bg-white dark:bg-gray-900 p-2 rounded-lg shadow-2xl max-w-3xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image/modal content itself
      >
        <img
          src={imageUrl}
          alt="Enlarged food product"
          className="w-full h-full object-contain rounded-md"
          style={{ maxHeight: 'calc(90vh - 1rem)' }}
        />
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-1.5 rounded-full shadow-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          aria-label={t('modal.image.closeAria')}
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};