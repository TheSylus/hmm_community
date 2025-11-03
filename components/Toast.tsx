import React, { useEffect } from 'react';
import { useToast, ToastMessage } from '../contexts/ToastContext';
import { XMarkIcon, CheckCircleIcon } from './Icons'; // Assuming you have these icons

const toastStyles = {
  success: {
    bg: 'bg-green-100 dark:bg-green-800',
    text: 'text-green-800 dark:text-green-100',
    icon: <CheckCircleIcon className="w-6 h-6 text-green-500" />,
  },
  error: {
    bg: 'bg-red-100 dark:bg-red-800',
    text: 'text-red-800 dark:text-red-100',
    icon: <XMarkIcon className="w-6 h-6 text-red-500" />,
  },
  info: {
    bg: 'bg-blue-100 dark:bg-blue-800',
    text: 'text-blue-800 dark:text-blue-100',
    icon: <CheckCircleIcon className="w-6 h-6 text-blue-500" />,
  },
};

const Toast: React.FC<{ toast: ToastMessage; onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
  const { id, message, type } = toast;

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, 3000); // Auto-dismiss after 3 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [id, onDismiss]);

  const styles = toastStyles[type];

  return (
    <div className={`w-full max-w-sm ${styles.bg} shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden animate-slide-in-down`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{styles.icon}</div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className={`text-sm font-medium ${styles.text}`}>{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => onDismiss(id)}
              className={`inline-flex rounded-md p-1 ${styles.text} hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2`}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
       <style>{`
        @keyframes slide-in-down {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-in-down {
          animation: slide-in-down 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-start px-4 py-6 pointer-events-none sm:p-6 z-50"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </div>
  );
};