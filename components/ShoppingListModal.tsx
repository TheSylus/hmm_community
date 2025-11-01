import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from '../i18n/index';
import { XMarkIcon, TrashIcon, ShoppingBagIcon, ChevronDownIcon, CameraIcon, ShareIcon, PlusCircleIcon, SpinnerIcon, UserCircleIcon, CheckCircleIcon, EllipsisVerticalIcon } from './Icons';
import { useTranslatedItem } from '../hooks/useTranslatedItem';
import { HydratedShoppingListItem } from '../App';
import { ShoppingList, UserProfile } from '../types';
import { User } from '@supabase/supabase-js';

interface ShoppingListModalProps {
  allLists: ShoppingList[];
  activeListId: string | null;
  listData: HydratedShoppingListItem[];
  listMembers: UserProfile[];
  currentUser: User | null;
  onRemove: (shoppingListItemId: string) => void;
  onClear: () => void;
  onClose: () => void;
  onToggleChecked: (shoppingListItemId: string, isChecked: boolean) => void;
  onSelectList: (listId: string) => void;
  onCreateList: (name: string) => void;
  onDeleteList: (listId: string) => void;
  onLeaveList: (listId: string) => void;
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
  
  // Use the part of the email before the "@" as a simple display name, or a default
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
  isExpanded: boolean;
  onExpand: (id: string) => void;
  members: UserProfile[];
  currentUser: User | null;
}> = ({ item, onRemove, onToggleChecked, isExpanded, onExpand, members, currentUser }) => {
  const { t } = useTranslation();
  const displayItem = useTranslatedItem(item);

  if (!displayItem) return null;

  return (
    <li className="bg-gray-50 dark:bg-gray-700/50 rounded-md transition-shadow duration-200 shadow-sm data-[expanded=true]:shadow-lg" data-expanded={isExpanded}>
        <div className="flex items-center justify-between p-3">
            <div className="flex items-center overflow-hidden flex-1">
                <input
                    id={`item-${displayItem.shoppingListItemId}`}
                    type="checkbox"
                    checked={displayItem.checked}
                    onChange={() => onToggleChecked(displayItem.shoppingListItemId, !displayItem.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0"
                />
                <div className="ml-3 flex-1 overflow-hidden cursor-pointer" onClick={() => onExpand(displayItem.id)}>
                    <p className={`text-md font-medium text-gray-800 dark:text-gray-200 truncate transition-colors ${displayItem.checked ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
                        {displayItem.name}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-1 pl-2">
                <button
                    onClick={() => onRemove(displayItem.shoppingListItemId)}
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
            <div className="px-3 pb-3 pt-2 border-t border-gray-200 dark:border-gray-600 animate-fade-in-down space-y-2">
                <div className="pl-8">
                    <ActivityLog action="added" userId={displayItem.added_by_user_id} members={members} currentUser={currentUser} />
                    {displayItem.checked && (
                        <ActivityLog action="checked" userId={displayItem.checked_by_user_id} members={members} currentUser={currentUser} />
                    )}
                </div>

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
  allLists, activeListId, listData, listMembers, currentUser, onRemove, onClear, onClose, onToggleChecked, onSelectList, onCreateList, onDeleteList, onLeaveList
}) => {
  const { t } = useTranslation();
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [isCreatingNewList, setIsCreatingNewList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [isManageMenuOpen, setIsManageMenuOpen] = useState(false);
  const manageMenuRef = React.useRef<HTMLDivElement>(null);


  const activeList = useMemo(() => allLists.find(l => l.id === activeListId), [allLists, activeListId]);
  const isOwner = useMemo(() => currentUser && activeList && currentUser.id === activeList.owner_id, [currentUser, activeList]);


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

  const handleLeave = () => {
    if (!activeList) return;
    if (window.confirm(t('shoppingList.leave.confirm', { listName: activeList.name }))) {
        onLeaveList(activeList.id);
        setIsManageMenuOpen(false);
    }
  };

  const handleShareList = useCallback(async () => {
    if (!activeListId) return;
    setIsSharing(true);
    const inviteUrl = `${window.location.origin}${window.location.pathname}?join_list=${activeListId}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      alert(t('shoppingList.share.linkCopied'));
    } catch (err) {
      console.error('Failed to copy share link:', err);
      alert(t('shoppingList.share.copyFailed'));
    } finally {
      setIsSharing(false);
    }
  }, [activeListId, t]);

  const getInitials = (name: string) => {
      if (!name) return '?';
      const parts = name.split('@')[0].replace(/[^a-zA-Z\s]/g, ' ').split(' ');
      if (parts.length > 1) {
          return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
  };

  const groupedItems = useMemo(() => {
    const uncategorizedKey = t('shoppingList.uncategorized');
    // FIX: Replaced generic on .reduce with a typed initial value to resolve TS error.
    return listData.reduce((acc, item) => {
      const key = item.purchaseLocation || uncategorizedKey;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<string, HydratedShoppingListItem[]>);
  }, [listData, t]);

  const sortedGroupNames = useMemo(() => {
      const uncategorizedKey = t('shoppingList.uncategorized');
      return Object.keys(groupedItems).sort((a, b) => {
          if (a === uncategorizedKey) return 1;
          if (b === uncategorizedKey) return -1;
          return a.localeCompare(b);
      });
  }, [groupedItems, t]);

  const checkedItemsCount = useMemo(() => listData.filter(item => item.checked).length, [listData]);

  // Close manage menu if clicked outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (manageMenuRef.current && !manageMenuRef.current.contains(event.target as Node)) {
                setIsManageMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
        
        {/* List Management & Members Section */}
        <div className="mb-4 space-y-4">
            <div className="space-y-2">
                <div className="flex gap-2 relative">
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
                    <button onClick={handleShareList} disabled={isSharing} className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 transition-colors" title={t('shoppingList.share.buttonTitle')}>
                        {isSharing ? <SpinnerIcon className="w-5 h-5"/> : <ShareIcon className="w-5 h-5"/>}
                    </button>
                    <div ref={manageMenuRef} className="relative">
                        <button onClick={() => setIsManageMenuOpen(prev => !prev)} className="p-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors" title={t('shoppingList.manage.buttonTitle')}>
                            <EllipsisVerticalIcon className="w-5 h-5"/>
                        </button>
                        {isManageMenuOpen && activeList && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                                {isOwner ? (
                                    <button onClick={handleDelete} className="w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 flex items-center gap-2">
                                        <TrashIcon className="w-4 h-4" />
                                        {t('shoppingList.delete.button')}
                                    </button>
                                ) : (
                                    <button onClick={handleLeave} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2">
                                        <XMarkIcon className="w-4 h-4" />
                                        {t('shoppingList.leave.button')}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                {isCreatingNewList ? (
                    <form onSubmit={handleCreateList} className="flex gap-2">
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

            {listMembers.length > 0 && (
              <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">{t('shoppingList.collaboration.members')}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                      {listMembers.map(member => (
                          <div key={member.id} className="group relative">
                              <div className="w-8 h-8 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-200 ring-2 ring-white dark:ring-gray-800">
                                  {getInitials(member.display_name)}
                              </div>
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                  {member.id === currentUser?.id ? `${member.display_name} (${t('shoppingList.collaboration.you')})` : member.display_name}
                              </span>
                          </div>
                      ))}
                  </div>
              </div>
            )}
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 -mr-2 border-t border-gray-200 dark:border-gray-700 pt-4">
            {listData.length > 0 ? (
                <div className="space-y-6">
                    {sortedGroupNames.map(groupName => (
                        <section key={groupName}>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 border-b-2 border-gray-200 dark:border-gray-700 pb-1">
                                {groupName}
                            </h3>
                            <ul className="space-y-3">
                                {groupedItems[groupName].map(item => (
                                    <ShoppingListItem
                                        key={item.shoppingListItemId}
                                        item={item}
                                        onRemove={onRemove}
                                        onToggleChecked={onToggleChecked}
                                        isExpanded={expandedItemId === item.id}
                                        onExpand={handleExpand}
                                        members={listMembers}
                                        currentUser={currentUser}
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

        {listData.length > 0 && (
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                <button
                    onClick={onClear}
                    disabled={checkedItemsCount === 0}
                    className="w-full px-6 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition-colors disabled:bg-red-400 dark:disabled:bg-gray-600"
                >
                    {t('shoppingList.clear')} ({checkedItemsCount})
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
