import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ShoppingList, HydratedShoppingListItem, UserProfile, User, Household } from '../types';
import { useTranslation } from '../i18n/index';
import { useTranslatedItem } from '../hooks/useTranslatedItem';
import { FoodItemCard } from './FoodItemCard';
import { XMarkIcon, TrashIcon, CheckCircleIcon, SpinnerIcon, PlusIcon, MinusIcon, ChevronDownIcon } from './Icons';

interface ShoppingListModalProps {
    allLists: ShoppingList[];
    activeListId: string | null;
    listData: HydratedShoppingListItem[];
    household: Household | null;
    householdMembers: UserProfile[];
    currentUser: User | null;
    onRemove: (shoppingListItemId: string) => void;
    onClear: () => void;
    onToggleChecked: (shoppingListItemId: string, isChecked: boolean) => void;
    onClose: () => void;
    onSelectList: (listId: string) => void;
    onCreateList: (name: string) => void;
    onDeleteList: (listId: string) => void;
    onUpdateQuantity: (shoppingListItemId: string, quantity: number) => void;
}

const ShoppingListItemView: React.FC<{
    item: HydratedShoppingListItem;
    onToggle: (id: string, checked: boolean) => void;
    onRemove: (id: string) => void;
    onUpdateQuantity: (id: string, quantity: number) => void;
    addedBy: string;
}> = ({ item, onToggle, onRemove, onUpdateQuantity, addedBy }) => {
    const displayItem = useTranslatedItem(item);
    
    if (!displayItem) return null;

    return (
        <div className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${displayItem.checked ? 'bg-gray-100 dark:bg-gray-900/50' : 'bg-white dark:bg-gray-800'}`}>
            <button onClick={() => onToggle(displayItem.shoppingListItemId, !displayItem.checked)} className="flex-shrink-0">
                {displayItem.checked ? (
                    <CheckCircleIcon className="w-7 h-7 text-green-500" />
                ) : (
                    <div className="w-7 h-7 border-2 border-gray-300 dark:border-gray-600 rounded-full"></div>
                )}
            </button>
            <div className="w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700">
                {displayItem.image && <img src={displayItem.image} alt={displayItem.name} className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 overflow-hidden">
                <p className={`font-semibold truncate ${displayItem.checked ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>{displayItem.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Added by {addedBy}</p>
            </div>
            <div className="flex items-center gap-1.5">
                <button onClick={() => onUpdateQuantity(displayItem.shoppingListItemId, displayItem.quantity - 1)} className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50" disabled={displayItem.quantity <= 1}>
                    <MinusIcon className="w-4 h-4" />
                </button>
                <span className="font-bold w-6 text-center">{displayItem.quantity}</span>
                <button onClick={() => onUpdateQuantity(displayItem.shoppingListItemId, displayItem.quantity + 1)} className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
                    <PlusIcon className="w-4 h-4" />
                </button>
            </div>
            <button onClick={() => onRemove(displayItem.shoppingListItemId)} className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50">
                <TrashIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

export const ShoppingListModal: React.FC<ShoppingListModalProps> = (props) => {
    const { allLists, activeListId, listData, household, householdMembers, currentUser, onClose, onSelectList, onCreateList, onDeleteList } = props;
    const { t } = useTranslation();
    const [newListName, setNewListName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isListDropdownOpen, setIsListDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const memberMap = useMemo(() => new Map(householdMembers.map(m => [m.id, m.display_name])), [householdMembers]);
    
    const activeList = allLists.find(l => l.id === activeListId);

    const handleCreateList = async () => {
        if (!newListName.trim()) return;
        setIsCreating(true);
        await onCreateList(newListName.trim());
        setNewListName('');
        setIsCreating(false);
    };
    
    const handleDeleteActiveList = () => {
        if(activeList && window.confirm(t('shoppingList.deleteListConfirm', { listName: activeList.name }))) {
            onDeleteList(activeList.id);
        }
    };
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsListDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const sortedListData = useMemo(() => [...listData].sort((a, b) => a.checked === b.checked ? 0 : a.checked ? 1 : -1), [listData]);

    if (!household) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg text-center" onClick={e => e.stopPropagation()}>
                    <h2 className="text-xl font-bold mb-4">{t('family.noHousehold.title')}</h2>
                    <p>{t('family.noHousehold.description')}</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('shoppingList.title')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div ref={dropdownRef} className="relative">
                        <button onClick={() => setIsListDropdownOpen(!isListDropdownOpen)} className="w-full flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-700 rounded-md font-semibold">
                            <span>{activeList?.name || 'Select a list'}</span>
                            <ChevronDownIcon className={`w-5 h-5 transition-transform ${isListDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isListDropdownOpen && (
                            <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-700 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-600">
                                {allLists.map(list => (
                                    <button key={list.id} onClick={() => { onSelectList(list.id); setIsListDropdownOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600">
                                        {list.name}
                                    </button>
                                ))}
                                {allLists.length > 1 && activeList && (
                                    <>
                                        <hr className="border-gray-200 dark:border-gray-600" />
                                        <button onClick={handleDeleteActiveList} className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50">
                                            Delete "{activeList.name}"
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex gap-2">
                             <input
                                type="text"
                                value={newListName}
                                onChange={e => setNewListName(e.target.value)}
                                placeholder={t('shoppingList.createListPlaceholder')}
                                className="flex-grow w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2"
                                disabled={isCreating}
                                onKeyUp={e => e.key === 'Enter' && handleCreateList()}
                            />
                            <button onClick={handleCreateList} disabled={isCreating || !newListName.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 dark:disabled:bg-gray-600 flex items-center justify-center">
                                {isCreating ? <SpinnerIcon className="w-5 h-5" /> : t('shoppingList.createList')}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-4 space-y-2 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                    {sortedListData.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">{t('shoppingList.empty')}</p>
                    ) : (
                        sortedListData.map(item => (
                            <ShoppingListItemView
                                key={item.shoppingListItemId}
                                item={item}
                                onToggle={props.onToggleChecked}
                                onRemove={props.onRemove}
                                onUpdateQuantity={props.onUpdateQuantity}
                                addedBy={item.added_by_user_id === currentUser?.id ? t('shoppingList.you') : memberMap.get(item.added_by_user_id) || 'Someone'}
                            />
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={props.onClear} disabled={listData.filter(i => i.checked).length === 0} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-red-400 dark:disabled:bg-gray-600">
                        {t('shoppingList.clearCompleted')}
                    </button>
                </div>
            </div>
        </div>
    );
};
