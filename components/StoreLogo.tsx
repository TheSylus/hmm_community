import React from 'react';
import { ShoppingBagIcon } from './Icons';

interface StoreLogoProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

// Mapping of common store names to their brand colors
const STORE_COLORS: Record<string, { bg: string; text: string; border?: string }> = {
  'lidl': { bg: 'bg-[#0050aa]', text: 'text-[#fff000]' }, // Blue/Yellow
  'aldi': { bg: 'bg-[#001e96]', text: 'text-white' }, // Dark Blue
  'rewe': { bg: 'bg-[#cc071e]', text: 'text-white' }, // Red
  'edeka': { bg: 'bg-[#f8e71c]', text: 'text-[#0058a6]' }, // Yellow/Blue
  'kaufland': { bg: 'bg-[#e2001a]', text: 'text-white' }, // Red
  'netto': { bg: 'bg-[#ffe700]', text: 'text-[#da291c]' }, // Yellow/Red
  'penny': { bg: 'bg-[#c8102e]', text: 'text-white' }, // Red
  'dm': { bg: 'bg-[#fff]', text: 'text-[#2e2e84]', border: 'border-[#2e2e84]' }, // White/Purple
  'rossmann': { bg: 'bg-[#c8102e]', text: 'text-white' }, // Red
  'norma': { bg: 'bg-[#00a2e0]', text: 'text-[#eb690b]' }, // Blue/Orange
  'globus': { bg: 'bg-[#0f8040]', text: 'text-white' }, // Green
  'tegut': { bg: 'bg-[#ea5b0c]', text: 'text-white' }, // Orange
  'hit': { bg: 'bg-[#e30613]', text: 'text-white' }, // Red
  'mueller': { bg: 'bg-[#fa6300]', text: 'text-white' }, // Orange
  'müller': { bg: 'bg-[#fa6300]', text: 'text-white' }, // Orange
  'whole foods': { bg: 'bg-[#00674b]', text: 'text-white' }, // Green
  'trader joe\'s': { bg: 'bg-[#c8102e]', text: 'text-white' }, // Red
  'target': { bg: 'bg-[#cc0000]', text: 'text-white' }, // Red
  'walmart': { bg: 'bg-[#0071ce]', text: 'text-[#ffc220]' }, // Blue/Yellow
  'costco': { bg: 'bg-[#e31837]', text: 'text-[#005da6]' }, // Red/Blue
};

// Simple hash function to get a consistent color for unknown stores
const getFallbackColor = (str: string) => {
  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500', 
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const StoreLogo: React.FC<StoreLogoProps> = ({ name, size = 'sm', showName = false, className = '' }) => {
  const normalizedName = name.toLowerCase().trim();
  
  // Check for known brand colors
  let style = STORE_COLORS[Object.keys(STORE_COLORS).find(key => normalizedName.includes(key)) || ''];
  
  // Fallback if not found
  const isKnown = !!style;
  const fallbackBg = getFallbackColor(normalizedName);
  
  const sizeClasses = {
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  };

  const containerBase = `flex items-center justify-center rounded-full font-bold shrink-0 shadow-sm ${sizeClasses[size]} ${className}`;
  const containerStyle = isKnown 
    ? `${style.bg} ${style.text} ${style.border ? `border ${style.border}` : ''}` 
    : `${fallbackBg} text-white`;

  const initials = name.substring(0, 2).toUpperCase();

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className={`${containerBase} ${containerStyle}`} title={name}>
        {initials}
      </div>
      {showName && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
          {name}
        </span>
      )}
    </div>
  );
};