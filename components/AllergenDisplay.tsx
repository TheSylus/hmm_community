import React from 'react';
import { useTranslation } from '../i18n/index';
import {
  AllergenGlutenIcon, AllergenDairyIcon, AllergenPeanutIcon, AllergenTreeNutIcon, AllergenSoyIcon, AllergenEggIcon, AllergenFishIcon, AllergenShellfishIcon
} from './Icons';

interface AllergenDisplayProps {
  allergens: string[];
}

interface AllergenMap {
  keywords: string[];
  Icon: React.FC<{ className?: string }>;
  tooltipKey: string;
}

const allergenMap: AllergenMap[] = [
  { keywords: ['gluten', 'wheat', 'barley', 'rye', 'weizen', 'gerste', 'roggen'], Icon: AllergenGlutenIcon, tooltipKey: 'allergen.gluten' },
  { keywords: ['milk', 'dairy', 'lactose', 'casein', 'whey', 'milch', 'laktose', 'molke'], Icon: AllergenDairyIcon, tooltipKey: 'allergen.dairy' },
  { keywords: ['peanut', 'peanuts', 'erdnuss', 'erdnüsse'], Icon: AllergenPeanutIcon, tooltipKey: 'allergen.peanuts' },
  { keywords: ['tree nut', 'nuts', 'almond', 'walnut', 'cashew', 'pecan', 'schalenfrüchte', 'nüsse', 'mandel', 'walnuss'], Icon: AllergenTreeNutIcon, tooltipKey: 'allergen.tree_nuts' },
  { keywords: ['soy', 'soya', 'soja'], Icon: AllergenSoyIcon, tooltipKey: 'allergen.soy' },
  { keywords: ['egg', 'eggs', 'ei', 'eier'], Icon: AllergenEggIcon, tooltipKey: 'allergen.eggs' },
  { keywords: ['fish', 'fisch'], Icon: AllergenFishIcon, tooltipKey: 'allergen.fish' },
  { keywords: ['shellfish', 'crustacean', 'mollusc', 'schalentiere', 'krebstiere', 'weichtiere'], Icon: AllergenShellfishIcon, tooltipKey: 'allergen.shellfish' },
];

export const AllergenDisplay: React.FC<AllergenDisplayProps> = ({ allergens }) => {
    const { t } = useTranslation();

    const getIconFor = (allergen: string) => {
        const lowerAllergen = allergen.toLowerCase();
        return allergenMap.find(item => item.keywords.some(kw => lowerAllergen.includes(kw)));
    };

    const renderedIcons = new Set<string>();

    allergens.forEach(allergen => {
        const mapping = getIconFor(allergen);
        if (mapping && !renderedIcons.has(mapping.tooltipKey)) {
            renderedIcons.add(mapping.tooltipKey);
        }
    });

    if (renderedIcons.size === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {Array.from(renderedIcons).map(tooltipKey => {
                const mapping = allergenMap.find(m => m.tooltipKey === tooltipKey);
                if (!mapping) return null;
                const { Icon } = mapping;
                return (
                    <div key={tooltipKey} className="relative group">
                        <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {t(tooltipKey)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};