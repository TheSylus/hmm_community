import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HydratedShoppingListItem, ShoppingList } from '../types';
import { useTranslation } from '../i18n';
import { categorizeShoppingListItems, CategorizedResult } from '../services/geminiService';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { SpinnerIcon, XMarkIcon, EllipsisVerticalIcon, UserGroupIcon, ArrowLeftOnRectangleIcon, TrashIcon } from './Icons';
import { useData } from '../hooks/useData';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

interface ShoppingModeProps {
    list: ShoppingList;
    items: HydratedShoppingListItem[];
    isLoading: boolean;
    onClose: () => void;
    onItemToggle: (itemId: string, checked: boolean) => void;
    onManageMembers: (list: ShoppingList) => void;
}

const CategoryDisplay: React.FC<{
    name: string;
    items: HydratedShoppingListItem[];
    onItemToggle: (itemId: string, checked: boolean) => void;
}> = ({ name, items, onItemToggle }) => (
    <div className="mb-4">
        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-2 border-b-2 border-indigo-200 dark:border-indigo-800 pb-1">{name}</h3>
        <ul className="space-y-2">
            {items.map(item => (
                <li key={item.shoppingListItemId} className="flex items-center bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                    <input
                        id={`item-${item.shoppingListItemId}`}
                        type="checkbox"
                        checked={item.checked}
                        onChange={(e) => onItemToggle(item.shoppingListItemId, e.target.checked)}
                        className="h-6 w-6 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor={`item-${item.shoppingListItemId}`} className="ml-3 flex-grow text-gray-700 dark:text-gray-300 text-base cursor-pointer">
                        {item.name}
                    </label>
                    {item.image && <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-md ml-2" />}
                </li>
            ))}
        </ul>
    </div>
);

export const ShoppingMode: React.FC<ShoppingModeProps> = ({ list, items, isLoading, onClose, onItemToggle, onManageMembers }) => {
    const { t, language } = useTranslation();
    const { user } = useAuth();
    const { addToast } = useToast();
    const { isAiEnabled } = useAppSettings();
    const { addShoppingListItem, removeMemberFromList, deleteShoppingList } = useData();
    const [categorizedResult, setCategorizedResult] = useState<CategorizedResult | null>(null);
    const [isCategorizing, setIsCategorizing] = useState(false);
    const [quickAddItemName, setQuickAddItemName] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isOwner = list.owner_id === user?.id;

    const { pendingItems, completedItems } = useMemo(() => {
        const pending = items.filter(item => !item.checked);
        const completed = items.filter(item => item.checked);
        return { pendingItems: pending, completedItems: completed };
    }, [items]);

    useEffect(() => {
        if (isAiEnabled && pendingItems.length > 0) {
            setIsCategorizing(true);
            categorizeShoppingListItems(pendingItems, language)
                .then(setCategorizedResult)
                .finally(() => setIsCategorizing(false));
        } else {
            setCategorizedResult(null);
        }
    }, [pendingItems, isAiEnabled, language]);
    
    const handleQuickAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (quickAddItemName.trim()) {
            try {
                await addShoppingListItem({
                    list_id: list.id,
                    food_item_id: null,
                    name: quickAddItemName.trim(),
                    quantity: 1,
                });
                setQuickAddItemName('');
            } catch (error) {
                addToast({ message: 'Failed to add item.', type: 'error'});
            }
        }
    };

    const handleDeleteList = useCallback(async () => {
        if (isOwner && window.confirm(t('shoppingMode.confirm.deleteList'))) {
            try {
                await deleteShoppingList(list.id);
                addToast({ message: t('toast.listDeleted'), type: 'info' });
                onClose();
            } catch (error) {
                addToast({ message: t('toast.listDeleteError'), type: 'error' });
            }
        }
    }, [isOwner, list.id, deleteShoppingList, addToast, onClose, t]);

    const handleLeaveList = useCallback(async () => {
        if (!isOwner && window.confirm(t('shoppingMode.confirm.leaveList'))) {
            try {
                await removeMemberFromList({ listId: list.id, memberId: user!.id });
                addToast({ message: t('toast.listLeft'), type: 'info' });
                onClose();
            } catch (error) {
                addToast({ message: t('toast.listLeaveError'), type: 'error' });
            }
        }
    }, [isOwner, list.id, user, removeMemberFromList, addToast, onClose, t]);

    const renderCategorizedItems = () => {
        if (!categorizedResult) return null;
        return categorizedResult.map(cat => {
            const categoryItems = cat.itemIds.map(id => pendingItems.find(i => i.shoppingListItemId === id)).filter(Boolean) as HydratedShoppingListItem[];
            if(categoryItems.length === 0) return null;
            return <CategoryDisplay key={cat.categoryName} name={cat.categoryName} items={categoryItems} onItemToggle={onItemToggle} />;
        });
    };

    const renderUncategorizedItems = () => {
        const categorizedIds = new Set(categorizedResult?.flatMap(c => c.itemIds) || []);
        const uncategorized = pendingItems.filter(item => !categorizedIds.has(item.shoppingListItemId));
        if(uncategorized.length === 0) return null;
        return <CategoryDisplay name={t('shoppingMode.category.other')} items={uncategorized} onItemToggle={onItemToggle} />;
    };

    const renderPendingItems = () => {
        if(isLoading) return <div className="flex justify-center mt-8"><SpinnerIcon className="w-8 h-8 text-indigo-500" /></div>;
        if(pendingItems.length === 0) return <p className="text-gray-500 dark:text-gray-400 text-center py-4">{t('shoppingMode.empty')}</p>;

        if (isAiEnabled) {
            if (isCategorizing) return <div className="flex justify-center mt-8"><SpinnerIcon className="w-8 h-8 text-indigo-500" /></div>;
            return <>
                {renderCategorizedItems()}
                {renderUncategorizedItems()}
            </>
        }
        
        return <CategoryDisplay name={"Items"} items={pendingItems} onItemToggle={onItemToggle} />;
    };

    return (
        <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 z-40 flex flex-col animate-fade-in">
            <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center shrink-0">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate pr-2">{list.name}</h1>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                            <EllipsisVerticalIcon className="w-6 h-6 text-gray-600 dark:text-gray-300"/>
                        </button>
                        {isMenuOpen && (
                            <div 
                                className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10"
                                onMouseLeave={() => setIsMenuOpen(false)}
                            >
                                <div className="py-1">
                                    <button onClick={() => onManageMembers(list)} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><UserGroupIcon className="w-5 h-5" />{t('shoppingMode.menu.manageMembers')}</button>
                                    {!isOwner && <button onClick={handleLeaveList} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><ArrowLeftOnRectangleIcon className="w-5 h-5" />{t('shoppingMode.menu.leaveList')}</button>}
                                    {isOwner && <button onClick={handleDeleteList} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50"><TrashIcon className="w-5 h-5" />{t('shoppingMode.menu.deleteList')}</button>}
                                </div>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4">
                {renderPendingItems()}
                
                {completedItems.length > 0 && (
                    <details className="mt-6">
                        <summary className="font-semibold text-gray-600 dark:text-gray-400 cursor-pointer">{t('shoppingMode.completedItems')} ({completedItems.length})</summary>
                        <ul className="mt-2 space-y-2">
                            {completedItems.map(item => (
                                <li key={item.shoppingListItemId} className="flex items-center bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg">
                                    <input
                                        id={`item-${item.shoppingListItemId}`}
                                        type="checkbox"
                                        checked
                                        onChange={(e) => onItemToggle(item.shoppingListItemId, e.target.checked)}
                                        className="h-6 w-6 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor={`item-${item.shoppingListItemId}`} className="ml-3 flex-grow text-gray-500 dark:text-gray-500 line-through">
                                        {item.name}
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </details>
                )}
            </main>
            
            <footer className="bg-white dark:bg-gray-800 shadow-top p-3 shrink-0">
                <form onSubmit={handleQuickAdd} className="flex gap-2">
                    <input
                        type="text"
                        value={quickAddItemName}
                        onChange={(e) => setQuickAddItemName(e.target.value)}
                        placeholder={t('shoppingMode.quickAddPlaceholder')}
                        className="flex-grow bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2"
                    />
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors">
                        {t('shoppingMode.quickAddButton')}
                    </button>
                </form>
            </footer>

            <style>{`
             .shadow-top {
                box-shadow: 0 -4px 6px -1px rgb(0 0 0 / 0.1), 0 -2px 4px -2px rgb(0 0 0 / 0.1);
             }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            .animate-fade-in { animation: fadeIn 0.2s ease-out; }
            `}</style>
        </div>
    );
};
