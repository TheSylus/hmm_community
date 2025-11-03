import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/index';
import { XMarkIcon, TrashIcon, ShoppingBagIcon, ChevronDownIcon, CameraIcon, ShareIcon, SpinnerIcon, UserCircleIcon, CheckCircleIcon, EllipsisVerticalIcon, UserPlusIcon, UserGroupIcon } from './Icons';
import { useTranslatedItem } from '../hooks/useTranslatedItem';
// FIX: Correctly import HydratedShoppingListItem, as HydratedGroupShoppingListItem is not exported.
import { HydratedShoppingListItem } from '../App';
// FIX: Use renamed ShoppingList type (aliased as FoodGroup for minimal changes) and other types.
import { ShoppingList as FoodGroup, UserProfile, FoodItem, Like, CommentWithProfile } from '../types';
import { User } from '@supabase/supabase-js';
import { FoodItemCard } from './FoodItemCard';

interface GroupModalProps {
  allGroups: FoodGroup[];
  activeGroupId: string | null;
  listData: HydratedShoppingListItem[];
  listMembers: UserProfile[];
  currentUser: User | null;
  groupFeedItems: FoodItem[];
  likes: Like[];
  comments: CommentWithProfile[];
  onRemove: (groupShoppingListItemId: string) => void;
  onClear: () => void;
  onClose: () => void;
  onToggleChecked: (groupShoppingListItemId: string, isChecked: boolean) => void;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: (name: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onLeaveGroup: (groupId: string) => void;
  onViewDetails: (item: FoodItem) => void;
  onAddToGroupShoppingList: (item: FoodItem) => void;
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
    ? t('group.collaboration.you') 
    : (member?.display_name.split('@')[0] || t('group.collaboration.someone'));
  
  const actionText = action === 'added' 
    ? t('group.collaboration.addedBy', { name })
    : t('group.collaboration.checkedBy', { name });

  const Icon = action === 'added' ? UserCircleIcon : CheckCircleIcon;

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-1">
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{actionText}</span>
    </div>
  );
};


const GroupShoppingListItemFC: React.FC<{
  // FIX: Use the correct HydratedShoppingListItem type.
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
                    // FIX: Use shoppingListItemId property from the correct type.
                    id={`item-${displayItem.shoppingListItemId}`}
                    type="checkbox"
                    checked={displayItem.checked}
                    // FIX: Use shoppingListItemId property from the correct type.
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
                    // FIX: Use shoppingListItemId property from the correct type.
                    onClick={() => onRemove(displayItem.shoppingListItemId)}
                    className="p-1.5 rounded-full text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    aria-label={t('group.removeAria', { name: displayItem.name })}
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={() => onExpand(displayItem.id)}
                    className="p-1.5 rounded-full text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    aria-label={t('group.toggleDetailsAria')}
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


export const GroupModal: React.FC<GroupModalProps> = ({ 
  allGroups, activeGroupId, listData, listMembers, currentUser, groupFeedItems, likes, comments, onRemove, onClear, onClose, onToggleChecked, onSelectGroup, onCreateGroup, onDeleteGroup, onLeaveGroup, onViewDetails, onAddToGroupShoppingList
}) => {
  const { t } = useTranslation();
  const [view, setView] = useState<'list' | 'feed'>('list');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copying' | 'copied'>('idle');
  const [isManageMenuOpen, setIsManageMenuOpen] = useState(false);
  const manageMenuRef = useRef<HTMLDivElement>(null);


  const activeGroup = useMemo(() => allGroups.find(l => l.id === activeGroupId), [allGroups, activeGroupId]);
  const isOwner = useMemo(() => currentUser && activeGroup && currentUser.id === activeGroup.owner_id, [currentUser, activeGroup]);


  const handleExpand = useCallback((foodItemId: string) => {
    setExpandedItemId(prev => prev === foodItemId ? null : foodItemId);
  }, []);

  const handleDelete = () => {
    if (!activeGroup) return;
    if (window.confirm(t('group.delete.confirm', { groupName: activeGroup.name }))) {
        onDeleteGroup(activeGroup.id);
        setIsManageMenuOpen(false);
    }
  };

  const handleLeave = () => {
    if (!activeGroup) return;
    if (window.confirm(t('group.leave.confirm', { groupName: activeGroup.name }))) {
        onLeaveGroup(activeGroup.id);
        setIsManageMenuOpen(false);
    }
  };

  const handleShareGroup = useCallback(async () => {
    if (!activeGroupId) return;
    setShareStatus('copying');
    const inviteUrl = `${window.location.origin}${window.location.pathname}?join_group=${activeGroupId}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy share link:', err);
      alert(t('group.share.copyFailed'));
      setShareStatus('idle');
    }
  }, [activeGroupId, t]);

  const getInitials = (name: string) => {
      if (!name) return '?';
      const parts = name.split('@')[0].replace(/[^a-zA-Z\s]/g, ' ').split(' ');
      if (parts.length > 1 && parts[0] && parts[parts.length -1]) {
          return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
  };

  const groupedItems = useMemo(() => {
    const uncategorizedKey = t('group.uncategorized');
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
      const uncategorizedKey = t('group.uncategorized');
      return Object.keys(groupedItems).sort((a, b) => {
          if (a === uncategorizedKey) return 1;
          if (b === uncategorizedKey) return -1;
          return a.localeCompare(b);
      });
  }, [groupedItems, t]);

  const checkedItemsCount = useMemo(() => listData.filter(item => item.checked).length, [listData]);

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
      aria-labelledby="group-modal-title"
    >
      <div
        className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
            <h2 id="group-modal-title" className="text-2xl font-bold text-gray-900 dark:text-white">{activeGroup?.name || t('group.title')}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label={t('settings.closeAria')}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
        </div>
        
        <div className="mb-4 space-y-4 shrink-0">
             <div className="space-y-2">
                 <div ref={manageMenuRef} className="relative w-min ml-auto -mb-2">
                    <button onClick={() => setIsManageMenuOpen(prev => !prev)} className="p-2 h-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors" title={t('group.manage.buttonTitle')}>
                        <EllipsisVerticalIcon className="w-5 h-5"/>
                    </button>
                    {isManageMenuOpen && activeGroup && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10 animate-fade-in-fast">
                            {isOwner ? (
                                <button onClick={handleDelete} className="w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 flex items-center gap-2 transition-colors">
                                    <TrashIcon className="w-4 h-4" />
                                    {t('group.delete.button')}
                                </button>
                            ) : (
                                <button onClick={handleLeave} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 transition-colors">
                                    <XMarkIcon className="w-4 h-4" />
                                    {t('group.leave.button')}
                                </button>
                            )}
                        </div>
                    )}
                </div>

            <div className="bg-gray-100 dark:bg-gray-700/50 p-3 rounded-lg space-y-3">
                 <div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">{t('group.collaboration.members')}</h3>
                    <div className="flex flex-wrap items-center gap-2">
                        {listMembers.map(member => (
                            <div key={member.id} className="group relative">
                                <div className="w-8 h-8 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-200 ring-2 ring-white dark:ring-gray-800">
                                    {getInitials(member.display_name)}
                                </div>
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    {member.id === currentUser?.id ? `${member.display_name} (${t('group.collaboration.you')})` : member.display_name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                 <button onClick={handleShareGroup} disabled={shareStatus !== 'idle'} className="w-full flex items-center justify-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded-md transition-colors disabled:opacity-70">
                    {shareStatus === 'copying' && <SpinnerIcon className="w-5 h-5" />}
                    {shareStatus === 'copied' && <CheckCircleIcon className="w-5 h-5" />}
                    {shareStatus === 'idle' && <UserPlusIcon className="w-5 h-5"/>}
                    <span>{shareStatus === 'copied' ? t('group.share.linkCopied') : t('group.share.inviteButton')}</span>
                </button>
            </div>
            
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button onClick={() => setView('list')} className={`flex-1 text-center px-4 py-2 font-semibold transition-colors ${view === 'list' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>{t('group.tab.checklist')}</button>
                <button onClick={() => setView('feed')} className={`flex-1 text-center px-4 py-2 font-semibold transition-colors ${view === 'feed' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>{t('group.tab.feed')}</button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            {view === 'list' && (
                <>
                    {listData.length > 0 ? (
                        <div className="space-y-6">
                            {sortedGroupNames.map(groupName => (
                                <section key={groupName}>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 border-b-2 border-gray-200 dark:border-gray-700 pb-1">
                                        {groupName}
                                    </h3>
                                    <ul className="space-y-3">
                                        {groupedItems[groupName].map(item => (
                                            <GroupShoppingListItemFC
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
                            <p>{t('group.empty')}</p>
                        </div>
                    )}
                </>
            )}

            {view === 'feed' && (
                <>
                    {groupFeedItems.length > 0 ? (
                        <div className="space-y-4">
                            {groupFeedItems.map(item => (
                                 <FoodItemCard 
                                    key={item.id} 
                                    item={item} 
                                    onDelete={() => {}} 
                                    onEdit={() => {}}
                                    onViewDetails={onViewDetails}
                                    onAddToGroupShoppingList={onAddToGroupShoppingList}
                                    isPreview={true}
                                    likes={likes.filter(l => l.food_item_id === item.id)}
                                    comments={comments.filter(c => c.food_item_id === item.id)}
                                />
                            ))}
                        </div>
                    ) : (
                         <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                            <UserGroupIcon className="w-16 h-16 mb-4" />
                            <p>{t('group.feed.empty')}</p>
                        </div>
                    )}
                </>
            )}

        </div>

        {view === 'list' && listData.length > 0 && (
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 shrink-0">
                <button
                    onClick={onClear}
                    disabled={checkedItemsCount === 0}
                    className="w-full px-6 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition-colors disabled:bg-red-400 dark:disabled:bg-gray-600"
                >
                    {t('group.clear')} ({checkedItemsCount})
                </button>
            </div>
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