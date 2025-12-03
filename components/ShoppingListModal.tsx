
import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from '../i18n/index';
import { XMarkIcon, TrashIcon, ShoppingBagIcon, ChevronDownIcon, SpinnerIcon, UserCircleIcon, CheckCircleIcon, CheckBadgeIcon, UserGroupIcon, CategoryProduceIcon, CategoryBakeryIcon, CategoryMeatIcon, CategoryDairyIcon, CategoryPantryIcon, CategoryFrozenIcon, CategorySnacksIcon, CategoryBeveragesIcon, CategoryHouseholdIcon, CategoryPersonalCareIcon, CategoryOtherIcon, SparklesIcon, CategoryRestaurantIcon, MapPinIcon } from './Icons';
import { useTranslatedItem } from '../hooks/useTranslatedItem';
import { HydratedShoppingListItem } from '../App';
import { ShoppingList, UserProfile, Household, GroceryCategory } from '../types';
import { User } from '@supabase/supabase-js';
import { StoreLogo } from './StoreLogo';
import { triggerHaptic } from '../utils/haptics';

interface ShoppingListModalProps {
  allLists: ShoppingList[];
  activeListId: string | null;
  listData: HydratedShoppingListItem[];
  household: Household | null;
  householdMembers: UserProfile[];
  currentUser: User | null;
  onRemove: (shoppingListItemId: string) => void;
  onClear: () => void;
  onClose: () => void;
  onToggleChecked: (shoppingListItemId: string, isChecked: boolean) => void;
  onSelectList: (listId: string) => void;
  onCreateList: (name: string) => void;
  onDeleteList: (listId: string) => void;
  onUpdateQuantity: (shoppingListItemId: string, newQuantity: number) => void;
  onSmartAdd: (input: string) => Promise<void>;
  isSmartAddLoading: boolean;
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

const CATEGORY_ORDER: GroceryCategory[] = [
    'produce',
    'bakery',
    'meat_fish',
    'dairy_eggs',
    'pantry',
    'snacks',
    'beverages',
    'frozen',
    'household',
    'personal_care',
    'restaurant_food',
    'other'
];

const CategoryColorMap: Record<GroceryCategory, string> = {
    'produce': 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800',
    'bakery': 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    'meat_fish': 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-800',
    'dairy_eggs': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    'pantry': 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    'frozen': 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    'snacks': 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300 border-pink-200 dark:border-pink-800',
    'beverages': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    'household': 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600',
    'personal_care': 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    'restaurant_food': 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    'other': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
};

const SmartAddInput: React.FC<{ onAdd: (input: string) => void, isLoading: boolean }> = ({ onAdd, isLoading }) => {
    const { t } = useTranslation();
    const [input, setInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onAdd(input.trim());
            setInput('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative mb-4">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isLoading ? t('shoppingList.quickAdd.processing') : t('shoppingList.quickAdd.placeholder')}
                disabled={isLoading}
                className="w-full bg-white dark:bg-gray-700 border-2 border-indigo-100 dark:border-indigo-900/50 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3 pr-10 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {isLoading ? (
                    <SpinnerIcon className="w-5 h-5 text-indigo-500" />
                ) : (
                    <SparklesIcon className="w-5 h-5 text-indigo-400" />
                )}
            </div>
        </form>
    );
};

const ActivityLog: React.FC<{
  userId: string | null;
  action: 'added' | 'checked';
  members: UserProfile[];
  currentUser: User | null;
}> = ({ userId, action, members, currentUser }) => {
  if (!userId) return null;
  const { t } = useTranslation();
  const member = members.find(m => m.id === userId);
  const isCurrentUser = currentUser?.id === userId;
  
  const name = isCurrentUser 
    ? t('shoppingList.collaboration.you') 
    : (member?.display_name.split('@')[0] || t('shoppingList.collaboration.someone'));
  
  const actionText = action === 'added' 
    ? t('shoppingList.collaboration.addedBy', { name })
    : t('shoppingList.collaboration.checkedBy', { name });

  const Icon = action === 'added' ? UserCircleIcon : CheckCircleIcon;

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-1">
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{actionText}</span>
    </div>
  );
};


const ShoppingListItem: React.FC<{
  item: HydratedShoppingListItem;
  onRemove: (id: string) => void;
  onToggleChecked: (id: string, isChecked: boolean) => void;
  onUpdateQuantity: (id: string, newQuantity: number) => void;
  isExpanded: boolean;
  onExpand: (id: string) => void;
  members: UserProfile[];
  currentUser: User | null;
  isShoppingMode?: boolean;
  groupPrefix?: string;
}> = ({ item, onRemove, onToggleChecked, onUpdateQuantity, isExpanded, onExpand, members, currentUser, isShoppingMode = false, groupPrefix }) => {
  const { t } = useTranslation();
  const displayItem = useTranslatedItem(item);
  
  // Swipe State
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchOffset, setTouchOffset] = useState(0);
  const swipeThreshold = 80; // pixels to trigger delete

  if (!displayItem) return null;

  const checkboxSize = isShoppingMode ? 'h-7 w-7' : 'h-5 w-5';
  const itemTextSize = isShoppingMode ? 'text-lg' : 'text-md';
  const showCheckbox = isShoppingMode || displayItem.checked; 
  const inputId = `item-${displayItem.shoppingListItemId}-${groupPrefix || 'default'}`;

  const handleQuantityClick = (e: React.MouseEvent, change: number) => {
      e.stopPropagation();
      triggerHaptic('light');
      onUpdateQuantity(displayItem.shoppingListItemId, displayItem.quantity + change);
  };

  const handleToggle = () => {
      triggerHaptic('success');
      onToggleChecked(displayItem.shoppingListItemId, !displayItem.checked);
  };

  const handleRowClick = () => {
      if (Math.abs(touchOffset) > 10) return; // Prevent click if swiping
      if (!isShoppingMode && !displayItem.checked) {
          onExpand(displayItem.id);
      } else if (isShoppingMode) {
          handleToggle();
      }
  };

  // Touch Handlers for Swipe-to-Delete
  const onTouchStart = (e: React.TouchEvent) => {
      setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
      if (touchStart === null) return;
      const currentTouch = e.targetTouches[0].clientX;
      const diff = currentTouch - touchStart;
      
      // Only allow dragging left (negative diff) and cap at -150px
      if (diff < 0 && diff > -150) {
          setTouchOffset(diff);
      }
  };

  const onTouchEnd = () => {
      if (touchStart === null) return;
      
      if (touchOffset < -swipeThreshold) {
          // Trigger Delete
          triggerHaptic('warning');
          onRemove(displayItem.shoppingListItemId);
          // Don't snap back immediately to give visual cue of deletion
      } else {
          // Snap Back
          setTouchOffset(0);
      }
      setTouchStart(null);
  };

  return (
    <li className="relative overflow-hidden rounded-lg mb-2 touch-pan-y">
        {/* Background Action Layer (Red Trash) */}
        <div 
            className="absolute inset-0 bg-red-500 flex items-center justify-end pr-6 rounded-lg transition-opacity duration-200"
            style={{ opacity: Math.abs(touchOffset) > 10 ? 1 : 0 }}
        >
            <TrashIcon className="w-6 h-6 text-white" />
        </div>

        {/* Foreground Content Layer */}
        <div 
            className={`relative bg-white dark:bg-gray-800 rounded-lg transition-transform duration-200 shadow-sm border border-gray-100 dark:border-gray-700/50 ${displayItem.checked ? 'opacity-60 bg-gray-50 dark:bg-gray-800/50' : ''}`}
            style={{ transform: `translateX(${touchOffset}px)` }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <div className="flex items-center justify-between p-3" onClick={handleRowClick}>
                <div className={`flex items-center overflow-hidden flex-1 ${!isShoppingMode ? 'cursor-pointer' : ''}`}>
                    
                    {showCheckbox && (
                        <input
                            id={inputId}
                            type="checkbox"
                            checked={displayItem.checked}
                            onChange={handleToggle}
                            onClick={(e) => e.stopPropagation()}
                            className={`${checkboxSize} rounded-full border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0 transition-transform active:scale-95 mr-3`}
                        />
                    )}
                    
                    {isShoppingMode && displayItem.image && (
                        <div className="mr-3 w-10 h-10 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                            <img src={displayItem.image} alt="" className="w-full h-full object-cover" />
                        </div>
                    )}

                    <div className={`flex-1 overflow-hidden flex items-center gap-2`}>
                        <label 
                            htmlFor={inputId} 
                            className={`${itemTextSize} font-medium text-gray-800 dark:text-gray-200 truncate transition-colors select-none ${displayItem.checked ? 'line-through text-gray-400 dark:text-gray-500' : ''} ${!isShoppingMode ? 'cursor-pointer' : ''}`}
                            onClick={(e) => {
                                if(!isShoppingMode) {
                                    e.preventDefault(); 
                                }
                            }}
                        >
                            {displayItem.name}
                        </label>
                    </div>
                </div>

                <div className="flex items-center gap-2 pl-2" onClick={(e) => e.stopPropagation()}>
                    {!isShoppingMode && !displayItem.checked ? (
                        <div className="flex items-center bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-full h-8 shadow-sm">
                            <button 
                                onClick={(e) => handleQuantityClick(e, -1)} 
                                className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-l-full transition-colors"
                            >
                                -
                            </button>
                            <span className="w-6 text-center text-sm font-semibold text-gray-800 dark:text-gray-200">{displayItem.quantity}</span>
                            <button 
                                onClick={(e) => handleQuantityClick(e, 1)} 
                                className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-green-500 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-r-full transition-colors"
                            >
                                +
                            </button>
                        </div>
                    ) : (
                        <div className="bg-gray-100 dark:bg-gray-700/50 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-600">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{displayItem.quantity}x</span>
                        </div>
                    )}

                    {!isShoppingMode && (
                        <button
                            onClick={() => {
                                triggerHaptic('warning');
                                onRemove(displayItem.shoppingListItemId);
                            }}
                            className="p-1.5 rounded-full text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors ml-1"
                            aria-label={t('shoppingList.removeAria', { name: displayItem.name })}
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
            {isExpanded && !isShoppingMode && !displayItem.checked && (
                <div className="px-3 pb-3 pt-1 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 animate-fade-in-down space-y-3">
                    <div className="flex justify-between items-center text-xs text-gray-500 pl-1">
                        <ActivityLog action="added" userId={displayItem.added_by_user_id} members={members} currentUser={currentUser} />
                        {displayItem.checked && (
                            <ActivityLog action="checked" userId={displayItem.checked_by_user_id} members={members} currentUser={currentUser} />
                        )}
                    </div>
                    
                    {displayItem.image && (
                        <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <img src={displayItem.image} alt={displayItem.name} className="w-full h-40 object-contain bg-white dark:bg-gray-900" />
                        </div>
                    )}
                    
                    {(displayItem.notes || (displayItem.tags && displayItem.tags.length > 0)) && (
                        <div className="bg-white dark:bg-gray-900 p-3 rounded-md border border-gray-100 dark:border-gray-700/50">
                            {displayItem.notes && (
                                <div className="mb-2">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{t('detail.notesTitle')}</h4>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{displayItem.notes}</p>
                                </div>
                            )}
                            {displayItem.tags && displayItem.tags.length > 0 && (
                                <div>
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t('detail.tagsTitle')}</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {displayItem.tags.map(tag => (
                                            <span key={tag} className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    </li>
  );
};

export const ShoppingListModal: React.FC<ShoppingListModalProps> = ({
  allLists,
  activeListId,
  listData,
  household,
  householdMembers,
  currentUser,
  onRemove,
  onClear,
  onClose,
  onToggleChecked,
  onSelectList,
  onCreateList,
  onDeleteList,
  onUpdateQuantity,
  onSmartAdd,
  isSmartAddLoading
}) => {
  const { t } = useTranslation();
  const [newListName, setNewListName] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isShoppingMode, setIsShoppingMode] = useState(false);
  const [isCompletedCollapsed, setIsCompletedCollapsed] = useState(false);

  const toggleExpand = (id: string) => {
      setExpandedItems(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
      });
  };

  const handleCreateList = () => {
      if (newListName.trim()) {
          onCreateList(newListName.trim());
          setNewListName('');
          setIsCreatingList(false);
      }
  };

  const handleDeleteList = () => {
      if (activeListId) {
          const listName = allLists.find(l => l.id === activeListId)?.name;
          if (window.confirm(t('shoppingList.delete.confirm', { listName }))) {
              onDeleteList(activeListId);
          }
      }
  };

  // Logic Upgrade: Split Active vs Completed, THEN Group by Store, THEN by Category
  const activeItems = useMemo(() => listData.filter(i => !i.checked), [listData]);
  const completedItems = useMemo(() => listData.filter(i => i.checked), [listData]);

  // Group by Store -> Category
  const groupedActiveItemsByStore = useMemo(() => {
      const groups: Record<string, Record<string, HydratedShoppingListItem[]>> = {};
      
      activeItems.forEach(item => {
          // Determine Stores. If empty, default to "Other Stores"
          let locations = item.purchaseLocation && item.purchaseLocation.length > 0
              ? item.purchaseLocation
              : ['Other Stores'];
          
          locations.forEach(storeName => {
              if (!groups[storeName]) groups[storeName] = {};
              
              // Determine Category
              const cat = item.category || 'other';
              if (!groups[storeName][cat]) groups[storeName][cat] = [];
              
              groups[storeName][cat].push(item);
          });
      });
      return groups;
  }, [activeItems]);

  const activeList = allLists.find(l => l.id === activeListId);
  const sortedStoreNames = useMemo(() => {
      return Object.keys(groupedActiveItemsByStore).sort((a, b) => {
          if (a === 'Other Stores') return 1; // Always last
          if (b === 'Other Stores') return -1;
          return a.localeCompare(b);
      });
  }, [groupedActiveItemsByStore]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-0 sm:p-4 animate-fade-in" role="dialog" aria-modal="true" onClick={onClose}>
        <div className="bg-white dark:bg-gray-900 w-full max-w-2xl h-full sm:h-[90vh] rounded-none sm:rounded-xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header with Safe Area support */}
            <div className="p-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <ShoppingBagIcon className="w-6 h-6 text-indigo-600" />
                    {activeList ? activeList.name : t('shoppingList.title')}
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <XMarkIcon className="w-6 h-6 text-gray-500" />
                </button>
            </div>

            {/* Toolbar */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3 items-center justify-between">
                {allLists.length > 1 || household ? (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select 
                            value={activeListId || ''} 
                            onChange={(e) => {
                                if (e.target.value === 'new') setIsCreatingList(true);
                                else onSelectList(e.target.value);
                            }}
                            className="bg-gray-100 dark:bg-gray-700 border-none rounded-lg py-2 pl-3 pr-8 text-sm font-medium focus:ring-2 focus:ring-indigo-500 max-w-[200px]"
                        >
                            {allLists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            {household && <option value="new">+ {t('shoppingList.newListButton')}</option>}
                        </select>
                        {activeList && activeList.household_id && (
                            <button onClick={handleDeleteList} className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 p-2 rounded-full" title={t('shoppingList.delete.button')}>
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ) : null}
                
                {isCreatingList && (
                    <div className="absolute inset-0 bg-white dark:bg-gray-800 z-10 flex items-center gap-2 p-3 animate-fade-in">
                        <input 
                            type="text" 
                            value={newListName} 
                            onChange={e => setNewListName(e.target.value)} 
                            placeholder={t('shoppingList.newListPlaceholder')} 
                            className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-md px-3 py-2 border-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                        />
                        <button onClick={handleCreateList} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-bold">{t('shoppingList.createButton')}</button>
                        <button onClick={() => setIsCreatingList(false)} className="text-gray-500 hover:text-gray-700 px-2"><XMarkIcon className="w-5 h-5"/></button>
                    </div>
                )}

                <button 
                    onClick={() => setIsShoppingMode(!isShoppingMode)} 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${isShoppingMode ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'}`}
                >
                    <CheckBadgeIcon className="w-4 h-4" />
                    {isShoppingMode ? t('shoppingList.mode.done') : t('shoppingList.mode.startShopping')}
                </button>
            </div>

            {!isShoppingMode && (
                <div className="p-4 pb-0">
                    <SmartAddInput onAdd={onSmartAdd} isLoading={isSmartAddLoading} />
                </div>
            )}

            {/* List Content with Safe Area Bottom */}
            <div className="flex-1 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] space-y-6 scroll-smooth">
                {listData.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                        <ShoppingBagIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p>{t('shoppingList.empty')}</p>
                    </div>
                ) : (
                    <>
                        {/* 1. Grouped by Store */}
                        {sortedStoreNames.map(storeName => {
                            const categoriesInStore = groupedActiveItemsByStore[storeName];
                            
                            // Determine if we have unknown categories to render at the end
                            const unknownCategories = Object.keys(categoriesInStore).filter(cat => !CATEGORY_ORDER.includes(cat as GroceryCategory));

                            return (
                                <div key={storeName} className="mb-6 animate-slide-in-up">
                                    {/* Store Header */}
                                    <div className="flex items-center gap-2 mb-3 pb-1 border-b border-gray-300 dark:border-gray-600">
                                        {storeName !== 'Other Stores' ? (
                                            <StoreLogo name={storeName} size="md" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                <MapPinIcon className="w-4 h-4 text-gray-500" />
                                            </div>
                                        )}
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{storeName === 'Other Stores' ? t('shoppingList.uncategorized') : storeName}</h3>
                                    </div>

                                    {/* Categories inside Store */}
                                    <div className="space-y-4 pl-2 border-l-2 border-gray-100 dark:border-gray-800 ml-3">
                                        {CATEGORY_ORDER.map(cat => {
                                            const items = categoriesInStore[cat];
                                            if (!items || items.length === 0) return null;
                                            const catColorStyle = CategoryColorMap[cat];

                                            return (
                                                <div key={cat} className="space-y-2">
                                                    <div className={`flex items-center gap-2 py-1`}>
                                                        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${catColorStyle.replace('border', 'border-0')}`}>{t(`category.${cat}`)}</span>
                                                        <span className="text-xs text-gray-400 font-normal ml-auto bg-gray-100 dark:bg-gray-800 px-2 rounded-full">{items.length}</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {items.map(item => (
                                                            <ShoppingListItem
                                                                key={`${storeName}-${item.shoppingListItemId}`}
                                                                item={item}
                                                                onRemove={onRemove}
                                                                onToggleChecked={onToggleChecked}
                                                                onUpdateQuantity={onUpdateQuantity}
                                                                isExpanded={expandedItems.has(item.id)}
                                                                onExpand={toggleExpand}
                                                                members={householdMembers}
                                                                currentUser={currentUser}
                                                                isShoppingMode={isShoppingMode}
                                                                groupPrefix={`${storeName}-${cat}`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Unknown Categories fallback */}
                                        {unknownCategories.map(cat => (
                                            <div key={cat} className="space-y-2">
                                                <div className="flex items-center gap-2 py-1">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{cat}</span>
                                                </div>
                                                <div className="space-y-2">
                                                    {categoriesInStore[cat].map(item => (
                                                        <ShoppingListItem
                                                            key={`${storeName}-${item.shoppingListItemId}`}
                                                            item={item}
                                                            onRemove={onRemove}
                                                            onToggleChecked={onToggleChecked}
                                                            onUpdateQuantity={onUpdateQuantity}
                                                            isExpanded={expandedItems.has(item.id)}
                                                            onExpand={toggleExpand}
                                                            members={householdMembers}
                                                            currentUser={currentUser}
                                                            isShoppingMode={isShoppingMode}
                                                            groupPrefix={`${storeName}-${cat}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {/* 2. Completed Items Section */}
                        {completedItems.length > 0 && (
                            <div className="pt-6 mt-6 border-t-2 border-dashed border-gray-200 dark:border-gray-700">
                                <button 
                                    onClick={() => setIsCompletedCollapsed(!isCompletedCollapsed)}
                                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                                >
                                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                        <span className="font-semibold text-sm uppercase tracking-wide">
                                            {t('shoppingList.mode.completed')} ({completedItems.length})
                                        </span>
                                    </div>
                                    <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isCompletedCollapsed ? '-rotate-90' : ''}`} />
                                </button>
                                
                                {!isCompletedCollapsed && (
                                    <div className="mt-3 space-y-2 animate-fade-in">
                                        {completedItems.map(item => (
                                            <ShoppingListItem
                                                key={item.shoppingListItemId}
                                                item={item}
                                                onRemove={onRemove}
                                                onToggleChecked={onToggleChecked}
                                                onUpdateQuantity={onUpdateQuantity}
                                                isExpanded={expandedItems.has(item.id)}
                                                onExpand={toggleExpand}
                                                members={householdMembers}
                                                currentUser={currentUser}
                                                isShoppingMode={isShoppingMode}
                                                groupPrefix="completed"
                                            />
                                        ))}
                                        
                                        <div className="pt-4 flex justify-center">
                                            <button 
                                                onClick={onClear}
                                                className="flex items-center gap-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs font-bold uppercase tracking-wider py-2 px-4 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                                {t('shoppingList.mode.clearCompleted', { count: completedItems.length })}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
        <style>{`
            @keyframes slideInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            .animate-slide-in-up { animation: slideInUp 0.3s ease-out forwards; }
        `}</style>
    </div>
  );
};
