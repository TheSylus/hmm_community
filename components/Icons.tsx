import React from 'react';

// FIX: Create a valid Icons.tsx module exporting all required icon components.

interface IconProps extends React.SVGProps<SVGSVGElement> {
  filled?: boolean;
}

const createIcon = (path: React.ReactNode): React.FC<IconProps> => {
  return ({ className, ...props }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      {path}
    </svg>
  );
};

export const StarIcon: React.FC<IconProps> = ({ filled = false, className, ...props }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
      className={className}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-3.356a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
);
  
export const SparklesIcon = createIcon(
    <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 019.75 22.5a.75.75 0 01-.75-.75v-4.131A15.838 15.838 0 016.382 15H2.25a.75.75 0 01-.75-.75 6.75 6.75 0 017.815-6.666zM15 6.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" clipRule="evenodd" />
);

export const CameraIcon = createIcon(
    <path d="M12 20a8 8 0 100-16 8 8 0 000 16z" /><path d="M12 14a4 4 0 100-8 4 4 0 000 8z" /><path d="M12 15c-2.76 0-5 1.12-5 2.5.0 1.38 2.24 2.5 5 2.5s5-1.12 5-2.5c0-1.38-2.24-2.5-5-2.5z" />
);

export const PlusCircleIcon = createIcon(
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z" clipRule="evenodd" />
);

export const XMarkIcon = createIcon(
    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
);

export const DocumentTextIcon = createIcon(
    <path fillRule="evenodd" d="M5.625 1.5H9a2.25 2.25 0 012.25 2.25v1.875c0 .021.002.042.005.062H12a2.25 2.25 0 012.25 2.25v1.875c0 .021.002.042.005.062H15a2.25 2.25 0 012.25 2.25v2.625c0 1.242-.998 2.25-2.25 2.25H5.625a2.25 2.25 0 01-2.25-2.25V3.75A2.25 2.25 0 015.625 1.5zM10.5 12a.75.75 0 00-1.5 0v.09L7.624 9.11a.75.75 0 00-1.248 0L4.5 12.091V15a.75.75 0 001.5 0v-1.586l1.248-1.249 1.375 1.375.5.5V15a.75.75 0 001.5 0v-3zm3.75-3a.75.75 0 00-1.5 0v.09L11.374 6.11a.75.75 0 00-1.248 0L8.25 9.091V12a.75.75 0 001.5 0V9.586l1.248-1.249 1.375 1.375.5.5V12a.75.75 0 001.5 0V9z" clipRule="evenodd" />
);

export const LactoseFreeIcon = createIcon(
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm.097 4.903a.75.75 0 00-.866.519l-1.72 4.127-1.31-.926a.75.75 0 00-.923.33l-1.42 2.522a.75.75 0 101.298.732l.74-1.316 1.635 1.156a.75.75 0 00.922-.33l4.5-8.25a.75.75 0 00-.518-.866z" clipRule="evenodd" />
);
export const VeganIcon = createIcon(
    <path fillRule="evenodd" d="M15.04 4.72a.75.75 0 01.122 1.054l-3.64 5.945 2.47-1.482a.75.75 0 01.815 1.222l-4.122 2.473 3.64-5.945a.75.75 0 011.054-.122zM8.96 19.28a.75.75 0 00-.122-1.054l3.64-5.945-2.47 1.482a.75.75 0 10-.815-1.222l4.122-2.473-3.64 5.945a.75.75 0 00-1.054.122z" clipRule="evenodd" /><path d="M11.66 3.132a.75.75 0 01.628 1.149l-8.25 4.5a.75.75 0 01-.628-1.149l8.25-4.5z" />
);
export const GlutenFreeIcon = createIcon(
    <path fillRule="evenodd" d="M11.104 4.455a.75.75 0 11.237 1.03l-3.25 7.5a.75.75 0 01-1.272.01l-2.25-4.5a.75.75 0 011.272-.638l1.62 3.24 2.643-6.132z" clipRule="evenodd" /><path fillRule="evenodd" d="M15.104 12.455a.75.75 0 11.237 1.03l-3.25 7.5a.75.75 0 01-1.272.01l-2.25-4.5a.75.75 0 011.272-.638l1.62 3.24 2.643-6.132z" clipRule="evenodd" />
);

export const BarcodeIcon = createIcon(
    <path d="M1.5 4.5h21v15H1.5v-15zM3 6v12h1.5V6H3zm3 0v12h1.5V6H6zm3 0v12h1.5V6H9zm3 0v12h1.5V6h-1.5zm3 0v12H18V6h-3zm3 0v12h1.5V6H18z" />
);

export const MicrophoneIcon = createIcon(
    <path d="M12 18.75a6 6 0 006-6v-1.5a6 6 0 00-12 0v1.5a6 6 0 006 6z" /><path d="M12 18.75a8.25 8.25 0 01-8.25-8.25V7.5a8.25 8.25 0 0116.5 0v3A8.25 8.25 0 0112 18.75zM12 5.25a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75z" />
);

export const SpinnerIcon = createIcon(
    <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
);

export const MapPinIcon = createIcon(
    <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.274 1.765 11.842 11.842 0 00.757.433.57.57 0 00.281.14l.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
);

export const TrashIcon = createIcon(
    <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.109a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.347-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.498.058l.347-9z" clipRule="evenodd" />
);

export const PencilIcon = createIcon(
    <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
);
export const ShareIcon = createIcon(
    <path fillRule="evenodd" d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z" clipRule="evenodd" />
);
export const ShoppingBagIcon = createIcon(
    <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.5 0V5.507a.25.25 0 00-.25-.25H6.57a.25.25 0 00-.25.25V21a.75.75 0 01-1.5 0V5.507c0-1.47 1.073-2.756 2.57-2.93zM9 10.5a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5A.75.75 0 019 10.5z" clipRule="evenodd" />
);
export const BuildingStorefrontIcon = createIcon(
    <path d="M12 21.75c2.422 0 4.68-.624 6.534-1.702.743-.42 1.096-1.284.84-2.074l-.454-1.42a1.5 1.5 0 00-1.424-1.054h-1.63L15.25 4.5h.375a.75.75 0 000-1.5H8.375a.75.75 0 000 1.5h.375l-.64 10.998h-1.631a1.5 1.5 0 00-1.424 1.054l-.454 1.42a1.5 1.5 0 00.84 2.074C7.32 21.126 9.578 21.75 12 21.75z" />
);
export const GlobeAltIcon = createIcon(
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM8.25 8.63c0-.414.336-.75.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zM8.25 11.13c0-.414.336-.75.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75z" clipRule="evenodd" />
);
export const LockClosedIcon = createIcon(
    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zm-3.75 5.25v3a.75.75 0 001.5 0v-3a3.75 3.75 0 117.5 0v3a.75.75 0 001.5 0v-3A5.25 5.25 0 0012 1.5a5.25 5.25 0 00-3.75 5.25z" clipRule="evenodd" />
);
export const HeartIcon: React.FC<IconProps> = ({ filled, ...props }) => {
    if (filled) {
        return createIcon(
            <path d="M11.645 20.91l-1.06-1.06C5.4 15.365 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.865-8.585 11.35l-1.06 1.06z" />
        )(props);
    }
    return createIcon(
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    )({ ...props, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 });
};
export const ChatBubbleOvalLeftIcon = createIcon(
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM8.25 8.63c0-.414.336-.75.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zM8.25 11.13c0-.414.336-.75.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75z" clipRule="evenodd" />
);

export const AllergenGlutenIcon = createIcon(<path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-2 6l-2 4h8l-2-4zm0 6l2 4 2-4z" />);
export const AllergenDairyIcon = createIcon(<path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a3 3 0 013 3H9a3 3 0 013-3zm-3.5 8a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm7 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />);
export const AllergenPeanutIcon = createIcon(<path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-2 5a2 2 0 114 0 2 2 0 01-4 0zm0 6a2 2 0 114 0v3a2 2 0 11-4 0v-3z" />);
export const AllergenTreeNutIcon = createIcon(<path d="M12 2a10 10 0 100 20 10 10 0 000-20zM12 6l-4 6h8z" />);
export const AllergenSoyIcon = createIcon(<path d="M12 2a10 10 0 100 20 10 10 0 000-20zM10 8a2 2 0 114 0 2 2 0 01-4 0zm-2 6h8a2 2 0 01-2 2h-4a2 2 0 01-2-2z" />);
export const AllergenEggIcon = createIcon(<path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a4 4 0 014 4c0 2.2-1.8 4-4 4s-4-1.8-4-4a4 4 0 014-4z" />);
export const AllergenFishIcon = createIcon(<path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 5c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm0 2a1 1 0 110 2 1 1 0 010-2z" />);
export const AllergenShellfishIcon = createIcon(<path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-4 7l4 4 4-4H8zm0 4v2h8v-2H8z" />);

export const ChevronDownIcon = createIcon(<path fillRule="evenodd" d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z" clipRule="evenodd" />);

export const UserCircleIcon = createIcon(<path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />);

export const CheckCircleIcon = createIcon(<path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />);

export const EllipsisVerticalIcon = createIcon(<path fillRule="evenodd" d="M4.5 12a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm6 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm6 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" clipRule="evenodd" />);

export const UserPlusIcon = createIcon(<path d="M12.75 4.5a3.75 3.75 0 00-7.5 0v.75h7.5v-.75z" /><path fillRule="evenodd" d="M12 7.5a1.5 1.5 0 01.75.25A5.965 5.965 0 0117.25 12v.75a.75.75 0 01-1.5 0v-.75a4.5 4.5 0 00-9 0v.75a.75.75 0 01-1.5 0v-.75A5.965 5.965 0 0111.25 7.75a1.5 1.5 0 01.75-.25z" clipRule="evenodd" />);