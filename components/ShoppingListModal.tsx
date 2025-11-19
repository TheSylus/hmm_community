import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/index';
import { XMarkIcon, TrashIcon, ShoppingBagIcon, ChevronDownIcon, CameraIcon, ShareIcon, PlusCircleIcon, SpinnerIcon, UserCircleIcon, CheckCircleIcon, EllipsisVerticalIcon, UserPlusIcon, CheckBadgeIcon, UserGroupIcon, ArrowsUpDownIcon } from './Icons';
import { useTranslatedItem } from '../hooks/useTranslatedItem';
import { HydratedShoppingListItem } from '../App';
import { ShoppingList, UserProfile, Household } from '../types';
import { User } from '@supabase/supabase-js';

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
}> = ({ item, onRemove, onToggleChecked, onUpdateQuantity, isExpanded, onExpand, members, currentUser, isShoppingMode = false }) => {
  const { t } = useTranslation();
  const displayItem = useTranslatedItem(item);

  if (!displayItem) return null;

  const checkboxSize = isShoppingMode ? 'h-7 w-7' : 'h-5 w-5';
  const textContainerMargin = isShoppingMode ? 'ml-4' : 'ml-3';
  const itemTextSize = isShoppingMode ? 'text-lg' : 'text-md';

  return (
    <li className="bg-gray-50 dark:bg-gray-700/50 rounded-md transition-shadow duration-200 shadow-sm data-[expanded=true]:shadow-lg" data-expanded={isExpanded}>
        <div className="flex items-center justify-between p-3">
            <div className="flex items-center overflow-hidden flex-1">
                <input
                    id={`item-${displayItem.shoppingListItemId}`}
                    type="checkbox"
                    checked={displayItem.checked}
                    onChange={() => onToggleChecked(displayItem.shoppingListItemId, !displayItem.checked)}
                    className={`${checkboxSize} rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0`}
                />
                <div className={`${textContainerMargin} flex-1 overflow-hidden cursor-pointer`} onClick={() => onExpand(displayItem.id)}>
                    <p className={`${itemTextSize} font-medium text-gray-800 dark:text-gray-200 truncate transition-colors ${displayItem.checked ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
                        {displayItem.name}
                        <span className="ml-2 font-normal text-gray-500 dark:text-gray-400">({displayItem.quantity}x)</span>
                    </p>
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
      const uncategorizedKey = t('shoppingList.uncategorized');
      const checkedCount = listData.filter(item => item.checked).length;
      
      const groups: Record<string, { active: HydratedShoppingListItem[], completed: HydratedShoppingListItem[] }> = {};

      listData.forEach(item => {
          // If item has multiple locations, it goes into multiple groups
          const locations = (item.purchaseLocation && item.purchaseLocation.length > 0) 
                            ? item.purchaseLocation 
                            : [uncategorizedKey];

          locations.forEach(location => {
              if (!groups[location]) {
                  groups[location] = { active: [], completed: [] };
              }
              
              if (item.checked) {
                  groups[location].completed.push(item);
              } else {
                  groups[location].active.push(item);
              }
          });
      });

      const sortedNames = Object.keys(groups).sort((a, b) => {
          if (a === uncategorizedKey) return 1;
          if (b === uncategorizedKey) return -1;
          return a.localeCompare(b);
      });

      return { groupedItems: groups, sortedGroupNames: sortedNames, checkedItemsCount: checkedCount };
  }, [listData, t]);

  useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (manageMenuRef.current && !manageMenuRef.current.contains(event.target as Node)) {
                setIsManageMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const ShoppingModeView = () => (
        <div className="fixed inset-0 bg-white dark:bg-gray-800 z-50 flex flex-col animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
                <h2 id="shopping-list-title" className="text-xl font-bold text-gray-900 dark:text-white truncate pr-4">{activeList?.name || t('shoppingList.title')}</h2>
                <button onClick={() => setIsShoppingMode(false)} className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors text-sm">{t('shoppingList.mode.done')}</button>
            </div>
            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {listData.length > 0 ? sortedGroupNames.map(groupName => {
                    const group = groupedItems[groupName];
                    if (!group || (group.active.length === 0 && group.completed.length === 0)) return null;
                    return (
                        <section key={groupName}>
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 border-b-2 border-gray-200 dark:border-gray-700 pb-1">
                                {groupName}
                            </h3>
                            <ul className="space-y-3">
                                {group.active.map(item => (
                                    <ShoppingListItem key={`${groupName}-${item.shoppingListItemId}`} item={item} onRemove={onRemove} onToggleChecked={onToggleChecked} onUpdateQuantity={onUpdateQuantity} isExpanded={expandedItemId === item.id} onExpand={handleExpand} members={householdMembers} currentUser={currentUser} isShoppingMode={true} />
                                ))}
                            </ul>
                            {group.completed.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-md font-medium text-gray-500 dark:text-gray-400 mb-2">{t('shoppingList.mode.completed')} ({group.completed.length})</h4>
                                    <ul className="space-y-3">
                                        {group.completed.map(item => (
                                            <ShoppingListItem key={`${groupName}-${item.shoppingListItemId}`} item={item} onRemove={onRemove} onToggleChecked={onToggleChecked} onUpdateQuantity={onUpdateQuantity} isExpanded={expandedItemId === item.id} onExpand={handleExpand} members={householdMembers} currentUser={currentUser} isShoppingMode={true} />
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </section>
                    )
                }) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                        <ShoppingBagIcon className="w-16 h-16 mb-4" />
                        <p>{t('shoppingList.empty')}</p>
                    </div>
                )}
            </div>
            {/* Footer */}
            {checkedItemsCount > 0 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
                    <button onClick={onClear} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition-colors">
                        <CheckBadgeIcon className="w-6 h-6" />
                        {t('shoppingList.mode.clearCompleted', { count: checkedItemsCount })}
                    </button>
                </div>
            )}
        </div>
    );

  if (isShoppingMode) {
      return <ShoppingModeView />;
  }

  if (!household) {
      return (
         <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={onClose}
          >
             <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <p className="text-center text-gray-600 dark:text-gray-300">
                    {t('family.noHousehold.description')}
                </p>
             </div>
         </div>
      );
  }

  const renderMembersView = () => (
      <div className="animate-fade-in-fast">
        <button onClick={() => setCurrentView('list')} className="mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            <ChevronDownIcon className="w-4 h-4 rotate-90" />
            {t('modal.duplicate.button.goBack')}
        </button>
        <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg space-y-4">
            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('shoppingList.collaboration.members')}</h3>
                <div className="flex flex-col gap-3">
                    {householdMembers.map(member => (
                        <div key={member.id} className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center text-sm font-bold text-indigo-700 dark:text-indigo-200 ring-2 ring-white dark:ring-gray-800 shrink-0">
                                {getInitials(member.display_name)}
                            </div>
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                {member.id === currentUser?.id ? `${member.display_name} (${t('shoppingList.collaboration.you')})` : member.display_name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                <button onClick={handleShareHousehold} disabled={shareStatus !== 'idle'} className="w-full flex items-center justify-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-3 rounded-md transition-colors disabled:opacity-70 shadow-sm">
                    {shareStatus === 'copying' && <SpinnerIcon className="w-5 h-5" />}
                    {shareStatus === 'copied' && <CheckCircleIcon className="w-5 h-5" />}
                    {shareStatus === 'idle' && <UserPlusIcon className="w-5 h-5"/>}
                    <span>{shareStatus === 'copied' ? t('shoppingList.share.linkCopied') : t('shoppingList.share.inviteButton')}</span>
                </button>
            </div>
        </div>
      </div>
  );

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
        <div className="flex justify-between items-center mb-4 shrink-0">
            <h2 id="shopping-list-title" className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentView === 'members' ? t('shoppingList.collaboration.members') : t('shoppingList.title')}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label={t('settings.closeAria')}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
        </div>
        
        {currentView === 'members' ? (
            renderMembersView()
        ) : (
            <>
            <div className="mb-4 space-y-4 shrink-0">
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <select 
                            value={activeListId || ''} 
                            onChange={(e) => onSelectList(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2"
                            aria-label={t('shoppingList.selectListAria')}
                        >
                            {allLists.map(list => (
                                <option key={list.id} value={list.id}>{list.name}</option>
                            ))}
                        </select>
                        <div ref={manageMenuRef} className="relative">
                            <button onClick={() => setIsManageMenuOpen(prev => !prev)} className="p-2 h-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors" title={t('shoppingList.manage.buttonTitle')}>
                                <EllipsisVerticalIcon className="w-5 h-5"/>
                            </button>
                            {isManageMenuOpen && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10 animate-fade-in-fast overflow-hidden">
                                     <button onClick={() => { setCurrentView('members'); setIsManageMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 transition-colors border-b border-gray-100 dark:border-gray-600">
                                        <UserGroupIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                        {t('shoppingList.share.inviteButton')} / {t('shoppingList.collaboration.members')}
                                    </button>
                                    <button onClick={handleDelete} className="w-full text-left px-4 py-3 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 flex items-center gap-2 transition-colors">
                                        <TrashIcon className="w-4 h-4" />
                                        {t('shoppingList.delete.button')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    {isCreatingNewList ? (
                        <form onSubmit={handleCreateList} className="flex gap-2 animate-fade-in-down">
                            <input
                                type="text"
                                value={newListName}
                                onChange={(e) => setNewListName(e.target.value)}
                                placeholder={t('shoppingList.newListPlaceholder')}
                                className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2"
                                autoFocus
                            />
                            <button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold text-sm">{t('shoppingList.createButton')}</button>
                            <button type="button" onClick={() => setIsCreatingNewList(false)} className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-semibold text-sm">{t('form.button.cancel')}</button>
                        </form>
                    ) : (
                        <button onClick={() => setIsCreatingNewList(true)} className="w-full flex items-center justify-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-semibold py-2 px-3 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors">
                            <PlusCircleIcon className="w-5 h-5"/>
                            {t('shoppingList.newListButton')}
                        </button>
                    )}
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 -mr-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                {listData.length > 0 ? (
                    <div className="space-y-6">
                        {sortedGroupNames.map(groupName => {
                            const group = groupedItems[groupName];
                            if (!group || (group.active.length === 0 && group.completed.length === 0)) return null;
                            return (
                                <section key={groupName}>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 border-b-2 border-gray-200 dark:border-gray-700 pb-1">
                                        {groupName}
                                    </h3>
                                    <ul className="space-y-3">
                                        {group.active.map(item => (
                                            <ShoppingListItem key={`${groupName}-${item.shoppingListItemId}`} item={item} onRemove={onRemove} onToggleChecked={onToggleChecked} onUpdateQuantity={onUpdateQuantity} isExpanded={expandedItemId === item.id} onExpand={handleExpand} members={householdMembers} currentUser={currentUser} />
                                        ))}
                                        {group.completed.map(item => (
                                            <ShoppingListItem key={`${groupName}-${item.shoppingListItemId}`} item={item} onRemove={onRemove} onToggleChecked={onToggleChecked} onUpdateQuantity={onUpdateQuantity} isExpanded={expandedItemId === item.id} onExpand={handleExpand} members={householdMembers} currentUser={currentUser} />
                                        ))}
                                    </ul>
                                </section>
                            )
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                        <ShoppingBagIcon className="w-16 h-16 mb-4" />
                        <p>{t('shoppingList.empty')}</p>
                    </div>
                )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3 shrink-0">
                {listData.length > 0 && (
                    <button onClick={() => setIsShoppingMode(true)} className="w-full flex items-center justify-center gap-2 text-lg bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md transition-colors shadow-lg hover:shadow-xl">
                        <ShoppingBagIcon className="w-6 h-6"/>
                        {t('shoppingList.mode.startShopping')}
                    </button>
                )}
                {listData.length > 0 && checkedItemsCount > 0 && (
                    <button
                        onClick={onClear}
                        disabled={checkedItemsCount === 0}
                        className="w-full px-6 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition-colors disabled:bg-red-400 dark:disabled:bg-gray-600"
                    >
                        {t('shoppingList.clear')} ({checkedItemsCount})
                    </button>
                )}
            </div>
            </>
        )}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        @keyframes fadeInFast { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in-fast { animation: fadeInFast 0.1s ease-out; }
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