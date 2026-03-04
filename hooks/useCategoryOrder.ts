import { useState, useEffect } from 'react';
import { GroceryCategory } from '../types';

export const DEFAULT_CATEGORY_ORDER: GroceryCategory[] = [
    'produce', 'bakery', 'meat_fish', 'dairy_eggs', 'pantry', 'snacks', 'beverages', 'frozen', 'household', 'personal_care', 'restaurant_food', 'other'
];

export function useCategoryOrder() {
    const [categoryOrder, setCategoryOrderState] = useState<GroceryCategory[]>(() => {
        const saved = localStorage.getItem('categoryOrder');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Ensure 'other' is always at the end or present
                if (!parsed.includes('other')) {
                    parsed.push('other');
                }
                return parsed;
            } catch {
                return DEFAULT_CATEGORY_ORDER;
            }
        }
        return DEFAULT_CATEGORY_ORDER;
    });

    const setCategoryOrder = (newOrder: GroceryCategory[]) => {
        setCategoryOrderState(newOrder);
        localStorage.setItem('categoryOrder', JSON.stringify(newOrder));
        // Dispatch a custom event so other components can update
        window.dispatchEvent(new Event('categoryOrderChanged'));
    };

    useEffect(() => {
        const handleStorageChange = () => {
            const saved = localStorage.getItem('categoryOrder');
            if (saved) {
                try {
                    setCategoryOrderState(JSON.parse(saved));
                } catch {
                    // ignore
                }
            }
        };

        window.addEventListener('categoryOrderChanged', handleStorageChange);
        return () => {
            window.removeEventListener('categoryOrderChanged', handleStorageChange);
        };
    }, []);

    return { categoryOrder, setCategoryOrder };
}
