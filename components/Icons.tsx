
import React from 'react';

export const StarIcon: React.FC<{ className?: string, filled?: boolean }> = ({ className, filled = false }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
);


export const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.573L16.5 21.75l-.398-1.177a3.375 3.375 0 00-2.456-2.456L12.5 18l1.177-.398a3.375 3.375 0 002.456-2.456L16.5 14.25l.398 1.177a3.375 3.375 0 002.456 2.456L20.5 18l-1.177.398a3.375 3.375 0 00-2.456 2.456z" />
  </svg>
);

export const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.124-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.077-2.09.921-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

export const PlusCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const CameraIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
    </svg>
);

export const XMarkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const PencilIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);

export const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
    </svg>
);


export const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-6.364-.386 1.591-1.591M3 12h2.25m.386-6.364 1.591 1.591M12 6.75a5.25 5.25 0 1 0 0 10.5 5.25 5.25 0 0 0 0-10.5Z" />
    </svg>
);

export const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
    </svg>
);

export const ExternalLinkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-4.5 0V6.375c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125-1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125Z" />
    </svg>
);

export const DocumentTextIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

export const AlertTriangleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
);

export const BarcodeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5v15m3-15v15m3-15v15m3-15v15m3-15v15m3-15v15M3.75 4.5h16.5" />
    </svg>
);

export const ShareIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.186 2.25 2.25 0 0 0-3.933 2.186Z" />
    </svg>
);

export const MicrophoneIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" />
    </svg>
);

export const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className={className}>
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3a9 9 0 100 18 9 9 0 000-18z" opacity="0.25"/>
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeDasharray="42.411500823462205" strokeDashoffset="31.808625617596654">
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
        </path>
    </svg>
);

export const ShoppingBagIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.658-.463 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

export const BuildingStorefrontIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5A.75.75 0 0114.25 12h.75c.414 0 .75.336.75.75v7.5m0 0H15M15 21a.75.75 0 01.75-.75h2.25a.75.75 0 01.75.75v0a.75.75 0 01-.75.75H15.75a.75.75 0 01-.75-.75z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
);

export const MapPinIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
);

export const ArrowsUpDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
    </svg>
);

export const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);

export const FunnelIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M7 12h10m-7 6h4" />
    </svg>
);

export const MagnifyingGlassIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
);

export const GlobeAltIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A11.953 11.953 0 0 0 12 13.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 0 3 12c0 .778.099 1.533.284 2.253m18.132-4.506A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918" />
    </svg>
);
  
export const LockClosedIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 0 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
);

export const UserCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const UserGroupIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 93.4" fill="currentColor" className={className}>
        <path fillRule="evenodd" clipRule="evenodd" d="M10.52,93.4V53.83c-2.14,0.82-4.14,0.84-5.8,0.27c-1.3-0.44-2.39-1.22-3.2-2.24c-0.8-1.01-1.32-2.25-1.47-3.61 c-0.24-2.11,0.39-4.5,2.19-6.73l0,0c0.09-0.11,0.19-0.22,0.31-0.31L59.98,0.5c0.68-0.62,1.72-0.69,2.47-0.1L120,41.03l0,0 c0.08,0.06,0.16,0.13,0.23,0.21c2.42,2.6,3.02,5.49,2.44,7.93c-0.29,1.21-0.87,2.28-1.66,3.18s-1.81,1.59-2.96,2 c-1.83,0.66-4,0.64-6.2-0.4V93.4h-5.12V51.7c0-0.92-41.14-29.26-45.1-32.34c-4.19,3.19-45.99,31.29-45.99,32.48V93.4H10.52 L10.52,93.4z M23.56,93.39c0-16.84,13.79-7.52,15-17.85c0.13-1.12-2.52-5.41-3.13-7.47c-1.3-2.08-1.77-5.37-0.34-7.56 c0.56-0.87,0.32-4.05,0.32-5.25c0-3.39,1.6-5.33,3.77-7.15c0.79-0.66,0.93-1.45,2.08-1.73c5.71-1.38,15.05,1.76,15.05,8.89 c0,1.51-0.35,4.28,0.47,5.47c0.79,1.15,0.89,2.82,0.6,4.38c-0.31,0.24-0.62,0.5-0.92,0.77c-0.68,0.6-1.36,1.27-2.03,2 c-0.03,0.03-0.07,0.06-0.1,0.09c-0.32,0.32-0.56,0.72-0.69,1.19c-0.27,1,0.35,2.01,1.07,2.66c-0.84,1.57-1.88,3.06-1.75,3.72 c0.21,1.06,1,2.04,2.12,2.93v0.02c0,0.06,0.01,0.11,0.01,0.17c0.04,0.39,0.1,0.76,0.19,1.09c0.1,0.37,0.24,0.73,0.41,1.07 c0.3,0.59,0.7,1.11,1.21,1.51c0.25,0.2,0.53,0.38,0.83,0.52c0.08,0.09,0.15,0.18,0.23,0.26l0.13,0.15 c-2.32,0.44-3.94,0.86-5.3,2.21c-1.51,1.49-2.08,3.59-2.08,7.37c0,0.19,0.02,0.38,0.04,0.55L23.56,93.39L23.56,93.39L23.56,93.39z M72.32,64.54c2.86-16.86,19.33-16.46,21.81,1.21c1.63,11.63,8.6,11.21-2.29,11.21H87.5c-0.02,2.96-0.48,4.47,2.59,6.14 c3.07,1.66,9.23,2.51,9.23,6.72v2.69c0,0.22-0.18,0.39-0.39,0.39H81.95v-0.06c0-3.78-0.58-5.88-2.08-7.37 c-1.19-1.17-2.57-1.64-4.45-2.04c0.37-0.17,0.72-0.36,1.05-0.55c2.7-1.62,2.24-3.25,2.22-5.93h-1.18 c-0.02-0.14-0.04-0.27-0.07-0.39h-0.01c-0.13-0.59-0.34-1.16-0.64-1.67c-0.05-0.09-0.11-0.18-0.16-0.26v-0.39 c0.36-1.34,0.46-2.82,0.22-4.19c-0.26-1.54-0.93-2.99-2.08-4.07c-0.59-0.56-1.25-0.97-1.97-1.26 C72.65,64.65,72.49,64.59,72.32,64.54L72.32,64.54L72.32,64.54z M57.35,69.85c4.08-4.51,8.8-6.95,12.33-2.95 c0.93,0.04,1.76,0.35,2.45,1c1.45,1.37,1.68,3.93,1.02,5.96v1.77c0.45,0.3,0.74,0.85,0.87,1.48c0.09,0.41,0.11,0.86,0.06,1.28 c-0.04,0.44-0.15,0.87-0.33,1.22c-0.25,0.5-0.63,0.85-1.16,0.93c-0.51,0.55-1.01,1.12-1.46,1.68c-0.49,0.62-0.91,1.19-1.19,1.68 c-0.22,0.37-0.15,0.61-0.07,0.88c0.04,0.14,0.08,0.28,0.11,0.43c0.9,0.19,1.7,0.34,2.43,0.48c4.6,0.86,6.04,1.13,6.04,7.13 c0,0.3-0.25,0.55-0.55,0.55H55.06c-0.31,0-0.55-0.25-0.55-0.55c0-6,1.43-6.26,6.04-7.13c0.73-0.14,1.55-0.29,2.44-0.48 c0.03-0.12,0.07-0.23,0.11-0.34c0.09-0.26,0.18-0.53-0.09-0.97c-0.29-0.48-0.71-1.06-1.19-1.68c-0.44-0.56-0.95-1.14-1.45-1.68 c-0.52-0.08-0.91-0.43-1.16-0.93c-0.18-0.34-0.29-0.78-0.33-1.22c-0.04-0.43-0.02-0.88,0.06-1.28c0.13-0.63,0.42-1.18,0.86-1.48 l-0.6-0.36C59.04,73.52,59.51,70.44,57.35,69.85L57.35,69.85L57.35,69.85L57.35,69.85z M96.28,3.25l15.69,0.64v21.19L96.28,14.72 V3.25L96.28,3.25L96.28,3.25z" />
    </svg>
);

export const UserPlusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
    </svg>
);

export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const EllipsisVerticalIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
    </svg>
);

export const HeartIcon: React.FC<{ className?: string, filled?: boolean }> = ({ className, filled = false }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
);

export const ChatBubbleOvalLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 01-2.53-.388A9.864 9.864 0 013 18.25v-2.523C3.65 14.28 4.887 13.5 6.25 13.5h1.166a9.01 9.01 0 012.212.388c1.366.56 2.87.935 4.372.935 4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 1.39.324 2.72.885 3.856" />
    </svg>
);

export const CheckBadgeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
    </svg>
);

export const ShoppingCartIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.43 122.88" fill="currentColor" className={className}>
        <path fillRule="evenodd" clipRule="evenodd" d="M22.63,12.6h93.3c6.1,0,5.77,2.47,5.24,8.77l-3.47,44.23c-0.59,7.05-0.09,5.34-7.56,6.41l-68.62,8.73 l3.63,10.53c29.77,0,44.16,0,73.91,0c1,3.74,2.36,9.83,3.36,14h-12.28l-1.18-4.26c-24.8,0-34.25,0-59.06,0 c-13.55-0.23-12.19,3.44-15.44-8.27L11.18,8.11H0V0h19.61C20.52,3.41,21.78,9.15,22.63,12.6L22.63,12.6z M53.69,103.92 c5.23,0,9.48,4.25,9.48,9.48c0,5.24-4.24,9.48-9.48,9.48c-5.24,0-9.48-4.24-9.48-9.48C44.21,108.17,48.45,103.92,53.69,103.92 L53.69,103.92z M92.79,103.92c5.23,0,9.48,4.25,9.48,9.48c0,5.24-4.25,9.48-9.48,9.48c-5.24,0-9.48-4.24-9.48-9.48 C83.31,108.17,87.55,103.92,92.79,103.92L92.79,103.92z M30.8,43.07H45.9l-5.48-22.91c-5.4,0-10.72-0.01-15.93-0.01l1.84,6.86 L26.39,27L30.8,43.07L30.8,43.07L30.8,43.07z M48.31,20.17l5.48,22.9h14.54l-5.5-22.88L48.31,20.17L48.31,20.17L48.31,20.17z M70.74,20.2l5.5,22.87h13.91l-5.48-22.85L70.74,20.2L70.74,20.2L70.74,20.2z M92.58,20.23l5.48,22.85l13.92,0l1.54-18.36 c0.43-5.12,1.33-4.47-3.63-4.47C104.23,20.24,98.44,20.23,92.58,20.23L92.58,20.23L92.58,20.23z M111.49,48.89H99.45l3.97,16.56 l0.98-0.13c6.07-0.87,5.67,0.52,6.15-5.21L111.49,48.89L111.49,48.89z M95.77,66.5l-4.22-17.61h-13.9l4.67,19.44L95.77,66.5 L95.77,66.5L95.77,66.5z M74.66,69.37l-4.93-20.49l-14.55,0l5.37,22.41L74.66,69.37L74.66,69.37L74.66,69.37z M52.9,72.34 l-5.61-23.45H32.4l6.96,25.3L52.9,72.34L52.9,72.34z"/>
    </svg>
);

export const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
);

export const TagIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
);


// Dietary Icons
export const LactoseFreeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" shapeRendering="geometricPrecision" textRendering="geometricPrecision" imageRendering="optimizeQuality" fillRule="evenodd" clipRule="evenodd" viewBox="0 0 512 512" className={className}>
        <path fill="currentColor" fillRule="nonzero" d="M256 0c70.68 0 134.69 28.66 181.01 74.99C483.34 121.31 512 185.31 512 256s-28.66 134.69-74.99 181.02C390.69 483.35 326.69 512 256 512s-134.69-28.65-181.02-74.98C28.66 390.69 0 326.69 0 256c0-70.69 28.66-134.69 74.99-181.01C121.31 28.66 185.31 0 256 0zm-43.23 74.79h86.46c7.4 0 13.43 6.03 13.43 13.43v20.12c0 7.4-6.03 13.43-13.43 13.43h-1.64c22.74 38.85 35.6 80.87 37.76 125.89v.23h.02v149.59c0 .21-.02.41-.04.61-.95 21.11-10.65 35.93-32.54 39.05-.24.04-.48.05-.71.05l-91.17.01c-.21 0-.41-.01-.61-.04-20.56-.87-30.52-14.27-33.6-33.45-.04-.27-.06-.53-.06-.79h-.02V248.29c0-.22.02-.43.05-.65 3.41-43.69 14.52-87.35 35.77-125.87-7.26-.17-13.1-6.15-13.1-13.42V88.22c0-7.4 6.03-13.43 13.42-13.43h.01zm70.8 48.75-58.29.45c-21.56 37.93-32.65 81.12-36.03 124.42v152.47c2.37 14.14 6.08 22.17 21.44 22.83h89.36c16.77-2.55 21.12-11.78 21.84-27.78l-.01-.18.87-147.86c-2.18-44.6-16.16-86.16-39.19-124.35h.01zm14.81-37.84h-84.76c-1.85 0-3.38 1.53-3.38 3.38v18.41c0 1.85 1.53 3.38 3.38 3.38h84.76c1.85 0 3.38-1.53 3.38-3.38V89.08c0-1.85-1.53-3.38-3.38-3.38zm137.19 20.23-86.45 86.45c-1.53-6.39-3.29-12.76-5.27-19.08-.53-1.7-1.08-3.39-1.65-5.08l78.48-78.48C378.4 47.86 320.22 21.99 256 21.99c-64.63 0-123.13 26.19-165.48 68.54C48.18 132.87 21.99 191.38 21.99 256c0 64.23 25.87 122.41 67.75 164.69l65.39-65.4v31.08l-49.2 49.21c40.62 33.98 92.96 54.43 150.07 54.43 64.63 0 123.13-26.19 165.48-68.53 42.34-42.34 68.53-100.85 68.53-165.48 0-57.11-20.46-109.45-54.44-150.07z"/>
    </svg>
);

export const VeganIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 122.88 122.88">
        <g>
            <path fillRule="evenodd" clipRule="evenodd" fill="#1B9C28" d="M93.67,26.26c-19.52,6.76-45.41,6.05-53.84,26.82c-3.46,8.53-3.48,15.23-1.29,20.05H13.81 c5.24,21.45,24.58,37.36,47.63,37.36c23.06,0,42.4-15.92,47.64-37.36H77.51C87.82,64.22,95.56,48.72,93.67,26.26L93.67,26.26z M46.53,80.92l-2.09,15.9h-6.26l-2.4-15.9h4.36c0.49,4.39,0.85,8.1,1.08,11.13c0.22-3.07,0.45-5.79,0.68-8.16l0.27-2.97H46.53 L46.53,80.92z M56.11,90.53h-5.15v2.83c0,0.59,0.04,0.97,0.13,1.14c0.09,0.17,0.25,0.25,0.5,0.25c0.3,0,0.51-0.11,0.61-0.34 c0.1-0.23,0.15-0.67,0.15-1.32v-1.72h3.76v0.96c0,0.81-0.05,1.43-0.15,1.86c-0.1,0.43-0.34,0.89-0.71,1.39 c-0.37,0.49-0.85,0.86-1.42,1.11c-0.57,0.25-1.29,0.37-2.15,0.37c-0.84,0-1.58-0.12-2.22-0.36c-0.64-0.24-1.14-0.57-1.5-1 c-0.36-0.42-0.6-0.89-0.74-1.4C47.07,93.8,47,93.07,47,92.09v-3.8c0-1.14,0.15-2.04,0.46-2.7c0.31-0.66,0.81-1.16,1.51-1.51 c0.7-0.35,1.51-0.53,2.42-0.53c1.11,0,2.03,0.21,2.75,0.63c0.72,0.42,1.23,0.98,1.53,1.68c0.29,0.69,0.44,1.67,0.44,2.94V90.53 L56.11,90.53z M52.15,88.42v-0.95c0-0.68-0.04-1.11-0.11-1.31c-0.07-0.2-0.22-0.29-0.45-0.29c-0.28,0-0.46,0.08-0.52,0.25 c-0.07,0.17-0.1,0.62-0.1,1.35v0.95H52.15L52.15,88.42z M66.43,83.8v10.04c0,1.35-0.03,2.23-0.09,2.63 c-0.06,0.4-0.29,0.81-0.66,1.26c-0.38,0.44-0.91,0.78-1.59,1.01c-0.68,0.23-1.54,0.35-2.56,0.35c-1.27,0-2.28-0.21-3.05-0.64 c-0.77-0.43-1.16-1.27-1.19-2.53h3.84c0,0.58,0.21,0.87,0.64,0.87c0.31,0,0.51-0.09,0.61-0.26c0.1-0.18,0.15-0.55,0.15-1.11V94.4 c-0.34,0.31-0.7,0.54-1.08,0.7c-0.38,0.16-0.77,0.24-1.19,0.24c-0.72,0-1.31-0.14-1.77-0.43c-0.47-0.29-0.78-0.67-0.95-1.13 c-0.17-0.47-0.26-1.14-0.26-2v-4.73c0-1.24,0.22-2.13,0.67-2.67c0.45-0.54,1.13-0.81,2.05-0.81c0.5,0,0.96,0.1,1.37,0.31 c0.41,0.21,0.78,0.51,1.1,0.92l0.28-0.99H66.43L66.43,83.8z M62.47,87.25c0-0.6-0.04-0.98-0.11-1.14s-0.23-0.24-0.47-0.24 c-0.24,0-0.41,0.09-0.5,0.28c-0.1,0.19-0.15,0.56-0.15,1.11v4.38c0,0.58,0.04,0.96,0.11,1.13c0.07,0.17,0.23,0.26,0.47,0.26 c0.27,0,0.45-0.1,0.53-0.31c0.08-0.21,0.12-0.68,0.12-1.42V87.25L62.47,87.25z M71.37,88.84h-3.72v-0.88 c0-1.01,0.12-1.79,0.35-2.34c0.23-0.55,0.7-1.03,1.4-1.45c0.7-0.42,1.61-0.63,2.73-0.63c1.34,0,2.35,0.24,3.03,0.71 c0.68,0.47,1.09,1.05,1.23,1.75s0.21,2.12,0.21,4.27v6.54h-3.86v-1.16c-0.24,0.47-0.56,0.82-0.94,1.05 c-0.38,0.23-0.84,0.35-1.37,0.35c-0.7,0-1.33-0.19-1.91-0.58c-0.58-0.39-0.87-1.24-0.87-2.56v-1.07c0-0.98,0.15-1.64,0.46-1.99 s1.07-0.77,2.29-1.24c1.3-0.51,2-0.85,2.1-1.03c0.09-0.18,0.14-0.54,0.14-1.08c0-0.68-0.05-1.12-0.15-1.33 c-0.1-0.2-0.27-0.31-0.51-0.31c-0.27,0-0.44,0.09-0.5,0.26c-0.07,0.17-0.1,0.62-0.1,1.35V88.84L71.37,88.84z M72.63,90.63 c-0.64,0.47-1.01,0.85-1.11,1.17c-0.11,0.32-0.15,0.76-0.15,1.35c0,0.68,0.04,1.11,0.13,1.31c0.09,0.2,0.27,0.29,0.53,0.29 c0.25,0,0.41-0.08,0.49-0.23c0.08-0.15,0.11-0.56,0.11-1.21V90.63L72.63,90.63z M81.98,83.8l-0.06,1.21 c0.29-0.48,0.64-0.84,1.06-1.09c0.42-0.24,0.89-0.36,1.44-0.36c0.68,0,1.24,0.16,1.67,0.48c0.43,0.32,0.71,0.72,0.83,1.21 c0.13,0.49,0.19,1.3,0.19,2.44v9.13h-3.96V87.8c0-0.89-0.03-1.44-0.09-1.64c-0.06-0.2-0.22-0.29-0.49-0.29 c-0.29,0-0.46,0.11-0.54,0.34c-0.07,0.23-0.11,0.83-0.11,1.81v8.81h-3.96V83.8H81.98L81.98,83.8z M61.44,0 c16.97,0,32.33,6.88,43.44,18s18,26.48,18,43.44c0,16.97-6.88,32.33-18,43.45c-11.12,11.12-26.48,18-43.44,18 c-16.97,0-32.33-6.88-43.44-18C6.88,93.77,0,78.41,0,61.44C0,44.47,6.88,29.11,18,18C29.11,6.88,44.47,0,61.44,0L61.44,0z M100.03,22.85C90.16,12.97,76.51,6.86,61.44,6.86c-15.07,0-28.72,6.11-38.59,15.99C12.97,32.72,6.86,46.37,6.86,61.44 c0,15.07,6.11,28.72,15.99,38.59c9.88,9.88,23.52,15.99,38.59,15.99c15.07,0,28.72-6.11,38.59-15.99 c9.88-9.88,15.99-23.52,15.99-38.59C116.02,46.37,109.91,32.72,100.03,22.85L100.03,22.85z M46.57,71.92 c8.1-17.45,28.91-23.44,39.24-35.37C74.62,58.37,65.48,59.43,46.57,71.92L46.57,71.92z"/>
        </g>
    </svg>
);

export const GlutenFreeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 81.02 81.02" className={className}>
        <path fill="#fff" fillRule="evenodd" d="M42.39,5.3A33.34,33.34,0,1,1,9.05,38.63,33.34,33.34,0,0,1,42.39,5.3Z"/>
        <path fillRule="evenodd" fill="#D97706" d="M51.58,28.58c6.34,1.2,10.46-1.85,11.24-11.19-3.74,0-13.11,1.51-11.24,11.19ZM39.52,43c4,4.63,6.88,5.71,14.56,0-5-2.89-9.3-6.83-14.56,0Zm7.3-7.31c3.69,4.31,6.42,5.32,13.56,0-4.63-2.69-8.65-6.36-13.56,0ZM28.91,48.88c-5.21-4.46-6.43-7.76,0-16.4,3.26,5.61,7.7,10.47,0,16.4Zm8.26-8.23c-4.63-3.95-5.71-6.88,0-14.56,2.89,5,6.83,9.3,0,14.56Zm7.31-7.3c-4.3-3.69-5.31-6.41,0-13.56,2.7,4.64,6.37,8.66,0,13.56ZM31.29,51.26c4.46,5.21,7.76,6.43,16.4,0-5.61-3.26-10.47-7.7-16.4,0Zm-5.07.37A1.64,1.64,0,0,1,28.54,54l-3.71,3.72a1.64,1.64,0,0,1-2.32-2.33l3.71-3.71Z"/>
        <path fill="#D97706" d="M42.39,0a38.28,38.28,0,0,0-7.55.74,37.56,37.56,0,0,0-7.23,2.19A38.2,38.2,0,0,0,20.93,6.5a38.77,38.77,0,0,0-5.86,4.81A38.63,38.63,0,0,0,6.68,23.86a38.66,38.66,0,0,0,3.57,36.23A39.22,39.22,0,0,0,15.07,66l.06.06a39.08,39.08,0,0,0,5.8,4.76,39.59,39.59,0,0,0,6.68,3.57,38.68,38.68,0,0,0,29.55,0A38.63,38.63,0,0,0,69.71,66,38.75,38.75,0,0,0,78.09,53.4a37.46,37.46,0,0,0,2.19-7.22,38.83,38.83,0,0,0,0-15.09,37.34,37.34,0,0,0-2.19-7.23,38.2,38.2,0,0,0-3.57-6.68,39.24,39.24,0,0,0-4.81-5.87A38.63,38.63,0,0,0,63.84,6.5a38.2,38.2,0,0,0-6.68-3.57A37.34,37.34,0,0,0,49.93.74,38.26,38.26,0,0,0,42.39,0ZM17.14,19.33,61.69,63.88a1.17,1.17,0,0,1,0,1.66.83.83,0,0,1-.21.17,33,33,0,0,1-3.9,2.37,31.46,31.46,0,0,1-4.25,1.83A32.17,32.17,0,0,1,48,71.3a34.1,34.1,0,0,1-5.56.46,33,33,0,0,1-6.48-.63A33,33,0,0,1,24,66.19a33.49,33.49,0,0,1-5-4.13,33.6,33.6,0,0,1-7.2-10.76,33.08,33.08,0,0,1-2.5-12.54v-.13a32.91,32.91,0,0,1,.47-5.55,32.54,32.54,0,0,1,1.39-5.39,31.46,31.46,0,0,1,1.83-4.25,33.18,33.18,0,0,1,2.41-4A1.17,1.17,0,0,1,17,19.2l.15.13Zm48.7,40.91L20.78,15.18a1.17,1.17,0,0,1,0-1.66l.13-.12a33.12,33.12,0,0,1,4.35-3.13,32.26,32.26,0,0,1,4.85-2.42,32.75,32.75,0,0,1,6-1.76,34.17,34.17,0,0,1,6.27-.59,33.64,33.64,0,0,1,6.47.63A33.19,33.19,0,0,1,55.06,8a32.7,32.7,0,0,1,5.72,3.06A33.11,33.11,0,0,1,74.89,32.16a33.64,33.64,0,0,1,.63,6.47,34.17,34.17,0,0,1-.59,6.27,32.75,32.75,0,0,1-1.76,6,33.28,33.28,0,0,1-5.61,9.26,1.17,1.17,0,0,1-1.65.13l-.07-.06Z"/>
    </svg>
);


// Allergen Icons
export const AllergenGlutenIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.375l-4.5 4.5m4.5-4.5l4.5 4.5m-4.5-4.5v18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 10.875L6 13.125m2.25-2.25L10.5 8.625" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.875L18 13.125m-2.25-2.25L13.5 8.625" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15.375L6 17.625m2.25-2.25l2.25-2.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.375L18 17.625m-2.25-2.25l-2.25-2.25" />
    </svg>
);

export const AllergenDairyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 007.5-12.316C18.667 6.42 15.6 3 12 3S5.333 6.42 4.5 8.684A9 9 0 0012 21z" />
    </svg>
);

export const AllergenPeanutIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M16.5 10.5C16.5 12.9853 14.4853 15 12 15C9.51472 15 7.5 12.9853 7.5 10.5C7.5 8.01472 9.51472 6 12 6C14.4853 6 16.5 8.01472 16.5 10.5Z" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 13.5C15 15.9853 12.9853 18 10.5 18C8.01472 18 6 15.9853 6 13.5C6 11.0147 8.01472 9 10.5 9C12.9853 9 15 11.0147 15 13.5Z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export const AllergenTreeNutIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21q-5 0-7-7 2-5 7-7 5 2 7 7-2 7-7 7Z" />
    </svg>
);

export const AllergenSoyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18.75c-3.866 0-7-3.134-7-7s3.134-7 7-7 7 3.134 7 7-3.134 7-7 7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11.25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134 7 7 3.134 7 7 7z" />
    </svg>
);

export const AllergenEggIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.75c-4.97 0-9-4.03-9-9s4.03-9 9-9 9 4.03 9 9-4.03 9-9 9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
    </svg>
);

export const AllergenFishIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c0-3.187 3.134-5.25 7.5-5.25s7.5 2.063 7.5 5.25c0 3.187-3.134 5.25-7.5 5.25S2.25 15.187 2.25 12z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 12l3.75-3.75m-3.75 3.75l3.75 3.75" />
    </svg>
);

export const AllergenShellfishIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9c0-1.92.6-3.68 1.62-5.12" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12c0-4.97 4.03-9 9-9s9 4.03 9 9c0 1.92-.6 3.68-1.62 5.12" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12m-2.25 0a2.25 2.25 0 104.5 0 2.25 2.25 0 10-4.5 0" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18" />
    </svg>
);