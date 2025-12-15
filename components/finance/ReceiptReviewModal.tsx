
import React, { useState } from 'react';
import { Receipt, ReceiptItem, GroceryCategory } from '../../types';
import { XMarkIcon, SpinnerIcon, CategoryProduceIcon, CategoryBakeryIcon, CategoryMeatIcon, CategoryDairyIcon, CategoryPantryIcon, CategoryFrozenIcon, CategorySnacksIcon, CategoryBeveragesIcon, CategoryHouseholdIcon, CategoryPersonalCareIcon, CategoryOtherIcon, CategoryRestaurantIcon, CheckCircleIcon, TrashIcon, PlusCircleIcon } from '../Icons';
import { useTranslation } from '../../i18n/index';

interface ReceiptReviewModalProps {
    receiptData: Partial<Receipt> & { items: Partial<ReceiptItem>[] };
    onSave: (data: Partial<Receipt> & { items: Partial<ReceiptItem>[] }) => Promise<void>;
    onClose: () => void;
    isLoading?: boolean;
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

const CATEGORIES: GroceryCategory[] = ['produce', 'bakery', 'meat_fish', 'dairy_eggs', 'pantry', 'frozen', 'snacks', 'beverages', 'household', 'personal_care', 'other'];

export const ReceiptReviewModal: React.FC<ReceiptReviewModalProps> = ({ receiptData, onSave, onClose, isLoading }) => {
    const { t } = useTranslation();
    const [data, setData] = useState(receiptData);
    const [isSaving, setIsSaving] = useState(false);

    // Header Updates
    const updateHeader = (key: keyof Receipt, value: any) => {
        setData(prev => ({ ...prev, [key]: value }));
    };

    // Item Updates
    const updateItem = (index: number, field: keyof ReceiptItem, value: any) => {
        const newItems = [...(data.items || [])];
        newItems[index] = { ...newItems[index], [field]: value };
        // Recalculate total if price/qty changes
        if (field === 'price' || field === 'quantity') {
            const p = field === 'price' ? parseFloat(value) || 0 : newItems[index].price || 0;
            const q = field === 'quantity' ? parseFloat(value) || 1 : newItems[index].quantity || 1;
            newItems[index].total_price = p * q;
        }
        
        // Update header total if items change
        const newTotal = newItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
        setData(prev => ({ ...prev, items: newItems, total_amount: parseFloat(newTotal.toFixed(2)) }));
    };

    const deleteItem = (index: number) => {
        const newItems = [...(data.items || [])];
        newItems.splice(index, 1);
        const newTotal = newItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
        setData(prev => ({ ...prev, items: newItems, total_amount: parseFloat(newTotal.toFixed(2)) }));
    };

    const addItem = () => {
        const newItem: Partial<ReceiptItem> = {
            raw_name: '',
            price: 0,
            quantity: 1,
            category: 'other'
        };
        setData(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
    };

    const handleSave = async () => {
        if (!data.merchant_name || !data.total_amount) {
            alert("Merchant and Total are required.");
            return;
        }
        setIsSaving(true);
        await onSave(data);
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-0 sm:p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-900 w-full h-full sm:h-[90vh] sm:max-w-2xl sm:rounded-xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 pt-safe-top">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Beleg prüfen</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Meta Data Card */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/30 grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase mb-1">Geschäft</label>
                            <input 
                                type="text" 
                                value={data.merchant_name || ''} 
                                onChange={(e) => updateHeader('merchant_name', e.target.value)}
                                className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg p-2 text-lg font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase mb-1">Datum</label>
                            <input 
                                type="date" 
                                value={data.date?.split('T')[0] || ''} 
                                onChange={(e) => updateHeader('date', e.target.value)}
                                className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase mb-1">Gesamt ({data.currency})</label>
                            <input 
                                type="number" 
                                step="0.01"
                                value={data.total_amount || ''} 
                                onChange={(e) => updateHeader('total_amount', parseFloat(e.target.value))}
                                className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg p-2 text-right font-mono"
                            />
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <h3 className="font-bold text-gray-700 dark:text-gray-300">Artikel ({data.items?.length || 0})</h3>
                            <button onClick={addItem} className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold flex items-center gap-1">
                                <PlusCircleIcon className="w-4 h-4" /> Hinzufügen
                            </button>
                        </div>
                        
                        {data.items?.map((item, idx) => {
                            const CatIcon = CategoryIconMap[item.category || 'other'];
                            return (
                                <div key={idx} className="flex items-center gap-2 bg-white dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                                    {/* Category Selector (Cycle through or simple dropdown) */}
                                    <div className="relative group shrink-0">
                                        <button className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500">
                                            <CatIcon className="w-5 h-5" />
                                        </button>
                                        {/* Simple hover/focus dropdown for category */}
                                        <select 
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                            value={item.category || 'other'}
                                            onChange={(e) => updateItem(idx, 'category', e.target.value)}
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{t(`category.${cat}`)}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Name & Qty */}
                                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                                        <input 
                                            type="text" 
                                            value={item.raw_name || ''} 
                                            onChange={(e) => updateItem(idx, 'raw_name', e.target.value)}
                                            className="w-full bg-transparent border-none p-0 text-sm font-medium focus:ring-0 placeholder-gray-400"
                                            placeholder="Artikelname"
                                        />
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <span>Menge:</span>
                                            <input 
                                                type="number" 
                                                value={item.quantity || 1} 
                                                onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value))}
                                                className="w-12 bg-gray-100 dark:bg-gray-700 rounded px-1 py-0.5 text-center"
                                            />
                                        </div>
                                    </div>

                                    {/* Price & Delete */}
                                    <div className="flex flex-col items-end gap-1">
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            value={item.price || ''} 
                                            onChange={(e) => updateItem(idx, 'price', parseFloat(e.target.value))}
                                            className="w-20 bg-transparent border-none p-0 text-sm font-bold text-right focus:ring-0"
                                            placeholder="0.00"
                                        />
                                        <button onClick={() => deleteItem(idx)} className="text-red-400 hover:text-red-500 p-1">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pb-safe-bottom">
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving || isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:bg-indigo-400"
                    >
                        {isSaving || isLoading ? <SpinnerIcon className="w-5 h-5" /> : <CheckCircleIcon className="w-5 h-5" />}
                        {isSaving ? "Speichere..." : "Speichern & Analysieren"}
                    </button>
                </div>
            </div>
        </div>
    );
};
