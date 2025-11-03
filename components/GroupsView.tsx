import React, { useState } from 'react';
// FIX: Use the renamed `ShoppingList` type, aliased as `FoodGroup` for consistency within this component.
import { ShoppingList as FoodGroup, UserProfile } from '../types';
import { useTranslation } from '../i18n/index';
import { PlusCircleIcon, UserGroupIcon, XMarkIcon } from './Icons';

interface GroupsViewProps {
  groups: FoodGroup[];
  members: Record<string, UserProfile[]>; // object where key is group_id
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: (name: string) => void;
}

const CreateGroupModal: React.FC<{
  onClose: () => void;
  onCreate: (name: string) => void;
}> = ({ onClose, onCreate }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">{t('group.newListButton')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('group.newListPlaceholder')}
            className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3"
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-semibold">{t('form.button.cancel')}</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold disabled:bg-indigo-400" disabled={!name.trim()}>{t('group.createButton')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const GroupsView: React.FC<GroupsViewProps> = ({ groups, members, onSelectGroup, onCreateGroup }) => {
  const { t } = useTranslation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreate = (name: string) => {
    onCreateGroup(name);
    setIsCreateModalOpen(false);
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6 text-center">{t('nav.groups')}</h1>
      
      {groups.length === 0 ? (
        <div className="text-center py-10 px-4">
          <UserGroupIcon className="w-16 h-16 mx-auto text-indigo-400" />
          <h2 className="mt-4 text-2xl font-semibold text-gray-600 dark:text-gray-400">{t('group.empty.title')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6">{t('group.empty.description')}</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center gap-2 mx-auto"
          >
            <PlusCircleIcon className="w-6 h-6" />
            <span>{t('group.empty.cta')}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(group => (
            <div
              key={group.id}
              onClick={() => onSelectGroup(group.id)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{group.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('group.memberCount', { count: members[group.id]?.length || 1 })}
              </p>
            </div>
          ))}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full mt-4 flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold py-3 px-3 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/50 border-2 border-dashed border-indigo-300 dark:border-indigo-700 transition-colors"
          >
            <PlusCircleIcon className="w-6 h-6" />
            <span>{t('group.newListButton')}</span>
          </button>
        </div>
      )}

      {isCreateModalOpen && <CreateGroupModal onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreate} />}
       <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
};