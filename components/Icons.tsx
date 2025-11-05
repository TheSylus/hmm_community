import React from 'react';

// Common props for all icons
type IconProps = React.SVGProps<SVGSVGElement>;
// Props for icons that have a filled/outline variant
type FillableIconProps = IconProps & { filled?: boolean };

// A generic spinner icon for loading states
export const SpinnerIcon: React.FC<IconProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    {...props}
    className={`animate-spin ${props.className || ''}`}
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
      className="opacity-25"
    ></circle>
    <path
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      className="opacity-75"
    ></path>
  </svg>
);

// Star icon, used for ratings. Supports filled and outline states.
export const StarIcon: React.FC<FillableIconProps> = ({ filled = true, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);

// Sparkles icon, often used for AI-related features.
export const SparklesIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a3.375 3.375 0 00-2.672-2.672L11.25 18l1.938-.648a3.375 3.375 0 002.672-2.672L16.25 13.5l.648 1.938a3.375 3.375 0 002.672 2.672L21 18.75l-1.938.648a3.375 3.375 0 00-2.672 2.672z" />
  </svg>
);

// Camera icon.
export const CameraIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008v-.008z" />
  </svg>
);

// Plus Circle icon.
export const PlusCircleIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// X Mark icon, for closing modals and dismissing banners.
export const XMarkIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Document Text icon.
export const DocumentTextIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

// Barcode icon.
export const BarcodeIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5A.75.75 0 014.5 3.75h15a.75.75 0 01.75.75v15a.75.75 0 01-.75.75h-15a.75.75 0 01-.75-.75v-15z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9v6m1.5-6v6m1.5-6v6m1.5-6v6m1.5-6v6M6 12h12" />
  </svg>
);

// Microphone icon.
export const MicrophoneIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" />
  </svg>
);

// Map Pin icon.
export const MapPinIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);

// Globe Alt icon. CORRECTED
export const GlobeAltIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
);


// Lock Closed icon.
export const LockClosedIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

// User Group icon. CORRECTED
export const UserGroupIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962a3.75 3.75 0 015.25 0m-5.25 0a3.75 3.75 0 00-5.25 0M3 13.5a9 9 0 0118 0v-2.252a9.006 9.006 0 00-4.5-.941c-1.356 0-2.64.34-3.75.941a9.006 9.006 0 00-4.5-.941C5.64 9.34 4.356 9 3 9v4.5z" />
  </svg>
);

// Pencil icon.
export const PencilIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
  </svg>
);

// Trash icon.
export const TrashIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

// Eye icon.
export const EyeIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// Shopping Cart icon.
export const ShoppingCartIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c.51 0 .962-.328 1.093-.826l1.821-5.464a.75.75 0 00-.67-1.032H5.102a.75.75 0 00-.732.551l-1.386 5.464c-.074.294.04.612.286.786s.569.24.84.158L5.397 14.25M7.5 14.25L5.106 5.162M18.75 14.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
  </svg>
);

// Chat Bubble icon.
export const ChatBubbleBottomCenterTextIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a.375.375 0 01.265-.112c2.036-.233 3.553-.506 4.79-1.134a9.25 9.25 0 002.83-4.062 9.247 9.247 0 00-.375-5.623c-1.5-2.083-3.6-3.344-5.945-3.344H7.125c-3.125 0-5.625 2.5-5.625 5.625v3.01z" />
    </svg>
);

// Heart icon.
export const HeartIcon: React.FC<FillableIconProps> = ({ filled = false, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
);

// Adjustments Horizontal icon.
export const AdjustmentsHorizontalIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
  </svg>
);

// Cog 6 Tooth icon.
export const Cog6ToothIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.007 1.11-.9A15.143 15.143 0 0112 3c1.086 0 2.14.12 3.162.34c.55.108 1.02.458 1.11.972l.098.595a1.5 1.5 0 002.355 1.056l.42-.321a1.5 1.5 0 011.838.22l.527.527a1.5 1.5 0 01.22 1.838l-.322.42a1.5 1.5 0 001.056 2.355l.595.098c.542.09.972.56.972 1.11c.022 1.02.034 2.043.034 3.066c0 1.022-.012 2.046-.034 3.066c-.09.55-.458 1.02-.972 1.11l-.595.098a1.5 1.5 0 00-1.056 2.355l.322.42a1.5 1.5 0 01-.22 1.838l-.527.527a1.5 1.5 0 01-1.838-.22l-.42-.322a1.5 1.5 0 00-2.355 1.056l-.098.595c-.09.542-.56 1.007-1.11.972A15.143 15.143 0 0112 21c-1.086 0-2.14-.12-3.162-.34c-.55-.108-1.02-.458-1.11-.972l-.098-.595a1.5 1.5 0 00-2.355-1.056l-.42.321a1.5 1.5 0 01-1.838-.22l-.527-.527a1.5 1.5 0 01-.22-1.838l.322-.42a1.5 1.5 0 00-1.056-2.355l-.595-.098c-.542-.09-.972-.56-.972-1.11A16.096 16.096 0 013 12c0-1.022.012-2.046.034-3.066c.09-.55.458-1.02.972-1.11l.595-.098a1.5 1.5 0 001.056-2.355l-.322-.42a1.5 1.5 0 01.22-1.838l.527-.527a1.5 1.5 0 011.838.22l.42.322a1.5 1.5 0 002.355-1.056l.098-.595z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// Shopping Bag icon.
export const ShoppingBagIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.658-.463 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

// Magnifying Glass icon.
export const MagnifyingGlassIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

// Building Storefront icon.
export const BuildingStorefrontIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5A.75.75 0 0114.25 12h.75c.414 0 .75.336.75.75v7.5m-4.5 0v-7.5A.75.75 0 009.75 12h-.75a.75.75 0 00-.75.75v7.5m12-7.5a.75.75 0 00-.75-.75H5.25a.75.75 0 00-.75.75v7.5a.75.75 0 00.75.75h13.5a.75.75 0 00.75-.75v-7.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12V6a.75.75 0 01.75-.75h13.5A.75.75 0 0119.5 6v6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 12m15 0a2.25 2.25 0 01-2.25 2.25H6.75a2.25 2.25 0 01-2.25-2.25m15 0H4.5" />
    </svg>
);

// Check Circle icon. CORRECTED (Solid)
export const CheckCircleIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    </svg>
);

// X Circle icon. CORRECTED (Solid)
export const XCircleIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
    </svg>
);

// Information Circle icon. CORRECTED (Solid)
export const InformationCircleIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.25-1.5a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H11a.75.75 0 01-.75-.75v-.008zM10.378 15.9a.75.75 0 001.447.092l.042-.124a1.5 1.5 0 01.282-.642 1.5 1.5 0 00-.282-2.064l-.042-.062a.75.75 0 00-1.258.818l.01.018a.002.002 0 00.004.004l.014.022a.75.75 0 01-.144 1.06l-.01.008a.75.75 0 00.198 1.154l.042.025a.75.75 0 01.092.447l-.042.124a.75.75 0 00-.198.198z" clipRule="evenodd" />
    </svg>
);

// Ellipsis Vertical icon.
export const EllipsisVerticalIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
    </svg>
);

// Arrow Left on Rectangle icon.
export const ArrowLeftOnRectangleIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
);

// User Plus icon.
export const UserPlusIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
    </svg>
);

// Home icon.
export const HomeIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
    </svg>
);

// List Bullet icon.
export const ListBulletIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 17.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);


// --- CUSTOM DIETARY & ALLERGEN ICONS ---
// These are not from Heroicons and are created for this app specifically.

export const VeganIcon: React.FC<IconProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-green-600 dark:text-green-400"
    {...props}
  >
    <path d="M2 2l20 20" />
    <path d="M12 22a10 10 0 0010-10" />
    <path d="M12 12v10" />
    <path d="M14 14.25a2 2 0 100-4.5 2 2 0 000 4.5z" />
    <path d="M22 12a10 10 0 00-10-10" />
    <path d="M12 12H2" />
    <path d="M10 9.75a2 2 0 110-4.5 2 2 0 010 4.5z" />
  </svg>
);

export const GlutenFreeIcon: React.FC<IconProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-amber-600 dark:text-amber-400"
    {...props}
  >
    <path d="M2 2l20 20" />
    <path d="M10 14a2 2 0 11-4 0c0-1.84 2-4 2-4s2 2.16 2 4z" />
    <path d="M12 12c0-1.84 2-4 2-4s2 2.16 2 4a2 2 0 11-4 0z" />
    <path d="M22 12c-3 7-6.5 9-10 9s-7-2-10-9" />
  </svg>
);

export const LactoseFreeIcon: React.FC<IconProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M2 2l20 20" />
    <path d="M8.5 8.5c.78-2.22 2.34-4 4.5-4.8" />
    <path d="M12 12.5c0 .66-.17 1.28-.46 1.82" />
    <path d="M14.5 15.5c-1.28-1.28-2.5-3.5-2.5-5.5a5.98 5.98 0 00-4-5.5" />
    <path d="M12 21c-3.5 0-6-2.5-6-6 0-2.38 1.1-4.34 2.76-5.38" />
  </svg>
);

// --- Individual Allergen Icons ---
export const AllergenGlutenIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 12c-3 7-6.5 9-10 9s-7-2-10-9"/><path d="M12 12c0-1.84 2-4 2-4s2 2.16 2 4a2 2 0 11-4 0z"/><path d="M10 14a2 2 0 11-4 0c0-1.84 2-4 2-4s2 2.16 2 4z"/></svg>
);
export const AllergenDairyIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 21c-3.5 0-6-2.5-6-6 0-2.5 1-4.6 2.5-5.5C9.5 7.5 12 5 12 5s2.5 2.5 3.5 4.5c1.5 1 2.5 3 2.5 5.5 0 3.5-2.5 6-6 6zM12 5c0 3-3 5-3 5"/></svg>
);
export const AllergenPeanutIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 8c0-2-1.34-4-4-4S8 6 8 8s1.34 4 4 4 4-2 4-4z"/><path d="M12 12c-2-2-4.5-2-4.5-2-2.5 0-4.5 2-4.5 4.5s2 4.5 4.5 4.5c2.5 0 4.5-2 4.5-4.5"/><path d="M12 12c2 2 4.5 2 4.5 2 2.5 0 4.5-2 4.5-4.5S21.5 5 19 5c-2.5 0-4.5 2-4.5 4.5"/></svg>
);
export const AllergenTreeNutIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M11.83 15.17A2.5 2.5 0 0014 14.5h.5a3.5 3.5 0 000-7h-1a3.5 3.5 0 00-3.5 3.5V12a3.5 3.5 0 003.5 3.5h.33z"/><path d="M12 12v6"/><path d="M5.5 15.5a2.5 2.5 0 002.5-2.5V12a3.5 3.5 0 013.5-3.5h1a3.5 3.5 0 010 7h-.5a2.5 2.5 0 01-2.5-2.5z"/></svg>
);
export const AllergenSoyIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4 10c0-2.2 1.8-4 4-4s4 1.8 4 4c0 2.2-1.8 4-4 4-1.8 0-3.3-.8-3.9-2"/><path d="M13 14c0-2.2 1.8-4 4-4s4 1.8 4 4c0 2.2-1.8 4-4 4-1.8 0-3.3-.8-3.9-2"/><path d="M14 20c0-2.2 1.8-4 4-4s4 1.8 4 4c0 2.2-1.8 4-4 4-1.8 0-3.3-.8-3.9-2"/><path d="M4 18c0-2.2 1.8-4 4-4s4 1.8 4 4c0 2.2-1.8 4-4 4-1.8 0-3.3-.8-3.9-2"/></svg>
);
export const AllergenEggIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22c-5.5 0-10-4.5-10-10S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z"/><path d="M12 12c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z"/></svg>
);
export const AllergenFishIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 12.5c4.5-1.5 6-6.5 6-6.5s-4.5 1.5-6.5 0-3-4.5-3-4.5-1.5 4-3 4.5c-2 1.5-6.5 5-6.5 6.5s4.5 1.5 6.5 0c2-1.5 3 1.5 3 1.5s-1.5 3-3 1.5c-1.5-1.5-4.5-1-6.5 0s-1.5 6.5-1.5 6.5 4.5-1.5 6-6.5c1.5-5 3-1.5 3-1.5s1.5-3.5 3-1.5c1.5 2 0 6.5 0 6.5s-1.5 5 0 6.5c1.5 1.5 6.5 0 6.5-6.5s-5-4.5-6.5-6.5z"/></svg>
);
export const AllergenShellfishIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22c-5.5 0-10-4.5-10-10S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z"/><path d="M17 12c0-2.8-2.2-5-5-5s-5 2.2-5 5c0 2.8 2.2 5 5 5s5-2.2 5-5z"/><path d="M22 12c-1.7 0-3-1.3-3-3s1.3-3 3-3"/><path d="M2 12c1.7 0 3-1.3 3-3s-1.3-3-3-3"/></svg>
);