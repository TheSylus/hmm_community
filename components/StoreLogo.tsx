import React, { useState, useEffect } from 'react';

interface StoreLogoProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

// Domain mapping for logo fetching.
// Maps common store names to their likely domain to fetch logos via API.
const STORE_DOMAINS: Record<string, string> = {
  'lidl': 'lidl.com',
  'aldi süd': 'aldi-sued.de',
  'aldi sued': 'aldi-sued.de',
  'aldi nord': 'aldi-nord.de',
  'aldi': 'aldi.com', 
  'rewe': 'rewe.de',
  'edeka': 'edeka.de',
  'kaufland': 'kaufland.com',
  'netto marken-discount': 'netto-online.de',
  'netto scottie': 'netto.de',
  'netto': 'netto-online.de', // Defaulting to the red/yellow Netto
  'penny': 'penny.de',
  'dm': 'dm.de',
  'rossmann': 'rossmann.de',
  'norma': 'norma-online.de',
  'globus': 'globus.de',
  'tegut': 'tegut.com',
  'hit': 'hit.de',
  'mueller': 'mueller.de',
  'müller': 'mueller.de',
  'famila': 'famila-nordost.de',
  'action': 'action.com',
  'denn\'s': 'denns-biomarkt.de',
  'denns': 'denns-biomarkt.de',
  'alnatura': 'alnatura.de',
  'bio company': 'biocompany.de',
  'budni': 'budni.de',
  'douglas': 'douglas.de',
  'metro': 'metro.de',
  'real': 'meinreal.de',
  'target': 'target.com',
  'walmart': 'walmart.com',
  'costco': 'costco.com',
  'whole foods': 'wholefoodsmarket.com',
  'trader joe\'s': 'traderjoes.com',
  'spar': 'spar.at',
  'billa': 'billa.at',
  'hofer': 'hofer.at',
  'migros': 'migros.ch',
  'coop': 'coop.ch',
  'denner': 'denner.ch',
  'volg': 'volg.ch',
  'ikea': 'ikea.com',
  'decathlon': 'decathlon.de',
  'bauhaus': 'bauhaus.info',
  'obi': 'obi.de',
  'hornbach': 'hornbach.de',
};

// Fallback colors if logo fails or isn't found
const STORE_COLORS: Record<string, { bg: string; text: string; border?: string }> = {
  'lidl': { bg: 'bg-[#0050aa]', text: 'text-[#fff000]' },
  'aldi': { bg: 'bg-[#001e96]', text: 'text-white' },
  'rewe': { bg: 'bg-[#cc071e]', text: 'text-white' },
  'edeka': { bg: 'bg-[#f8e71c]', text: 'text-[#0058a6]' },
  'kaufland': { bg: 'bg-[#e2001a]', text: 'text-white' },
  'netto': { bg: 'bg-[#ffe700]', text: 'text-[#da291c]' },
  'penny': { bg: 'bg-[#c8102e]', text: 'text-white' },
  'dm': { bg: 'bg-[#fff]', text: 'text-[#2e2e84]', border: 'border-[#2e2e84]' },
  'rossmann': { bg: 'bg-[#c8102e]', text: 'text-white' },
  'norma': { bg: 'bg-[#00a2e0]', text: 'text-[#eb690b]' },
  'globus': { bg: 'bg-[#0f8040]', text: 'text-white' },
  'tegut': { bg: 'bg-[#ea5b0c]', text: 'text-white' },
  'hit': { bg: 'bg-[#e30613]', text: 'text-white' },
  'mueller': { bg: 'bg-[#fa6300]', text: 'text-white' },
  'müller': { bg: 'bg-[#fa6300]', text: 'text-white' },
  'whole foods': { bg: 'bg-[#00674b]', text: 'text-white' },
  'trader joe\'s': { bg: 'bg-[#c8102e]', text: 'text-white' },
  'target': { bg: 'bg-[#cc0000]', text: 'text-white' },
  'walmart': { bg: 'bg-[#0071ce]', text: 'text-[#ffc220]' },
  'costco': { bg: 'bg-[#e31837]', text: 'text-[#005da6]' },
};

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

// Sub-component to handle image loading state with key-based reset
const StoreLogoImage: React.FC<{
  domain: string;
  name: string;
  containerBase: string;
  fallbackStyle: string;
  initials: string;
}> = ({ domain, name, containerBase, fallbackStyle, initials }) => {
  const [imgSource, setImgSource] = useState<string>(`https://logo.clearbit.com/${domain}?size=128`);
  const [isFallback, setIsFallback] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleImgError = () => {
    if (imgSource.includes('clearbit')) {
        // If Clearbit failed, try Google Favicon as backup
        setIsFallback(true);
        setImgSource(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
    } else {
        // If Google also fails, give up
        setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div className={`${containerBase} ${fallbackStyle}`} title={name}>
        {initials}
      </div>
    );
  }

  return (
    <div className={`${containerBase} border border-gray-200 dark:border-gray-600 bg-white`} title={name}>
      <img 
        src={imgSource} 
        alt={name} 
        className={`w-full h-full object-contain ${isFallback ? 'scale-75' : ''}`} 
        onError={handleImgError}
        loading="lazy"
      />
    </div>
  );
};

export const StoreLogo: React.FC<StoreLogoProps> = ({ name, size = 'sm', showName = false, className = '' }) => {
  const normalizedName = name.toLowerCase().trim();
  
  // 1. Identify Domain by finding the longest matching key
  const domainKey = Object.keys(STORE_DOMAINS)
    .sort((a, b) => b.length - a.length)
    .find(key => normalizedName.includes(key));
    
  const domain = domainKey ? STORE_DOMAINS[domainKey] : null;
  
  // Fallback styling logic
  const style = STORE_COLORS[Object.keys(STORE_COLORS).find(key => normalizedName.includes(key)) || ''];
  const isKnownColor = !!style;
  const fallbackBg = getFallbackColor(normalizedName);

  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-12 h-12 text-sm',
  };
  
  const containerBase = `flex items-center justify-center rounded-full font-bold shrink-0 shadow-sm overflow-hidden bg-white relative ${sizeClasses[size]}`;
  
  const fallbackStyle = isKnownColor 
    ? `${style.bg} ${style.text} ${style.border ? `border ${style.border}` : ''}` 
    : `${fallbackBg} text-white`;

  const initials = name.substring(0, 2).toUpperCase();

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {domain ? (
        <StoreLogoImage 
          key={domain} // Reset state when domain changes
          domain={domain}
          name={name}
          containerBase={containerBase}
          fallbackStyle={fallbackStyle}
          initials={initials}
        />
      ) : (
        <div className={`${containerBase} ${fallbackStyle}`} title={name}>
          {initials}
        </div>
      )}
      
      {showName && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
          {name}
        </span>
      )}
    </div>
  );
};
