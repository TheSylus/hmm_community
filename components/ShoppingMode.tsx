import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../i18n/index';
import { XMarkIcon, TrashIcon, ShoppingBagIcon, ChevronDownIcon, CameraIcon, SpinnerIcon, CheckCircleIcon, EllipsisVerticalIcon, UserPlusIcon } from './Icons';
import { useTranslatedItem } from '../hooks/useTranslatedItem';
import { HydratedShoppingListItem, ShoppingList, UserProfile } from '../types';
import { User } from '@supabase/supabase-js';
import { categorizeShoppingListItems, CategorizedResult } from '../services/geminiService';
import { useAppSettings } from '../contexts/AppSettingsContext';

interface ShoppingModeProps {
  allLists: ShoppingList[];
  activeList: ShoppingList;
  listData: HydratedShoppingListItem[];
  listMembers: UserProfile[];
  currentUser: User | null;
  onRemove: (shoppingListItemId: string) => void;
  onClear: () => void;
  onClose: () => void;
  onToggleChecked: (shoppingListItemId: string, isChecked: boolean) => void;
  onSelectList: (listId: string) => void;
  onDeleteList: (listId: string) => void;
  onLeaveList: (listId: string) => void;
}

const ShoppingListItemFC: React.FC<{
  item: HydratedShoppingListItem;
  onRemove: (id: string) => void;
  onToggleChecked: (id: string, isChecked: boolean) => void;
}> = ({ item, onRemove, onToggleChecked }) => {
  const { t } = useTranslation();
  const displayItem = useTranslatedItem(item);

  if (!displayItem) return null;

  return (
    <li className="flex items-center bg-white dark:bg-gray-700/50 p-3 rounded-lg shadow-sm">
        <input
            id={`item-${displayItem.shoppingListItemId}`}
            type="checkbox"
            checked={displayItem.checked}
            onChange={() => onToggleChecked(displayItem.shoppingListItemId, !displayItem.checked)}
            className="h-6 w-6 rounded-md border-gray-300 dark:border-gray-500 text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0"
        />
        <label htmlFor={`item-${displayItem.shoppingListItemId}`} className="ml-4 flex-1 overflow-hidden cursor-pointer">
            <p className={`text-lg font-medium text-gray-800 dark:text-gray-200 truncate transition-colors ${displayItem.checked ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
                {displayItem.name}
            </p>
        </label>
        {displayItem.image && (
             <img src={displayItem.image} alt={displayItem.name} className="w-12 h-12 object-cover rounded-md ml-4 flex-shrink-0" />
        )}
    </li>
  );
}

export const ShoppingMode: React.FC<ShoppingModeProps> = ({ 
  allLists, activeList, listData, listMembers, currentUser, onClose, onSelectList, onRemove, onClear, onToggleChecked, onDeleteList, onLeaveList
}) => {
  const { t, language } = useTranslation();
  const { isAiEnabled } = useAppSettings();

  const [categorizedItems, setCategorizedItems] = useState<Record<string, string[]>>({});
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copying' | 'copied'>('idle');
  const [isManageMenuOpen, setIsManageMenuOpen] = useState(false);
  const manageMenuRef = useRef<HTMLDivElement>(null);

  const isOwner = useMemo(() => currentUser && activeList && currentUser.id === activeList.owner_id, [currentUser, activeList]);

  useEffect(() => {
    const categorize = async () => {
        if (!isAiEnabled || listData.length === 0) {
            setCategorizedItems({ [t('shoppingMode.uncategorized')]: listData.map(i => i.shoppingListItemId) });
            return;
        }
        setIsCategorizing(true);
        try {
            const results: CategorizedResult = await categorizeShoppingListItems(listData, language);
            const grouped: Record<string, string[]> = {};
            results.forEach(category => {
                if (category.itemIds && category.itemIds.length > 0) {
                   grouped[category.categoryName] = category.itemIds;
                }
            });

            // Ensure all items are accounted for, even if the AI misses some
            const allCategorizedIds = new Set(Object.values(grouped).flat());
            const uncategorizedItems = listData.filter(item => !allCategorizedIds.has(item.shoppingListItemId));

            if (uncategorizedItems.length > 0) {
                const uncategorizedKey = t('shoppingMode.uncategorized');
                grouped[uncategorizedKey] = [...(grouped[uncategorizedKey] || []), ...uncategorizedItems.map(i => i.shoppingListItemId)];
            }
            
            setCategorizedItems(grouped);

        } catch (e) {
            console.error(e);
            // Fallback on error
            setCategorizedItems({ [t('shoppingMode.uncategorized')]: listData.map(i => i.shoppingListItemId) });
        } finally {
            setIsCategorizing(false);
        }
    };
    categorize();
  }, [listData, isAiEnabled, t, language]);


  const handleDelete = () => {
    if (!activeList) return;
    if (window.confirm(t('shoppingMode.delete.confirm', { listName: activeList.name }))) {
        onDeleteList(activeList.id);
        setIsManageMenuOpen(false);
    }
  };

  const handleLeave = () => {
    if (!activeList) return;
    if (window.confirm(t('shoppingMode.leave.confirm', { listName: activeList.name }))) {
        onLeaveList(activeList.id);
        setIsManageMenuOpen(false);
    }
  };

  const handleShareList = useCallback(async () => {
    if (!activeList.id) return;
    setShareStatus('copying');
    const inviteUrl = `${window.location.origin}${window.location.pathname}?join_list=${activeList.id}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to copy share link:', err);
      alert(t('shoppingMode.copyFailed'));
      setShareStatus('idle');
    }
  }, [activeList.id, t]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (manageMenuRef.current && !manageMenuRef.current.contains(event.target as Node)) {
            setIsManageMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const itemsById = useMemo(() => {
      return new Map(listData.map(item => [item.shoppingListItemId, item]));
  }, [listData]);

  const { activeItems, completedItems } = useMemo(() => {
    const active: HydratedShoppingListItem[] = [];
    const completed: HydratedShoppingListItem[] = [];
    listData.forEach(item => {
      if (item.checked) {
        completed.push(item);
      } else {
        active.push(item);
      }
    });
    return { activeItems: active, completedItems: completed };
  }, [listData]);

  const activeCategorizedItems = useMemo(() => {
      const activeIds = new Set(activeItems.map(i => i.shoppingListItemId));
      const result: Record<string, string[]> = {};
      for (const category in categorizedItems) {
          const filteredIds = categorizedItems[category].filter(id => activeIds.has(id));
          if (filteredIds.length > 0) {
              result[category] = filteredIds;
          }
      }
      return result;
  }, [categorizedItems, activeItems]);

  const sortedCategoryNames = useMemo(() => Object.keys(activeCategorizedItems).sort((a,b) => a.localeCompare(b)), [activeCategorizedItems]);

  return (
    <div
      className="fixed inset-0 bg-gray-100 dark:bg-gray-900 z-40 animate-fade-in flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby="list-modal-title"
    >
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex items-center justify-between shrink-0">
             <select
                value={activeList.id}
                onChange={(e) => onSelectList(e.target.value)}
                className="bg-transparent font-bold text-xl text-gray-900 dark:text-white focus:outline-none"
             >
                {allLists.map(list => (
                    <option key={list.id} value={list.id}>{list.name}</option>
                ))}
            </select>
            
            <div className="flex items-center gap-2">
                 <div ref={manageMenuRef} className="relative">
                    <button onClick={() => setIsManageMenuOpen(prev => !prev)} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" title={t('shoppingMode.manage.buttonTitle')}>
                        <EllipsisVerticalIcon className="w-5 h-5"/>
                    </button>
                    {isManageMenuOpen && activeList && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10 animate-fade-in-fast">
                            {isOwner ? (
                                <button onClick={handleDelete} className="w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 flex items-center gap-2 transition-colors">
                                    <TrashIcon className="w-4 h-4" />
                                    {t('shoppingMode.delete.button')}
                                </button>
                            ) : (
                                <button onClick={handleLeave} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 transition-colors">
                                    <XMarkIcon className="w-4 h-4" />
                                    {t('shoppingMode.leave.button')}
                                </button>
                            )}
                        </div>
                    )}
                </div>
                <button
                onClick={onClose}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                aria-label={t('settings.closeAria')}
                >
                <XMarkIcon className="w-6 h-6" />
                </button>
            </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {isCategorizing && (
                <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
                    <SpinnerIcon className="w-5 h-5" />
                    <span>{t('shoppingMode.categorizing')}</span>
                </div>
            )}
            
            {!isCategorizing && activeItems.length === 0 && completedItems.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                    <ShoppingBagIcon className="w-16 h-16 mb-4" />
                    <p>{t('shoppingMode.empty')}</p>
                </div>
            )}

            {!isCategorizing && sortedCategoryNames.map(categoryName => {
                const itemsInCategory = activeCategorizedItems[categoryName].map(id => itemsById.get(id)).filter(Boolean) as HydratedShoppingListItem[];
                if (itemsInCategory.length === 0) return null;

                return (
                    <section key={categoryName}>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3 border-b-2 border-indigo-500 dark:border-indigo-400 pb-2">
                            {categoryName}
                        </h3>
                        <ul className="space-y-3">
                            {itemsInCategory.map(item => (
                                <ShoppingListItemFC
                                    key={item.shoppingListItemId}
                                    item={item}
                                    onRemove={onRemove}
                                    onToggleChecked={onToggleChecked}
                                />
                            ))}
                        </ul>
                    </section>
                )
            })}

            {/* Completed Items Section */}
            {completedItems.length > 0 && (
                 <details className="pt-4" open={false}>
                    <summary className="text-lg font-semibold text-gray-700 dark:text-gray-300 cursor-pointer list-none flex items-center justify-between">
                       <span>{t('shoppingMode.completed')} ({completedItems.length})</span>
                       <ChevronDownIcon className="w-5 h-5 transition-transform duration-200" />
                    </summary>
                    <ul className="space-y-3 mt-4">
                        {completedItems.map(item => (
                             <ShoppingListItemFC
                                key={item.shoppingListItemId}
                                item={item}
                                onRemove={onRemove}
                                onToggleChecked={onToggleChecked}
                            />
                        ))}
                    </ul>
                 </details>
            )}
        </main>
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeInFast { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in-fast { animation: fadeInFast 0.1s ease-out; }
        details > summary { list-style: none; }
        details > summary::-webkit-details-marker { display: none; }
        details[open] summary svg { transform: rotate(180deg); }
      `}</style>
    </div>
  );
};
