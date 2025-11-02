import React from 'react';

// Define the type for props that all icons will accept.
// This includes standard SVG attributes like className, onClick, etc.
type IconProps = React.SVGProps<SVGSVGElement>;

// A specific type for icons that can be toggled between filled and outline states.
type ToggleIconProps = IconProps & {
  filled?: boolean;
};

// Each icon is now a standard function component. This is the modern
// recommended approach and avoids potential issues with React.FC.

export const StarIcon = ({ filled = false, ...props }: ToggleIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={1.5}
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-3.356a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
    />
  </svg>
);
  
export const SparklesIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 019.75 22.5a.75.75 0 01-.75-.75v-4.131A15.838 15.838 0 016.382 15H2.25a.75.75 0 01-.75-.75 6.75 6.75 0 017.815-6.666zM15 6.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" clipRule="evenodd" />
    </svg>
);

export const CameraIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008v-.008z" />
    </svg>
);

export const PlusCircleIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z" clipRule="evenodd" />
    </svg>
);

export const XMarkIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
    </svg>
);

export const DocumentTextIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M5.625 1.5H9a2.25 2.25 0 012.25 2.25v1.875c0 .021.002.042.005.062H12a2.25 2.25 0 012.25 2.25v1.875c0 .021.002.042.005.062H15a2.25 2.25 0 012.25 2.25v2.625c0 1.242-.998 2.25-2.25 2.25H5.625a2.25 2.25 0 01-2.25-2.25V3.75A2.25 2.25 0 015.625 1.5zM10.5 12a.75.75 0 00-1.5 0v.09L7.624 9.11a.75.75 0 00-1.248 0L4.5 12.091V15a.75.75 0 001.5 0v-1.586l1.248-1.249 1.375 1.375.5.5V15a.75.75 0 001.5 0v-3zm3.75-3a.75.75 0 00-1.5 0v.09L11.374 6.11a.75.75 0 00-1.248 0L8.25 9.091V12a.75.75 0 001.5 0V9.586l1.248-1.249 1.375 1.375.5.5V12a.75.75 0 001.5 0V9z" clipRule="evenodd" />
    </svg>
);

export const LactoseFreeIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm.097 4.903a.75.75 0 00-.866.519l-1.72 4.127-1.31-.926a.75.75 0 00-.923.33l-1.42 2.522a.75.75 0 101.298.732l.74-1.316 1.635 1.156a.75.75 0 00.922-.33l4.5-8.25a.75.75 0 00-.518-.866z" clipRule="evenodd" />
    </svg>
);
export const VeganIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M15.04 4.72a.75.75 0 01.122 1.054l-3.64 5.945 2.47-1.482a.75.75 0 01.815 1.222l-4.122 2.473 3.64-5.945a.75.75 0 011.054-.122zM8.96 19.28a.75.75 0 00-.122-1.054l3.64-5.945-2.47 1.482a.75.75 0 10-.815-1.222l4.122-2.473-3.64 5.945a.75.75 0 00-1.054.122z" clipRule="evenodd" />
        <path d="M11.66 3.132a.75.75 0 01.628 1.149l-8.25 4.5a.75.75 0 01-.628-1.149l8.25-4.5z" />
    </svg>
);
export const GlutenFreeIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M11.104 4.455a.75.75 0 11.237 1.03l-3.25 7.5a.75.75 0 01-1.272.01l-2.25-4.5a.75.75 0 011.272-.638l1.62 3.24 2.643-6.132z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M15.104 12.455a.75.75 0 11.237 1.03l-3.25 7.5a.75.75 0 01-1.272.01l-2.25-4.5a.75.75 0 011.272-.638l1.62 3.24 2.643-6.132z" clipRule="evenodd" />
    </svg>
);

export const BarcodeIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M1.5 4.5h21v15H1.5v-15zM3 6v12h1.5V6H3zm3 0v12h1.5V6H6zm3 0v12h1.5V6H9zm3 0v12h1.5V6h-1.5zm3 0v12H18V6h-3zm3 0v12h1.5V6H18z" />
    </svg>
);

export const MicrophoneIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5a6 6 0 00-12 0v1.5a6 6 0 006 6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12a7.5 7.5 0 11-15 0" />
    </svg>
);

export const SpinnerIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const MapPinIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.274 1.765 11.842 11.842 0 00.757.433.57.57 0 00.281.14l.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
    </svg>
);

export const TrashIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.109a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.347-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.498.058l.347-9z" clipRule="evenodd" />
    </svg>
);

export const PencilIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);
export const ShareIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z" clipRule="evenodd" />
    </svg>
);
export const ShoppingBagIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 011.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.5 0V5.507a.25.25 0 00-.25-.25H6.57a.25.25 0 00-.25.25V21a.75.75 0 01-1.5 0V5.507c0-1.47 1.073-2.756 2.57-2.93zM9 10.5a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5A.75.75 0 019 10.5z" clipRule="evenodd" />
    </svg>
);
export const BuildingStorefrontIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5A2.25 2.25 0 0011.25 11.25H4.5A2.25 2.25 0 002.25 13.5V21M6 4.5h12M6 4.5v-1.5A2.25 2.25 0 018.25 0h7.5A2.25 2.25 0 0118 2.25V4.5m0 0v1.5A2.25 2.25 0 0115.75 8.25H8.25A2.25 2.25 0 016 6.75V4.5M3.75 21h16.5" />
    </svg>
);
export const GlobeAltIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM8.25 8.63c0-.414.336-.75.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zM8.25 11.13c0-.414.336-.75.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75z" clipRule="evenodd" />
    </svg>
);
export const LockClosedIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zm-3.75 5.25v3a.75.75 0 001.5 0v-3a3.75 3.75 0 117.5 0v3a.75.75 0 001.5 0v-3A5.25 5.25 0 0012 1.5a5.25 5.25 0 00-3.75 5.25z" clipRule="evenodd" />
    </svg>
);
export const HeartIcon = ({ filled, ...props }: ToggleIconProps) => {
    if (filled) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
                <path d="M11.645 20.91l-1.06-1.06C5.4 15.365 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.865-8.585 11.35l-1.06 1.06z" />
            </svg>
        );
    }
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
    );
};
export const ChatBubbleOvalLeftIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM8.25 8.63c0-.414.336-.75.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zM8.25 11.13c0-.414.336-.75.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75z" clipRule="evenodd" />
    </svg>
);

export const AllergenGlutenIcon = (props: IconProps) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-2 6l-2 4h8l-2-4zm0 6l2 4 2-4z" /></svg>);
export const AllergenDairyIcon = (props: IconProps) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a3 3 0 013 3H9a3 3 0 013-3zm-3.5 8a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm7 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" /></svg>);
export const AllergenPeanutIcon = (props: IconProps) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-2 5a2 2 0 114 0 2 2 0 01-4 0zm0 6a2 2 0 114 0v3a2 2 0 11-4 0v-3z" /></svg>);
export const AllergenTreeNutIcon = (props: IconProps) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 2a10 10 0 100 20 10 10 0 000-20zM12 6l-4 6h8z" /></svg>);
export const AllergenSoyIcon = (props: IconProps) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 2a10 10 0 100 20 10 10 0 000-20zM10 8a2 2 0 114 0 2 2 0 01-4 0zm-2 6h8a2 2 0 01-2 2h-4a2 2 0 01-2-2z" /></svg>);
export const AllergenEggIcon = (props: IconProps) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a4 4 0 014 4c0 2.2-1.8 4-4 4s-4-1.8-4-4a4 4 0 014-4z" /></svg>);
export const AllergenFishIcon = (props: IconProps) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 5c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm0 2a1 1 0 110 2 1 1 0 010-2z" /></svg>);
export const AllergenShellfishIcon = (props: IconProps) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-4 7l4 4 4-4H8zm0 4v2h8v-2H8z" /></svg>);

export const ChevronDownIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z" clipRule="evenodd" />
    </svg>
);

export const UserCircleIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
    </svg>
);

export const CheckCircleIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    </svg>
);

export const CheckIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

export const EllipsisVerticalIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M4.5 12a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm6 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm6 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" clipRule="evenodd" />
    </svg>
);

export const UserPlusIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
    </svg>
);

export const HomeIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
    </svg>
);

export const ListBulletIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zM3 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
    </svg>
);

export const Cog6ToothIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.003 1.11-1.226.554-.223 1.197-.223 1.75 0 .55.223 1.02.684 1.11 1.226M9.594 20.06c.09.542.56 1.003 1.11 1.226.554-.223 1.197-.223 1.75 0 .55.223 1.02.684 1.11 1.226M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.42-2.368-1.116-3.244m-1.116-3.244a5.25 5.25 0 01-3.244-1.116m0 0 0 0v.001M12 19.5c1.232 0 2.368-.42 3.244-1.116m3.244-1.116a5.25 5.25 0 011.116-3.244m0 0 0 0h.001M4.5 12c0 1.232.42 2.368 1.116 3.244m1.116 3.244a5.25 5.25 0 013.244 1.116m0 0 0 0v-.001M12 4.5c-1.232 0-2.368.42-3.244 1.116M4.5 12l.001.001" />
    </svg>
);

export const BookmarkSquareIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M3 3a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 3v18a.75.75 0 01-1.28.53l-6.22-6.22a.75.75 0 00-1.06 0l-6.22 6.22A.75.75 0 013 21V3zm4.5 3.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75z" clipRule="evenodd" />
    </svg>
);