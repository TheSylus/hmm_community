
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/index';
import { Receipt, ReceiptItem, FoodItem, GroceryCategory } from '../../types';
import { XMarkIcon, CheckCircleIcon, PlusCircleIcon, CategoryOtherIcon, CategoryProduceIcon, CategoryBakeryIcon, CategoryMeatIcon, CategoryDairyIcon, CategoryPantryIcon, CategoryFrozenIcon, CategorySnacksIcon, CategoryBeveragesIcon, CategoryHouseholdIcon, CategoryPersonalCareIcon, CategoryRestaurantIcon, CheckBadgeIcon } from '../Icons';

interface ReceiptToInventoryModalProps {
    receipt: Receipt;
    items: ReceiptItem[];
    onConfirm: (selectedItems: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>[]) => Promise<void>;
    onClose: () => void;
}

const CategoryIconMap: Record<GroceryCategory, React.FC<{ className?: string }>> = {
    'produce': CategoryProduceIcon,
    'bakery': CategoryBakeryIcon,
    'meat_fish': CategoryMeatIcon,
    'dairy_eggs': CategoryDairyIcon,
    'pantry': CategoryPantryIcon,
    'frozen': CategoryFrozenIcon,
    'snacks': CategorySnacksIcon,
    'beverages': CategoryBeveragesIcon,
    'household': CategoryHouseholdIcon,
    'personal_care': CategoryPersonalCareIcon,
    'restaurant_food': CategoryRestaurantIcon,
    'other': CategoryOtherIcon,
};

export const ReceiptToInventoryModal: React.FC<ReceiptToInventoryModalProps> = ({ receipt, items, onConfirm, onClose }) => {
    const { t } = useTranslation();
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [isSaving, setIsSaving] = useState(false);

    // Initial Selection Logic
    useEffect(() => {
        const initialSelection = new Set<number>();
        items.forEach((item, index) => {
            // Priority 1: Match from Shopping List (Entity already exists)
            // Priority 2: Exclude household/personal_care by default for inventory import
            if (item.food_item_id) {
                // If it's already matched, we don't NEED to import it as a new item,
                // but we might want to check it if the user wants to "refresh" it.
                // USUALLY: Match means it's tracked. New price is saved to history automatically by DB trigger or service.
            } else if (item.category !== 'household' && item.category !== 'personal_care') {
                initialSelection.add(index);
            }
        });
        setSelectedIndices(initialSelection);
    }, [items]);

    const toggleItem = (index: number) => {
        setSelectedIndices(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const toggleAll = () => {
        if (selectedIndices.size === items.length) {
            setSelectedIndices(new Set());
        } else {
            setSelectedIndices(new Set(items.map((_, i) => i)));
        }
    };

    const handleImport = async () => {
        setIsSaving(true);
        const foodItemsToCreate: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>[] = [];
        
        selectedIndices.forEach(index => {
            const rItem = items[index];
            foodItemsToCreate.push({
                name: rItem.raw_name,
                rating: 0,
                itemType: 'product',
                category: rItem.category,
                purchaseLocation: [receipt.merchant_name],
                isFamilyFavorite: false,
                price: rItem.price
            });
        });

        await onConfirm(foodItemsToCreate);
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-0 sm:p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-900 w-full h-full sm:h-[90vh] sm:max-w-2xl sm:rounded-xl shadow-2xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 pt-safe-top flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('modal.import.title')}</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('modal.import.description')}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex justify-between items-center px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                    <button onClick={toggleAll} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        {selectedIndices.size === items.length ? t('modal.import.deselectAll') : t('modal.import.selectAll')}
                    </button>
                    <span className="text-xs text-gray-400 font-mono">
                        {selectedIndices.size} / {items.length}
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {items.map((item, idx) => {
                        const isSelected = selectedIndices.has(idx);
                        const isAlreadyMatched = !!item.food_item_id;
                        const CatIcon = CategoryIconMap[item.category || 'other'];
                        
                        return (
                            <div 
                                key={idx} 
                                onClick={() => !isAlreadyMatched && toggleItem(idx)}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isAlreadyMatched ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50 opacity-80 cursor-default' : isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 cursor-pointer' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60 cursor-pointer'}`}
                            >
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${isAlreadyMatched ? 'bg-green-500 border-green-500' : isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-400 bg-transparent'}`}>
                                    {(isAlreadyMatched || isSelected) && <CheckCircleIcon className="w-4 h-4 text-white" />}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold truncate ${isSelected || isAlreadyMatched ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {item.raw_name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                            <CatIcon className="w-3 h-3" />
                                            <span>{t(`category.${item.category}`)}</span>
                                        </div>
                                        {isAlreadyMatched && (
                                            <span className="flex items-center gap-1 text-[10px] bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                <CheckBadgeIcon className="w-3 h-3" /> Verknüpft
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right">
                                    <span className="block text-sm font-mono text-gray-600 dark:text-gray-300">
                                        {item.price.toFixed(2)}€
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pb-safe-bottom flex gap-3">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors"
                    >
                        {t('modal.import.button.skip')}
                    </button>
                    <button 
                        onClick={handleImport}
                        disabled={(selectedIndices.size === 0 && !items.some(i => i.food_item_id)) || isSaving}
                        className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-transform active:scale-95 disabled:bg-indigo-400 flex items-center justify-center gap-2"
                    >
                        {isSaving ? "Importing..." : t('modal.import.button.add', { count: selectedIndices.size })}
                    </button>
                </div>
            </div>
        </div>
    );
};
