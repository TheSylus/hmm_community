import React, { useState, useMemo, useCallback } from 'react';
import { FoodItem } from '../types';
import { useTranslation } from '../i18n/index';
import { XMarkIcon, TrashIcon, ShoppingBagIcon, ChevronDownIcon, CameraIcon } from './Icons';
import { useTranslatedItem } from '../hooks/useTranslatedItem';

interface ShoppingListModalProps {
  items: FoodItem[];
  shoppingListItems: string[];
  onRemove: (itemId: string) => void;
  onClear: () => void;
  onClose: () => void;
}

const ShoppingListItem: React.FC<{
  item: FoodItem;
  onRemove: (id: string) => void;
  checked: boolean;
  onToggle: (id: string) => void;
  isExpanded: boolean;
  onExpand: (id: string) => void;
}> = ({ item, onRemove, checked, onToggle, isExpanded, onExpand }) => {
  const { t } = useTranslation();
  const displayItem = useTranslatedItem(item);

  if (!displayItem) return null;

  return (
    <li className="bg-gray-50 dark:bg-gray-700/50 rounded-md transition-shadow duration-200 shadow-sm data-[expanded=true]:shadow-lg" data-expanded={isExpanded}>
        <div className="flex items-center justify-between p-3">
            <div className="flex items-center overflow-hidden flex-1">
                <input
                    id={`item-${displayItem.id}`}
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(displayItem.id)}
                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0"
                />
                <div className="ml-3 flex-1 overflow-hidden cursor-pointer" onClick={() => onExpand(displayItem.id)}>
                    <p className={`text-md font-medium text-gray-800 dark:text-gray-200 truncate transition-colors ${checked ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
                        {displayItem.name}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-1 pl-2">
                <button
                    onClick={() => onRemove(displayItem.id)}
                    className="p-1.5 rounded-full text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    aria-label={t('shoppingList.removeAria', { name: displayItem.name })}
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={() => onExpand(displayItem.id)}
                    className="p-1.5 rounded-full text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    aria-label={t('shoppingList.toggleDetailsAria')}
                >
                    <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
            </div>
        </div>
        {isExpanded && (
            <div className="px-3 pb-3 pt-2 border-t border-gray-200 dark:border-gray-600 animate-fade-in-down">
                {displayItem.image ? (
                    <img src={displayItem.image} alt={displayItem.name} className="w-full rounded-md mb-2 object-contain max-h-48 bg-white dark:bg-gray-800" />
                ) : (
                    <div className="w-full h-24 bg-gray-200 dark:bg-gray-600 rounded-md flex items-center justify-center text-gray-400 mb-2">
                        <CameraIcon className="w-8 h-8"/>
                    </div>
                )}
                {displayItem.notes && (
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('detail.notesTitle')}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{displayItem.notes}</p>
                    </div>
                )}
            </div>
        )}
    </li>
  );
}


export const ShoppingListModal: React.FC<ShoppingListModalProps> = ({ items, shoppingListItems, onRemove, onClear, onClose }) => {
  const { t } = useTranslation();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const handleExpand = useCallback((itemId: string) => {
    setExpandedItemId(prev => prev === itemId ? null : itemId);
  }, []);

  const listItems = useMemo(() => {
    const itemMap = new Map(items.map(item => [item.id, item]));
    return shoppingListItems.map(id => itemMap.get(id)).filter((item): item is FoodItem => !!item);
  }, [items, shoppingListItems]);

  const groupedItems = useMemo(() => {
    const uncategorizedKey = t('shoppingList.uncategorized');
    return listItems.reduce<Record<string, FoodItem[]>>((acc, item) => {
      const key = item.purchaseLocation || uncategorizedKey;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});
  }, [listItems, t]);

  const sortedGroupNames = useMemo(() => {
      const uncategorizedKey = t('shoppingList.uncategorized');
      return Object.keys(groupedItems).sort((a, b) => {
          if (a === uncategorizedKey) return 1;
          if (b === uncategorizedKey) return -1;
          return a.localeCompare(b);
      });
  }, [groupedItems, t]);


  const handleToggle = useCallback((itemId: string) => {
    setCheckedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) {
            newSet.delete(itemId);
        } else {
            newSet.add(itemId);
        }
        return newSet;
    });
  }, []);

  const handleClearCompleted = useCallback(() => {
    checkedItems.forEach(id => onRemove(id));
    setCheckedItems(new Set());
  }, [checkedItems, onRemove]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shopping-list-title"
    >
      <div
        className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
            <h2 id="shopping-list-title" className="text-2xl font-bold text-gray-900 dark:text-white">{t('shoppingList.title')}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label={t('settings.closeAria')}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            {listItems.length > 0 ? (
                <div className="space-y-6">
                    {sortedGroupNames.map(groupName => (
                        <section key={groupName}>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 border-b-2 border-gray-200 dark:border-gray-700 pb-1">
                                {groupName}
                            </h3>
                            <ul className="space-y-3">
                                {groupedItems[groupName].map(item => (
                                    <ShoppingListItem
                                        key={item.id}
                                        item={item}
                                        onRemove={onRemove}
                                        checked={checkedItems.has(item.id)}
                                        onToggle={handleToggle}
                                        isExpanded={expandedItemId === item.id}
                                        onExpand={handleExpand}
                                    />
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                    <ShoppingBagIcon className="w-16 h-16 mb-4" />
                    <p>{t('shoppingList.empty')}</p>
                </div>
            )}
        </div>

        {listItems.length > 0 && (
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                <button
                    onClick={handleClearCompleted}
                    disabled={checkedItems.size === 0}
                    className="w-full px-6 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition-colors disabled:bg-red-400 dark:disabled:bg-gray-600"
                >
                    {t('shoppingList.clear')} ({checkedItems.size})
                </button>
            </div>
        )}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down { animation: fadeInDown 0.3s ease-out; }
        .pr-2.-mr-2::-webkit-scrollbar { width: 8px; }
        .pr-2.-mr-2::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .dark .pr-2.-mr-2::-webkit-scrollbar-track { background: #374151; }
        .pr-2.-mr-2::-webkit-scrollbar-thumb { background: #9ca3af; border-radius: 4px; }
        .dark .pr-2.-mr-2::-webkit-scrollbar-thumb { background: #4b5563; }
        .pr-2.-mr-2::-webkit-scrollbar-thumb:hover { background: #6b7280; }
        .dark .pr-2.-mr-2::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
      `}</style>
    </div>
  );
};
