
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/index';
import { XMarkIcon, TrashIcon, ShoppingBagIcon, ChevronDownIcon, CameraIcon, PlusCircleIcon, SpinnerIcon, UserCircleIcon, CheckCircleIcon, EllipsisVerticalIcon, UserPlusIcon, CheckBadgeIcon, UserGroupIcon, CategoryProduceIcon, CategoryBakeryIcon, CategoryMeatIcon, CategoryDairyIcon, CategoryPantryIcon, CategoryFrozenIcon, CategorySnacksIcon, CategoryBeveragesIcon, CategoryHouseholdIcon, CategoryPersonalCareIcon, CategoryPetFoodIcon, CategoryOtherIcon } from './Icons';
import { useTranslatedItem } from '../hooks/useTranslatedItem';
import { HydratedShoppingListItem } from '../App';
import { ShoppingList, UserProfile, Household, GroceryCategory } from '../types';
import { User } from '@supabase/supabase-js';
import { StoreLogo } from './StoreLogo';

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
    'pet_food': CategoryPetFoodIcon,
    'other': CategoryOtherIcon,
};

// Define logical supermarket route order
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
    'pet_food',
    'other'
];

const CategoryColorMap: Record<GroceryCategory, string> = {
    'produce': 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    'bakery': 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    'meat_fish': 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    'dairy_eggs': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
    'pantry': 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    'frozen': 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300',
    'snacks': 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
    'beverages': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    'household': 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    'personal_care': 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    'pet_food': 'bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-300',
    'other': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
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

  if (!displayItem) return null;

  const checkboxSize = isShoppingMode ? 'h-7 w-7' : 'h-5 w-5';
  const textContainerMargin = isShoppingMode ? 'ml-4' : 'ml-3';
  const itemTextSize = isShoppingMode ? 'text-lg' : 'text-md';
  
  // Determine Category Icon
  const category = displayItem.category || 'other';
  const CatIcon = CategoryIconMap[category];
  const catColor = CategoryColorMap[category];

  // Ensure unique ID for the input in case the item is rendered in multiple groups
  const inputId = `item-${displayItem.shoppingListItemId}-${groupPrefix || 'default'}`;

  return (
    <li className="bg-gray-50 dark:bg-gray-700/50 rounded-md transition-shadow duration-200 shadow-sm data-[expanded=true]:shadow-lg relative overflow-hidden" data-expanded={isExpanded}>
        <div className="flex items-center justify-between p-3">
            <div className="flex items-center overflow-hidden flex-1">
                <input
                    id={inputId}
                    type="checkbox"
                    checked={displayItem.checked}
                    onChange={() => onToggleChecked(displayItem.shoppingListItemId, !displayItem.checked)}
                    className={`${checkboxSize} rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0`}
                />
                <div className={`${textContainerMargin} flex-1 overflow-hidden cursor-pointer flex items-center gap-2`} onClick={() => onExpand(displayItem.id)}>
                    {/* Category Icon Badge */}
                    <div className={`flex-shrink-0 p-1 rounded-md ${catColor}`} title={t(`category.${category}`)}>
                        <CatIcon className="w-4 h-4" />
                    </div>
                    
                    <label htmlFor={inputId} className={`${itemTextSize} font-medium text-gray-800 dark:text-gray-200 truncate transition-colors cursor-pointer ${displayItem.checked ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
                        {displayItem.name}
                        <span className="ml-2 font-normal text-gray-500 dark:text-gray-400 text-sm">({displayItem.quantity}x)</span>
                    </label>
                </div>
            </div>
            <div className="flex items-center gap-1 pl-2">
                {!isShoppingMode && (
                    <button
                        onClick={() => onRemove(displayItem.shoppingListItemId)}
                        className="p-1.5 rounded-full text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        aria-label={t('shoppingList.removeAria', { name: displayItem.name })}
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                )}
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
            <div className="px-3 pb-3 pt-2 border-t border-gray-200 dark:border-gray-600 animate-fade-in-down space-y-2">
                <div className="flex justify-between items-center pl-8">
                    <ActivityLog action="added" userId={displayItem.added_by_user_id} members={members} currentUser={currentUser} />
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('shoppingList.quantity')}:</label>
                        <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
                            <button onClick={() => onUpdateQuantity(displayItem.shoppingListItemId, displayItem.quantity - 1)} className="px-2 py-1 text-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-l-md">-</button>
                            <span className="px-3 text-md font-semibold text-gray-800 dark:text-gray-200">{displayItem.quantity}</span>
                            <button onClick={() => onUpdateQuantity(displayItem.shoppingListItemId, displayItem.quantity + 1)} className="px-2 py-1 text-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-r-md">+</button>
                        </div>
                    </div>
                </div>
                {displayItem.checked && (
                    <div className="pl-8">
                        <ActivityLog action="checked" userId={displayItem.checked_by_user_id} members={members} currentUser={currentUser} />
                    </div>
                )}
                {displayItem.image ? (
                    <img src={displayItem.image} alt={displayItem.name} className="w-full rounded-md object-contain max-h-48 bg-white dark:bg-gray-800" />
                ) : (
                    <div className="w-full h-24 bg-gray-200 dark:bg-gray-600 rounded-md flex items-center justify-center text-gray-400">
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


export const ShoppingListModal: React.FC<ShoppingListModalProps> = ({ 
  allLists, activeListId, listData, household, householdMembers, currentUser, onRemove, onClear, onClose, onToggleChecked, onSelectList, onCreateList, onDeleteList, onUpdateQuantity
}) => {
  const { t } = useTranslation();
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [isCreatingNewList, setIsCreatingNewList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [shareStatus, setShareStatus] = useState<'idle' | 'copying' | 'copied'>('idle');
  const [isManageMenuOpen, setIsManageMenuOpen] = useState(false);
  const manageMenuRef = useRef<HTMLDivElement>(null);
  const [isShoppingMode, setIsShoppingMode] = useState(false);
  const [currentView, setCurrentView] = useState<'list' | 'members'>('list');


  const activeList = useMemo(() => allLists.find(l => l.id === activeListId), [allLists, activeListId]);

  const handleExpand = useCallback((foodItemId: string) => {
    setExpandedItemId(prev => prev === foodItemId ? null : foodItemId);
  }, []);
  
  const handleCreateList = (e: React.FormEvent) => {
      e.preventDefault();
      if(newListName.trim()){
          onCreateList(newListName.trim());
          setNewListName('');
          setIsCreatingNewList(false);
      }
  }

  const handleDelete = () => {
    if (!activeList) return;
    if (window.confirm(t('shoppingList.delete.confirm', { listName: activeList.name }))) {
        onDeleteList(activeList.id);
        setIsManageMenuOpen(false);
    }
  };

  const handleShareHousehold = useCallback(async () => {
    if (!household) return;
    setShareStatus('copying');
    const inviteUrl = `${window.location.origin}${window.location.pathname}?join_household=${household.id}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy share link:', err);
      alert(t('shoppingList.share.copyFailed'));
      setShareStatus('idle');
    }
  }, [household, t]);

  const getInitials = (name: string) => {
      if (!name) return '?';
      const parts = name.split('@')[0].replace(/[^a-zA-Z\s]/g, ' ').split(' ');
      if (parts.length > 1 && parts[0] && parts[parts.length -1]) {
          return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
  };

  const { groupedItems, sortedGroupNames, checkedItemsCount } = useMemo(() => {
      const checkedCount = listData.filter(i => i.checked).length;

      const grouped: Record<string, HydratedShoppingListItem[]> = {};
      
      listData.forEach(item => {
          const category = item.category || 'other';
          if (!grouped[category]) {
              grouped[category] = [];
          }
          grouped[category].push(item);
      });

      // Sort categories based on defined order
      const sortedNames = Object.keys(grouped).sort((a, b) => {
          const indexA = CATEGORY_ORDER.indexOf(a as GroceryCategory);
          const indexB = CATEGORY_ORDER.indexOf(b as GroceryCategory);
          // Put known categories first in order, others at the end
          const valA = indexA === -1 ? 999 : indexA;
          const valB = indexB === -1 ? 999 : indexB;
          return valA - valB;
      });

      return { groupedItems: grouped, sortedGroupNames: sortedNames, checkedItemsCount: checkedCount };
  }, [listData]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
            {/* Title / List Selector */}
            <div className="flex-1 min-w-0 mr-2">
                {isCreatingNewList ? (
                    <form onSubmit={handleCreateList} className="flex gap-2">
                        <input
                            type="text"
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            placeholder={t('shoppingList.newListPlaceholder')}
                            className="flex-1 bg-gray-100 dark:bg-gray-700 border-none rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                        />
                        <button type="submit" className="text-xs bg-indigo-600 text-white px-2 rounded hover:bg-indigo-700">{t('shoppingList.createButton')}</button>
                        <button type="button" onClick={() => setIsCreatingNewList(false)} className="text-gray-500 hover:text-gray-700"><XMarkIcon className="w-4 h-4"/></button>
                    </form>
                ) : (
                    <div className="relative">
                        <button 
                            onClick={() => setIsManageMenuOpen(!isManageMenuOpen)} 
                            className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                            {activeList?.name || t('shoppingList.title')}
                            <ChevronDownIcon className="w-4 h-4" />
                        </button>
                        
                        {/* Dropdown for List Management */}
                        {isManageMenuOpen && (
                            <div ref={manageMenuRef} className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-700 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-600 py-1 animate-fade-in">
                                {allLists.map(list => (
                                    <button
                                        key={list.id}
                                        onClick={() => { onSelectList(list.id); setIsManageMenuOpen(false); }}
                                        className={`w-full text-left px-4 py-2 text-sm flex justify-between items-center ${activeListId === list.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                                    >
                                        <span className="truncate">{list.name}</span>
                                        {activeListId === list.id && <CheckBadgeIcon className="w-4 h-4" />}
                                    </button>
                                ))}
                                <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                                <button
                                    onClick={() => { setIsCreatingNewList(true); setIsManageMenuOpen(false); }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                                >
                                    <PlusCircleIcon className="w-4 h-4" />
                                    {t('shoppingList.newListButton')}
                                </button>
                                {activeList && (
                                    <button
                                        onClick={handleDelete}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                        {t('shoppingList.delete.button')}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsShoppingMode(!isShoppingMode)}
                    className={`p-2 rounded-full transition-colors ${isShoppingMode ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                    title={t('shoppingList.mode.startShopping')}
                >
                    <ShoppingBagIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={() => setCurrentView(v => v === 'list' ? 'members' : 'list')}
                    className={`p-2 rounded-full transition-colors ${currentView === 'members' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                    title={t('shoppingList.collaboration.members')}
                >
                    <UserGroupIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {currentView === 'list' ? (
                <>
                    {listData.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <ShoppingBagIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>{t('shoppingList.empty')}</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {sortedGroupNames.map(category => (
                                <div key={category}>
                                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 ${CategoryColorMap[category as GroceryCategory].split(' ')[1]}`}>
                                        {t(`category.${category}`)}
                                    </h4>
                                    <ul className="space-y-2">
                                        {groupedItems[category].map(item => (
                                            <ShoppingListItem
                                                key={item.shoppingListItemId}
                                                item={item}
                                                onRemove={onRemove}
                                                onToggleChecked={onToggleChecked}
                                                onUpdateQuantity={onUpdateQuantity}
                                                isExpanded={expandedItemId === item.id}
                                                onExpand={handleExpand}
                                                members={householdMembers}
                                                currentUser={currentUser}
                                                isShoppingMode={isShoppingMode}
                                                groupPrefix={category}
                                            />
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{t('shoppingList.collaboration.members')}</h3>
                    <div className="space-y-2">
                        {householdMembers.map(member => (
                            <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-200 font-bold">
                                    {getInitials(member.display_name)}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {member.id === currentUser?.id ? `${member.display_name} (${t('shoppingList.collaboration.you')})` : member.display_name}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button 
                            onClick={handleShareHousehold} 
                            disabled={shareStatus !== 'idle'}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-70"
                        >
                            <UserPlusIcon className="w-5 h-5" />
                            {shareStatus === 'copied' ? t('shoppingList.share.linkCopied') : t('shoppingList.share.inviteButton')}
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        {currentView === 'list' && checkedItemsCount > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <button
                    onClick={onClear}
                    className="w-full flex items-center justify-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 py-2 rounded-md transition-colors"
                >
                    <TrashIcon className="w-5 h-5" />
                    {t('shoppingList.mode.clearCompleted', { count: checkedItemsCount })}
                </button>
            </div>
        )}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-down { animation: fadeInDown 0.2s ease-out; }
      `}</style>
    </div>
  );
};
