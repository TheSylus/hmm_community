// FIX: Implemented a skeleton for the ShoppingMode component to resolve module errors.
import React from 'react';
import { HydratedShoppingListItem } from '../types';
import { useTranslation } from '../i18n';

interface ShoppingModeProps {
    listName: string;
    items: HydratedShoppingListItem[];
    onClose: () => void;
    onItemToggle: (itemId: string, checked: boolean) => void;
}

export const ShoppingMode: React.FC<ShoppingModeProps> = ({ listName, items, onClose, onItemToggle }) => {
    const { t } = useTranslation();
    return (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 p-4">
            <h1 className="text-2xl font-bold mb-4">{listName}</h1>
            <p>{items.length} items on the list.</p>
            <button onClick={onClose} className="mt-4 p-2 bg-gray-200 rounded">Close</button>
        </div>
    );
};
