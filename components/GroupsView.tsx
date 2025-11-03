import React from 'react';
import { ShoppingList } from '../types';
import { useTranslation } from '../i18n';
import { UserGroupIcon, PlusCircleIcon } from './Icons';

interface GroupsViewProps {
  shoppingLists: ShoppingList[];
  onSelectList: (listId: string) => void;
  onCreateList: (name: string) => void;
}

export const GroupsView: React.FC<GroupsViewProps> = ({ shoppingLists, onSelectList, onCreateList }) => {
  const { t } = useTranslation();
  const [newListName, setNewListName] = React.useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListName.trim()) {
      onCreateList(newListName.trim());
      setNewListName('');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">{t('groups.title', {defaultValue: 'My Shopping Lists'})}</h1>
      
      <form onSubmit={handleCreate} className="mb-8 flex gap-2">
        <input 
          type="text"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          placeholder={t('groups.newListPlaceholder', {defaultValue: 'New list name...'})}
          className="flex-grow bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2"
        />
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2">
          <PlusCircleIcon className="w-5 h-5" />
          {t('groups.createButton', {defaultValue: 'Create'})}
        </button>
      </form>

      {shoppingLists.length === 0 ? (
        <div className="text-center py-10">
          <UserGroupIcon className="w-16 h-16 mx-auto text-gray-400" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('groups.empty', {defaultValue: 'You are not a member of any shopping lists yet.'})}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shoppingLists.map(list => (
            <div key={list.id} onClick={() => onSelectList(list.id)} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">{list.name}</h3>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
