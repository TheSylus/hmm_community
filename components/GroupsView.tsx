import React, { useState } from 'react';
import { ShoppingList, UserProfile } from '../types';
import { useTranslation } from '../i18n';
import { UserGroupIcon, PlusCircleIcon, SpinnerIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon } from './Icons';
import { useToast } from '../contexts/ToastContext';

interface GroupsViewProps {
  shoppingLists: ShoppingList[];
  members: Record<string, UserProfile[]>;
  onSelectList: (listId: string) => void;
  onCreateList: (name: string) => Promise<any>;
  onRenameList: (args: { listId: string, name: string }) => Promise<any>;
  onDeleteList: (listId: string) => Promise<any>;
  onManageMembers: (list: ShoppingList) => void;
}

const GroupCard: React.FC<{
  list: ShoppingList;
  memberCount: number;
  onSelect: () => void;
  onRename: (listId: string, newName: string) => void;
  onDelete: (listId: string) => void;
  onManageMembers: (list: ShoppingList) => void;
}> = ({ list, memberCount, onSelect, onRename, onDelete, onManageMembers }) => {
    const { t } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleRename = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        const newName = prompt(t('groups.renamePrompt'), list.name);
        if (newName && newName.trim() !== list.name) {
            onRename(list.id, newName.trim());
        }
    };
    
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        if (window.confirm(t('groups.deleteConfirm', { listName: list.name }))) {
            onDelete(list.id);
        }
    };

    const handleManage = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsMenuOpen(false);
      onManageMembers(list);
    }
    
    return (
        <div onClick={onSelect} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate pr-2">{list.name}</h3>
                <div className="relative">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                        className="p-1 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                        <EllipsisVerticalIcon className="w-5 h-5"/>
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10" onMouseLeave={() => setIsMenuOpen(false)}>
                            <div className="py-1">
                                <button onClick={handleRename} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"><PencilIcon className="w-4 h-4" /> {t('groups.menu.rename')}</button>
                                <button onClick={handleManage} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"><UserGroupIcon className="w-4 h-4" /> {t('shoppingMode.menu.manageMembers')}</button>
                                <button onClick={handleDelete} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50"><TrashIcon className="w-4 h-4" /> {t('groups.menu.delete')}</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-2">
                <UserGroupIcon className="w-4 h-4" />
                <span>{t('groups.members', { count: memberCount })}</span>
            </div>
        </div>
    );
};


export const GroupsView: React.FC<GroupsViewProps> = ({ shoppingLists, members, onSelectList, onCreateList, onRenameList, onDeleteList, onManageMembers }) => {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [newListName, setNewListName] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newListName.trim() && !isCreating) {
      const nameToCreate = newListName.trim();
      setIsCreating(true);
      try {
        await onCreateList(nameToCreate);
        setNewListName('');
        addToast({ message: t('toast.groupCreated', { groupName: nameToCreate }), type: 'success' });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not create group.";
        addToast({ message, type: 'error' });
      } finally {
        setIsCreating(false);
      }
    }
  };

  const handleRename = async (listId: string, newName: string) => {
    try {
        await onRenameList({ listId, name: newName });
        addToast({ message: t('toast.listRenamed'), type: 'success' });
    } catch (error) {
        addToast({ message: t('toast.listRenameError'), type: 'error' });
    }
  };

  const handleDelete = async (listId: string) => {
      try {
          await onDeleteList(listId);
          addToast({ message: t('toast.listDeleted'), type: 'info' });
      } catch (error) {
          addToast({ message: t('toast.listDeleteError'), type: 'error' });
      }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">{t('groups.title')}</h1>
      
      <form onSubmit={handleCreate} className="mb-8 flex gap-2">
        <input 
          type="text"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          placeholder={t('groups.newListPlaceholder')}
          className="flex-grow bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2"
          disabled={isCreating}
        />
        <button 
            type="submit" 
            className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:bg-indigo-400 dark:disabled:bg-gray-600"
            disabled={isCreating || !newListName.trim()}
        >
          {isCreating ? <SpinnerIcon className="w-5 h-5" /> : <PlusCircleIcon className="w-5 h-5" />}
          {t('groups.createButton')}
        </button>
      </form>

      {shoppingLists.length === 0 ? (
        <div className="text-center py-10">
          <UserGroupIcon className="w-16 h-16 mx-auto text-gray-400" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('groups.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shoppingLists.map(list => (
            <GroupCard 
                key={list.id} 
                list={list}
                memberCount={members[list.id]?.length || 0}
                onSelect={() => onSelectList(list.id)}
                onRename={handleRename}
                onDelete={handleDelete}
                onManageMembers={onManageMembers}
            />
          ))}
        </div>
      )}
    </div>
  );
}
