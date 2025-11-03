import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './services/supabaseClient';
import { FoodItem, FoodItemType, ShoppingList, Like, CommentWithProfile, UserProfile, ShoppingListItem } from './types';
import { FoodItemForm } from './components/FoodItemForm';
import { FoodItemList } from './components/FoodItemList';
import { SettingsModal } from './components/SettingsModal';
import { useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { FoodItemDetailModal } from './components/FoodItemDetailModal';
import { ImageModal } from './components/ImageModal';
import { Dashboard } from './components/Dashboard';
import { DiscoverView } from './components/DiscoverView';
import { ShoppingListModal } from './components/ShoppingListModal';
import { FilterPanel } from './components/FilterPanel';
import { performConversationalSearch } from './services/geminiService';
import { HomeIcon, MagnifyingGlassIcon, GlobeAltIcon, ShoppingBagIcon, SettingsIcon, FunnelIcon, UserGroupIcon, PlusCircleIcon } from './components/Icons';
import { useTranslation } from './i18n';
import { OfflineIndicator } from './components/OfflineIndicator';
import { DuplicateConfirmationModal } from './components/DuplicateConfirmationModal';
import { GroupsView } from './components/GroupsView';
import { ApiKeyBanner } from './components/ApiKeyBanner';
import { hasValidApiKey } from './services/geminiService';

export type SortKey = 'date_desc' | 'date_asc' | 'rating_desc' | 'rating_asc' | 'name_asc' | 'name_desc';
export type RatingFilter = 'all' | 'liked' | 'disliked';
export type TypeFilter = 'all' | 'product' | 'dish';
export type View = 'dashboard' | 'list' | 'discover' | 'groups';

export interface HydratedShoppingListItem extends FoodItem {
    shoppingListItemId: string;
    checked: boolean;
    added_by_user_id: string;
    checked_by_user_id: string | null;
}

const App: React.FC = () => {
    const { session, user } = useAuth();
    const { t } = useTranslation();

    // App state
    const [items, setItems] = useState<FoodItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<View>('dashboard');
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // Form and modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
    const [formItemType, setFormItemType] = useState<FoodItemType>('product');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    // ... and many more states would be here in a real app

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);
    
    // Placeholder for fetching data
    const fetchItems = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        const { data, error } = await supabase
            .from('food_items')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching items:', error);
        } else if (data) {
            setItems(data as FoodItem[]);
        }
        setIsLoading(false);
    }, [user]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);
    
    // Dummy handlers
    const handleSaveItem = async (itemData: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) => {
      // In a real app, this would save to Supabase
      console.log('Saving item', itemData);
      setIsFormOpen(false);
      setEditingItem(null);
      await fetchItems(); // Refetch
    };
    
    const handleDeleteItem = async (id: string) => {
      // In a real app, this would delete from Supabase
      console.log('Deleting item', id);
      await fetchItems(); // Refetch
    };

    if (!session) {
        return <Auth />;
    }

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
            <OfflineIndicator isOnline={isOnline} />
            {/* A simplified layout */}
            <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('header.title')}</h1>
                <nav className="flex items-center gap-4">
                    <button onClick={() => setView('dashboard')}><HomeIcon className="w-6 h-6" /></button>
                    <button onClick={() => setView('list')}><MagnifyingGlassIcon className="w-6 h-6" /></button>
                    <button onClick={() => setView('discover')}><GlobeAltIcon className="w-6 h-6" /></button>
                    <button onClick={() => setView('groups')}><UserGroupIcon className="w-6 h-6" /></button>
                    <button onClick={() => setIsSettingsOpen(true)}><SettingsIcon className="w-6 h-6" /></button>
                </nav>
            </header>

            <main className="container mx-auto p-4">
              <button
                onClick={() => {
                  setEditingItem(null);
                  setFormItemType('product');
                  setIsFormOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full flex items-center gap-2"
              >
                <PlusCircleIcon className="w-6 h-6" />
                {t('form.addNewButton')}
              </button>

              {view === 'dashboard' && <Dashboard items={items} onViewAll={() => setView('list')} onAddNew={() => setIsFormOpen(true)} onDelete={handleDeleteItem} onEdit={(id) => { /* find and set editingItem */ }} onViewDetails={(item) => { /* set detail view item */ }} onAddToGroupShoppingList={(item) => {}} />}
              {view === 'list' && <FoodItemList items={items} onDelete={handleDeleteItem} onEdit={(id) => { /* find and set editingItem */ }} onViewDetails={(item) => { /* set detail view item */ }} onAddToGroupShoppingList={(item) => {}}/>}
              {/* Other views would be here */}
            </main>

            {isFormOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-20" onClick={() => setIsFormOpen(false)}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg p-4" onClick={(e) => e.stopPropagation()}>
                    <FoodItemForm
                      onSaveItem={handleSaveItem}
                      onCancel={() => { setIsFormOpen(false); setEditingItem(null); }}
                      initialData={editingItem}
                      itemType={formItemType}
                      shoppingLists={[]}
                    />
                  </div>
                </div>
            )}

            {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
        </div>
    );
};

export default App;
