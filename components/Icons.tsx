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
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
);

export const ShoppingBagIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.658-.463 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
  </svg>
);

export const LactoseFreeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.123 12.262c.338-.52.338-1.163 0-1.683-1.42-2.188-3.41-3.955-5.87-5.324-2.46-1.37-5.242-2.18-8.243-2.18-.12 0-.239.003-.358.008a.75.75 0 0 0-.622.873l.493 2.803c.045.256.24.46.498.513a25.46 25.46 0 0 1 3.535.433c2.47.533 4.72 1.486 6.643 2.768 1.924 1.282 3.42 2.87 4.4 4.54ZM3.236 14.195l-.533 2.895a.75.75 0 0 0 .86.86l2.895-.533a25.495 25.495 0 0 1-3.222-3.222Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12.973 17.592c-4.496-2.316-8.2-5.94-10.74-10.265A.75.75 0 0 0 1.5 6.427v-.177a.75.75 0 0 0-.427-.683L.527 5.25a.75.75 0 0 0-.914.364c-.322.613-.604 1.253-.842 1.913a.75.75 0 0 0 .42 1.01l1.037.493c.365.173.782.02 1.02-.321.43-.63 1.025-1.464 1.774-2.482.75-1.018 1.63-2.112 2.623-3.24M15.75 15.75l-3.75 3.75" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.25 19.5 5.25-5.25" />
  </svg>
);

export const VeganIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} className={className}>
    <path stroke="rgb(34 197 94)" strokeLinecap="round" strokeLinejoin="round" d="M21.25 12c0 6.21-6.93 7-9.25 7s-9.25-.79-9.25-7 .94-8 4.25-8 5.75 4 5 4-1.25-4 5-4 4.25 1.79 4.25 8Z" />
    <path stroke="rgb(22 101 52)" strokeLinecap="round" strokeLinejoin="round" d="M14 14.75c0 2.2-1.79 4-4 4s-4-1.79-4-4 1.79-4 4-4" />
  </svg>
);

export const GlutenFreeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m15.65 15.65-2.8-2.8a1.5 1.5 0 0 0-2.12 0l-2.8 2.8a1.5 1.5 0 0 0 2.12 2.12l2.8-2.8 2.8 2.8a1.5 1.5 0 0 0 2.12-2.12ZM8.82 8.82l.35-.35m-.35.35 1.06-1.06m-1.06 1.06-2.12 2.12m2.12-2.12 2.47-2.47a.5.5 0 0 1 .7 0l2.48 2.48m-5.65 0 .35.35m-.35-.35L6 6.35m2.83 2.83 2.12-2.12m0 0a.5.5 0 0 1 .7 0l2.12 2.12M12 12l2.12-2.12" />
    <path stroke="rgb(245 158 11)" strokeLinecap="round" strokeLinejoin="round" d="M5.52 5.52a9 9 0 0 1 12.96 0" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m20.47 20.47-2.12-2.12" />
    <path stroke="rgb(245 158 11)" strokeLinecap="round" strokeLinejoin="round" d="M3 3c3.87 3.87 9.1 6 15 6" />
    <path stroke="rgb(180 83 9)" strokeLinecap="round" strokeLinejoin="round" d="M3 21c3.87-3.87 9.1-6 15-6" />
  </svg>
);

export const BarcodeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v16M8 4v16M12 4v16M16 4v16M20 4v16" />
  </svg>
);

export const MicrophoneIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5a6 6 0 0 0-12 0v1.5a6 6 0 0 0 6 6Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12a7.5 7.5 0 1 1-15 0" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75v6.75m0 0H9.75m2.25 0H14.25" />
  </svg>
);

export const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

export const DocumentTextIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);

export const AllergenGlutenIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m15.65 15.65-2.8-2.8a1.5 1.5 0 0 0-2.12 0l-2.8 2.8a1.5 1.5 0 0 0 2.12 2.12l2.8-2.8 2.8 2.8a1.5 1.5 0 0 0 2.12-2.12ZM8.82 8.82l.35-.35m-.35.35 1.06-1.06m-1.06 1.06-2.12 2.12m2.12-2.12 2.47-2.47a.5.5 0 0 1 .7 0l2.48 2.48m-5.65 0 .35.35m-.35-.35L6 6.35m2.83 2.83 2.12-2.12m0 0a.5.5 0 0 1 .7 0l2.12 2.12M12 12l2.12-2.12" />
  </svg>
);
export const AllergenDairyIcon: React.FC<{ className?: string }> = ({ className }) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.123 12.262c.338-.52.338-1.163 0-1.683-1.42-2.188-3.41-3.955-5.87-5.324-2.46-1.37-5.242-2.18-8.243-2.18-.12 0-.239.003-.358.008a.75.75 0 0 0-.622.873l.493 2.803c.045.256.24.46.498.513a25.46 25.46 0 0 1 3.535.433c2.47.533 4.72 1.486 6.643 2.768 1.924 1.282 3.42 2.87 4.4 4.54ZM3.236 14.195l-.533 2.895a.75.75 0 0 0 .86.86l2.895-.533a25.495 25.495 0 0 1-3.222-3.222Z" />
  </svg>
);
export const AllergenPeanutIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 6.75C12.75 5.507 11.493 3 10.5 3S8.25 5.507 8.25 6.75c0 1.242 1.257 3.75 2.25 3.75S12.75 8.01 12.75 6.75Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 12c0-2.485-2.239-4.5-5-4.5s-5 2.015-5 4.5c0 .313.034.618.098.914 1.24 1.42 2.92 2.27 4.902 2.27s3.662-.85 4.902-2.27c.064-.296.098-.601.098-.914Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21c-2.485 0-4.5-2.015-4.5-4.5S8.015 12 10.5 12s4.5 2.015 4.5 4.5-2.015 4.5-4.5 4.5Zm0 0v-2.625" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 9.75c1.406 0 2.625 1.594 2.625 3.375s-1.219 3.375-2.625 3.375" />
  </svg>
);
export const AllergenTreeNutIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 10.5c0-3.313-2.687-6-6-6s-6 2.687-6 6c0 1.933.91 3.684 2.344 4.755A6.002 6.002 0 0 0 5.25 21h13.5a6.002 6.002 0 0 0-2.344-5.745C16.34 14.184 17.25 12.433 17.25 10.5ZM12 15V9" />
  </svg>
);
export const AllergenSoyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 8.25S9.75 3 12 3s3.75 5.25 3.75 5.25" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.375 8.25c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3Zm5.25 0c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75a4.502 4.502 0 0 0-4.125 2.585A4.502 4.502 0 0 0 12 21a4.502 4.502 0 0 0 4.125-5.665A4.502 4.502 0 0 0 12 12.75Z" />
  </svg>
);
export const AllergenEggIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
  </svg>
);
export const AllergenFishIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 15.75a3 3 0 0 1-6 0m6 0a3 3 0 0 0-6 0m6 0v2.25m-6-2.25v2.25m0-9v2.25m0-2.25a3 3 0 0 1 6 0m-6 0a3 3 0 0 0 6 0m-6 0h.008v.008H9v-.008Zm0 3.75h.008v.008H9v-.008Zm0 3.75h.008v.008H9v-.008Zm3.75-3.75h.008v.008h-.008v-.008Zm0 3.75h.008v.008h-.008v-.008Zm3.75 0h.008v.008h-.008v-.008Zm0-3.75h.008v.008h-.008v-.008Zm0-3.75h.008v.008h-.008v-.008Zm-3.75 0h.008v.008h-.008v-.008Zm0-3.75h.008v.008h-.008v-.008Zm-3.75 0h.008v.008H9v-.008Z" />
  </svg>
);
export const AllergenShellfishIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h6m-6 2.25h6M3 12l6 6m-6-6-6-6" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0 2.485-2.015 4.5-4.5 4.5s-4.5-2.015-4.5-4.5S12.515 7.5 15 7.5s4.5 2.015 4.5 4.5Z" />
  </svg>
);

export const MapPinIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>
);

export const FunnelIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013l-2.5 1a2.25 2.25 0 0 1-2.244-2.013v-2.927a2.25 2.25 0 0 0-.659-1.591L2.659 7.409A2.25 2.25 0 0 1 2 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
  </svg>
);

export const BuildingStorefrontIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5A.75.75 0 0 1 14.25 12h.75c.414 0 .75.336.75.75v7.5m0 0H18M15 21h-1.5m-3 0h-3.75a.75.75 0 0 1-.75-.75V13.5m0 0H3V21m0-7.5h.75m.75 0a.75.75 0 0 1 .75.75v7.5m0 0H9m3.75-7.5H12m0 0V21m-2.25-9.75a.75.75 0 0 1 .75-.75h3.75c.414 0 .75.336.75.75v3.75a.75.75 0 0 1-.75.75h-3.75a.75.75 0 0 1-.75-.75v-3.75Zm-5.25 0a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75Zm1.5 0v.75" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75a1.5 1.5 0 0 1 1.5-1.5h15A1.5 1.5 0 0 1 21 9.75v9.75a1.5 1.5 0 0 1-1.5 1.5H15a.75.75 0 0 1-.75-.75V13.5a.75.75 0 0 0-.75-.75H9.75a.75.75 0 0 0-.75.75v5.25a.75.75 0 0 1-.75.75H4.5A1.5 1.5 0 0 1 3 19.5v-9.75Z" />
  </svg>
);

export const MagnifyingGlassIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

export const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

export const GlobeAltIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21V3M4.284 4.284c-.373.931-.623 1.936-.763 2.982M21 12a9.004 9.004 0 0 0-8.716-6.747M3.237 10.96c.21.624.46.123.75.183m0 0c.29-.06.54-.12.75-.183m-1.5 0a9.004 9.004 0 0 0-1.5 0m1.5 0c-.373.931-.623 1.936-.763 2.982M12 3a9.004 9.004 0 0 0-8.716 6.747M20.763 10.96c-.21.624-.46.123-.75.183m0 0c-.29-.06-.54-.12-.75-.183m1.5 0a9.004 9.004 0 0 0 1.5 0m-1.5 0c.373.931.623 1.936.763 2.982" />
  </svg>
);

export const LockClosedIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
  </svg>
);

export const ShareIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.195.025.39.042.586.042h4.4c.196 0 .391-.017.586-.042m-5.572 2.186a2.25 2.25 0 1 1 0-2.186m0 2.186c.195.025.39.042.586.042h4.4c.196 0 .391-.017.586-.042m-5.572-15.086a2.25 2.25 0 1 0 0 2.186c.195.025.39.042.586.042h4.4c.196 0 .391-.017.586-.042m-5.572 2.186a2.25 2.25 0 1 1 0-2.186" />
  </svg>
);

export const HeartIcon: React.FC<{ className?: string, filled?: boolean }> = ({ className, filled=false }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
  </svg>
);

export const ChatBubbleOvalLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 0 1-2.53-.388A.75.75 0 0 1 9 19.586v-2.022a.75.75 0 0 1 .75-.75c.621 0 1.247-.043 1.86-.12a9.011 9.011 0 0 0 3.421-2.036.75.75 0 0 1 1.05-.142 9.011 9.011 0 0 0 3.421-2.036.75.75 0 0 1 1.05-.142A9.01 9.01 0 0 0 21 12ZM5.25 8.25a.75.75 0 0 0-.75.75v5.25c0 .414.336.75.75.75h.75a.75.75 0 0 0 .75-.75V9a.75.75 0 0 0-.75-.75h-.75Z" />
  </svg>
);

export const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

export const UserGroupIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m-7.5-2.962c.51.054 1.02.082 1.53.082a9.094 9.094 0 0 1 4.53-1.549m-5.89-1.571a5.953 5.953 0 0 1-1.53.082c-1.294 0-2.522-.36-3.634-.993m11.49-2.47a5.953 5.953 0 0 0-1.53-.082c-1.294 0-2.522.36-3.634-.993m-3.634-1.003a5.953 5.953 0 0 1-1.53-.082c-1.294 0-2.522.36-3.634.993m1.53-1.056A5.953 5.953 0 0 0 3 6c0 1.354.46 2.628 1.258 3.634m11.49-2.47A5.953 5.953 0 0 1 21 6c0 1.354-.46 2.628-1.258 3.634m-11.49 2.47c.51.054 1.02.082 1.53.082a9.094 9.094 0 0 0 3.741.479m-2.21-2.962a5.953 5.953 0 0 1 1.53.082c1.294 0 2.522-.36 3.634-.993m-3.634-1.003a5.953 5.953 0 0 0 1.53.082c1.294 0 2.522.36 3.634.993m0 0c.51.054 1.02.082 1.53.082a9.094 9.094 0 0 1 4.53 1.549m-5.89 1.571a5.953 5.953 0 0 0 1.53.082c1.294 0 2.522.36 3.634.993m-3.634 1.003a5.953 5.953 0 0 1 1.53.082c1.294 0 2.522.36 3.634.993" />
  </svg>
);

// FIX: Add missing UserCircleIcon to resolve import errors.
export const UserCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);

export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

export const EllipsisVerticalIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
    </svg>
);

export const UserPlusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
    </svg>
);