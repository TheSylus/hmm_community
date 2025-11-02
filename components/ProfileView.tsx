import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { FoodItem, Collection, UserProfile } from '../types';
import { FoodItemCard } from './FoodItemCard';
import { useTranslation } from '../i18n';
import { SpinnerIcon, UserCircleIcon, BookmarkSquareIcon } from './Icons';

interface ProfileViewProps {
  userId: string;
  onViewDetails: (item: FoodItem) => void;
  onViewCollection: (collection: Collection) => void;
  onClose: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ userId, onViewDetails, onViewCollection, onClose }) => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'entries' | 'collections'>('entries');

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      const [
        { data: profileData, error: profileError },
        { data: itemsData, error: itemsError },
        { data: collectionsData, error: collectionsError }
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('food_items').select('*').eq('user_id', userId).eq('isPublic', true),
        supabase.from('collections').select('*, collection_items(food_items(*))').eq('user_id', userId).eq('is_public', true)
      ]);

      if (profileError) console.error("Error fetching profile:", profileError);
      else setProfile(profileData);

      if (itemsError) console.error("Error fetching user items:", itemsError);
      else setItems(itemsData || []);

      if (collectionsError) console.error("Error fetching user collections:", collectionsError);
      else setCollections(collectionsData as Collection[] || []);
      
      setIsLoading(false);
    };

    fetchProfileData();
  }, [userId]);

  const TabButton: React.FC<{ tabId: 'entries' | 'collections'; children: React.ReactNode }> = ({ tabId, children }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === tabId ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
    >
      {children}
    </button>
  );

  const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <div className="text-center py-10">
      <p className="text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <SpinnerIcon className="w-12 h-12 text-indigo-500" />
      </div>
    );
  }

  if (!profile) {
    return <EmptyState message="Profile not found." />;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 text-center mb-6">
        {t('profile.userTitle', { name: profile.display_name })}
      </h1>

      <div className="flex justify-center gap-2 mb-6">
        <TabButton tabId="entries">{t('profile.tab.entries')} ({items.length})</TabButton>
        <TabButton tabId="collections">{t('profile.tab.collections')} ({collections.length})</TabButton>
      </div>

      <div>
        {activeTab === 'entries' && (
          items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map(item => (
                <FoodItemCard key={item.id} item={item} onViewDetails={onViewDetails} onDelete={() => {}} onEdit={() => {}} onAddToShoppingList={() => {}} isPreview />
              ))}
            </div>
          ) : (
            <EmptyState message={t('profile.empty.entries')} />
          )
        )}
        {activeTab === 'collections' && (
          collections.length > 0 ? (
            <div className="space-y-4">
              {collections.map(collection => (
                <div key={collection.id} onClick={() => onViewCollection(collection)} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow">
                  <h3 className="font-bold text-lg text-indigo-600 dark:text-indigo-400">{collection.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{collection.description}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mt-2">
                    <BookmarkSquareIcon className="w-4 h-4" />
                    <span>{collection.collection_items.length} {collection.collection_items.length === 1 ? 'item' : 'items'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message={t('profile.empty.collections')} />
          )
        )}
      </div>
    </div>
  );
};