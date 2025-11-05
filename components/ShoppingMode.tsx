import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HydratedShoppingListItem, ShoppingList } from '../types';
import { XMarkIcon, SpinnerIcon, PlusCircleIcon, EllipsisVerticalIcon, UserGroupIcon, ArrowLeftOnRectangleIcon, TrashIcon } from './Icons';
import { useTranslation } from '../i18n';
import { categorizeShoppingListItems } from '../services/geminiService';
import { useAppSettings } from '../contexts/AppSettingsContext';

interface ShoppingModeProps {
    list: ShoppingList;
    items: HydratedShoppingListItem[];
    isLoading: boolean;
    onClose: () => void;
    onItemToggle: (args: { itemId: string, checked: boolean }) => void;
    onManageMembers: (list: ShoppingList) => void;
}

type Category = {
    categoryName: string;
    items: HydratedShoppingListItem[];
};

const ShoppingListItem: React.FC<{ item: HydratedShoppingListItem; onToggle: () => void }> = ({ item, onToggle }) => (
    <div
        onClick={onToggle}
        className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${item.checked ? 'bg-gray-200 dark:bg-gray-700/50' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
    >
        <div className={`w-5 h-5 rounded-sm border-2 flex-shrink-0 flex items-center justify-center ${item.checked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-400'}`}>
            {item.checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
        </div>
        <span className={`flex-grow ${item.checked ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-800 dark:text-gray-200'}`}>{item.name}</span>
    </div>
);

export const ShoppingMode: React.FC<ShoppingModeProps> = ({ list, items, isLoading, onClose, onItemToggle, onManageMembers }) => {
    const { t, language } = useTranslation();
    const { isAiEnabled } = useAppSettings();
    const [categorized, setCategorized] = useState<Category[]>([]);
    const [isCategorizing, setIsCategorizing] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const activeItems = useMemo(() => items.filter(i => !i.checked), [items]);
    const completedItems = useMemo(() => items.filter(i => i.checked), [items]);

    const runCategorization = useCallback(async () => {
        if (!isAiEnabled || activeItems.length === 0) {
            setCategorized([{ categoryName: t('shoppingMode.category.other'), items: activeItems }]);
            return;
        }
        setIsCategorizing(true);
        try {
            const result = await categorizeShoppingListItems(activeItems, language);
            const itemMap = new Map(activeItems.map(i => [i.shopping_list_item_id, i]));
            const newCategories: Category[] = result.map(cat => ({
                categoryName: cat.categoryName,
                items: cat.itemIds.map(id => itemMap.get(id)).filter((i): i is HydratedShoppingListItem => !!i)
            }));
            
            // Add any items not returned by AI to an "Other" category
            const categorizedIds = new Set(result.flatMap(c => c.itemIds));
            const uncategorizedItems = activeItems.filter(i => !categorizedIds.has(i.shopping_list_item_id));
            if (uncategorizedItems.length > 0) {
                const otherCategory = newCategories.find(c => c.categoryName.toLowerCase() === 'other' || c.categoryName.toLowerCase() === t('shoppingMode.category.other').toLowerCase());
                if (otherCategory) {
                    otherCategory.items.push(...uncategorizedItems);
                } else {
                    newCategories.push({ categoryName: t('shoppingMode.category.other'), items: uncategorizedItems });
                }
            }
            setCategorized(newCategories);
        } catch (error) {
            console.error(error);
            setCategorized([{ categoryName: t('shoppingMode.category.other'), items: activeItems }]);
        } finally {
            setIsCategorizing(false);
        }
    }, [activeItems, isAiEnabled, language, t]);

    useEffect(() => {
        runCategorization();
    }, [runCategorization]);
    
    const handleMenuAction = (action: 'manage' | 'leave' | 'delete') => {
        setIsMenuOpen(false);
        switch (action) {
            case 'manage':
                onManageMembers(list);
                break;
            // Additional cases for leave/delete would go here
            // case 'leave': if (window.confirm(...)) { ... } break;
            // case 'delete': if (window.confirm(...)) { ... } break;
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 z-40 flex flex-col animate-slide-in-up">
            <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex items-center justify-between shrink-0">
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('shoppingMode.title')}</p>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{list.name}</h1>
                </div>
                <div className="relative">
                     <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <EllipsisVerticalIcon className="w-6 h-6"/>
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                            <div className="py-1">
                                <button onClick={() => handleMenuAction('manage')} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"><UserGroupIcon className="w-5 h-5" /> {t('shoppingMode.menu.manageMembers')}</button>
                                {/* Future actions */}
                                {/* <button className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"><ArrowLeftOnRectangleIcon className="w-5 h-5" /> {t('shoppingMode.menu.leaveList')}</button>
                                <button className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50"><TrashIcon className="w-5 h-5" /> {t('shoppingMode.menu.deleteList')}</button> */}
                            </div>
                        </div>
                    )}
                </div>
                <button onClick={onClose} className="p-2 ml-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-6">
                {isLoading || isCategorizing ? (
                    <div className="flex justify-center mt-8"><SpinnerIcon className="w-8 h-8 text-indigo-500" /></div>
                ) : items.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-10">{t('shoppingMode.empty')}</p>
                ) : (
                    <>
                        {/* Active Items */}
                        <div className="space-y-4">
                            {categorized.map((category, index) => (
                                category.items.length > 0 && (
                                    <section key={`${category.categoryName}-${index}`}>
                                        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">{category.categoryName}</h2>
                                        <div className="space-y-2">
                                            {category.items.map(item => (
                                                <ShoppingListItem key={item.shopping_list_item_id} item={item} onToggle={() => onItemToggle({ itemId: item.shopping_list_item_id, checked: !item.checked })} />
                                            ))}
                                        </div>
                                    </section>
                                )
                            ))}
                        </div>

                        {/* Completed Items */}
                        {completedItems.length > 0 && (
                            <details className="pt-4">
                                <summary className="text-lg font-semibold text-gray-700 dark:text-gray-300 cursor-pointer list-none flex items-center">
                                    <span className="flex-grow">{t('shoppingMode.completedItems')} ({completedItems.length})</span>
                                    <svg className="w-5 h-5 transition-transform transform details-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </summary>
                                <div className="mt-4 space-y-2">
                                    {completedItems.map(item => (
                                        <ShoppingListItem key={item.shopping_list_item_id} item={item} onToggle={() => onItemToggle({ itemId: item.shopping_list_item_id, checked: !item.checked })} />
                                    ))}
                                </div>
                            </details>
                        )}
                    </>
                )}
            </main>
            
            {/* Quick Add Footer - Future Feature */}
            {/*
            <footer className="p-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                    <input type="text" placeholder={t('shoppingMode.quickAddPlaceholder')} className="flex-grow bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md p-2" />
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold flex items-center gap-2"><PlusCircleIcon className="w-5 h-5"/> {t('shoppingMode.quickAddButton')}</button>
                </div>
            </footer>
            */}
            
            <style>{`
                @keyframes slide-in-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
                .animate-slide-in-up { animation: slide-in-up 0.3s ease-out; }
                details[open] .details-arrow { transform: rotate(180deg); }
            `}</style>
        </div>
    );
};