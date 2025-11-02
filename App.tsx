import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FoodItem, FoodItemType, Like, CommentWithProfile, ShoppingList, ShoppingListItem, UserProfile } from './types';
import { supabase } from './services/supabaseClient';
import { useAuth } from './contexts/AuthContext';
import { useAppSettings } from './contexts/AppSettingsContext';
import { hasValidApiKey, setApiKey as setGeminiApiKey, performConversationalSearch } from './services/geminiService';

import { Auth } from './components/Auth';
import { ApiKeyBanner } from './components/ApiKeyBanner';
import { ApiKeyModal } from './components/ApiKeyModal';
import { FoodItemList } from './components/FoodItemList';
import { FoodItemForm } from './components/FoodItemForm';
import { Dashboard } from './components/Dashboard';
import { DiscoverView } from './components/DiscoverView';
import { SettingsModal } from './components/SettingsModal';
import { FoodItemDetailModal } from './components/FoodItemDetailModal';
import { ImageModal } from './components/ImageModal';
import { DuplicateConfirmationModal } from './components/DuplicateConfirmationModal';
import { ShoppingListModal } from './components/ShoppingListModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { FilterPanel } from './components/FilterPanel';
import { useTranslation } from './i18n';
import { GlobeAltIcon, HomeIcon, ListBulletIcon, PlusCircleIcon, Cog6ToothIcon, ShoppingBagIcon } from './components/Icons';

export type View = 'dashboard' | 'list' | 'discover';
export type SortKey = 'date_desc' | 'date_asc' | 'rating_desc' | 'rating_asc' | 'name_asc' | 'name_desc';
export type RatingFilter = 'all' | 'liked' | 'disliked';
export type TypeFilter = 'all' | 'product' | 'dish';

export interface HydratedShoppingListItem extends FoodItem {
    shoppingListItemId: string;
    checked: boolean;
    added_by_user_id: string;
    checked_by_user_id: string | null;
}

const App: React.FC = () => {
    const { session, user } = useAuth();
    const { isAiEnabled } = useAppSettings();
    const { t } = useTranslation();

    const [view, setView] = useState<View>('dashboard');
    const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [formItemType, setFormItemType] = useState<FoodItemType>('product');

    // State for modals and banners
    const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);
    const [showApiKeyBanner, setShowApiKeyBanner] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [detailedItem, setDetailedItem] = useState<FoodItem | null>(null);
    const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
    const [duplicateItems, setDuplicateItems] = useState<FoodItem[]>([]);
    const [itemToSave, setItemToSave] = useState<Omit<FoodItem, 'id' | 'user_id' | 'created_at'> | null>(null);

    // Online/Offline status
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // Filter and Sort State
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
    const [sortBy, setSortBy] = useState<SortKey>('date_desc');
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    
    // AI Search
    const [aiSearchResults, setAiSearchResults] = useState<string[] | null>(null);
    const [isAiSearchLoading, setIsAiSearchLoading] = useState(false);
    
    // Community (Discover) State
    const [communityItems, setCommunityItems] = useState<FoodItem[]>([]);
    const [communityLikes, setCommunityLikes] = useState<Like[]>([]);
    const [communityComments, setCommunityComments] = useState<CommentWithProfile[]>([]);
    const [isCommunityLoading, setIsCommunityLoading] = useState(false);
    
    // Shopping List State
    const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
    const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
    const [activeShoppingListId, setActiveShoppingListId] = useState<string | null>(null);
    const [shoppingListItems, setShoppingListItems] = useState<HydratedShoppingListItem[]>([]);
    const [shoppingListMembers, setShoppingListMembers] = useState<UserProfile[]>([]);
    
    // Placeholder for a simple header
    const Header = () => (
        <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">{t('header.title')}</h1>
            <button onClick={() => setShowSettingsModal(true)}><Cog6ToothIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" /></button>
        </header>
    );

    // Placeholder for a simple navigation
    const Navigation = () => (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-[0_-2px_5px_rgba(0,0,0,0.1)] flex justify-around p-2">
            <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-indigo-600' : ''}`}><HomeIcon className="w-6 h-6"/>Dashboard</button>
            <button onClick={() => setView('list')} className={`flex flex-col items-center gap-1 ${view === 'list' ? 'text-indigo-600' : ''}`}><ListBulletIcon className="w-6 h-6"/>List</button>
            <button onClick={() => { setFormItemType('product'); setIsFormVisible(true); }} className="p-4 bg-indigo-600 text-white rounded-full -mt-8 shadow-lg"><PlusCircleIcon className="w-8 h-8"/></button>
            <button onClick={() => setView('discover')} className={`flex flex-col items-center gap-1 ${view === 'discover' ? 'text-indigo-600' : ''}`}><GlobeAltIcon className="w-6 h-6"/>Discover</button>
            <button onClick={() => setIsShoppingListOpen(true)} className="flex flex-col items-center gap-1"><ShoppingBagIcon className="w-6 h-6"/>Shopping List</button>
        </nav>
    );
    
    useEffect(() => {
        // Check for API key on mount
        const keyExists = hasValidApiKey();
        if (isAiEnabled && !keyExists) {
            const hasBeenDismissed = localStorage.getItem('apiKeyBannerDismissed') === 'true';
            if (!hasBeenDismissed) {
                setShowApiKeyBanner(true);
            }
        }
    }, [isAiEnabled]);

    const handleKeySave = (apiKey: string) => {
        setGeminiApiKey(apiKey);
        setIsApiKeyMissing(false);
        setShowApiKeyBanner(false);
    };

    const fetchFoodItems = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        const { data, error } = await supabase
            .from('food_items')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        if (error) console.error('Error fetching food items:', error);
        else setFoodItems(data || []);
        setIsLoading(false);
    }, [user]);

    useEffect(() => {
        if (session) {
            fetchFoodItems();
        }
    }, [session, fetchFoodItems]);

    // Main logic for adding/updating items
    const handleSaveItem = async (itemData: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) => {
        if (!user) return;

        if (editingItem) {
            // Update
            const { data, error } = await supabase
                .from('food_items')
                .update(itemData)
                .eq('id', editingItem.id)
                .select();
            if (error) {
                console.error("Error updating item:", error);
            } else if (data) {
                setFoodItems(foodItems.map(item => item.id === editingItem.id ? data[0] : item));
            }
        } else {
            // Create
             const { data, error } = await supabase
                .from('food_items')
                .insert({ ...itemData, user_id: user.id })
                .select();
            if (error) {
                console.error("Error adding item:", error);
            } else if (data) {
                setFoodItems([data[0], ...foodItems]);
            }
        }
        setIsFormVisible(false);
        setEditingItem(null);
    };
    
    // Add other handlers (delete, edit, etc.)
    const handleDeleteItem = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            const { error } = await supabase.from('food_items').delete().eq('id', id);
            if (error) console.error('Error deleting item', error);
            else setFoodItems(foodItems.filter(item => item.id !== id));
        }
    };
    
    const handleEditItem = (id: string) => {
        const item = foodItems.find(i => i.id === id);
        if (item) {
            setEditingItem(item);
            setFormItemType(item.itemType);
            setIsFormVisible(true);
        }
    };

    if (!session) {
        return <Auth />;
    }

    if (isApiKeyMissing) {
        return <ApiKeyModal onKeySave={handleKeySave} />;
    }

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
            {showApiKeyBanner && (
                 <ApiKeyBanner 
                    onDismiss={() => {
                        setShowApiKeyBanner(false);
                        localStorage.setItem('apiKeyBannerDismissed', 'true');
                    }}
                    onOpenSettings={() => {
                        setShowApiKeyBanner(false);
                        setShowSettingsModal(true);
                    }}
                />
            )}
            <Header />
            <main className="p-4 pb-24">
                {isFormVisible ? (
                    <FoodItemForm 
                        onSaveItem={handleSaveItem} 
                        onCancel={() => { setIsFormVisible(false); setEditingItem(null); }}
                        initialData={editingItem}
                        itemType={formItemType}
                    />
                ) : (
                    <>
                        {view === 'dashboard' && <Dashboard items={foodItems} onViewAll={() => setView('list')} onAddNew={() => setIsFormVisible(true)} onDelete={handleDeleteItem} onEdit={handleEditItem} onViewDetails={setDetailedItem} onAddToShoppingList={()=>{}} />}
                        {view === 'list' && <FoodItemList items={foodItems} onDelete={handleDeleteItem} onEdit={handleEditItem} onViewDetails={setDetailedItem} onAddToShoppingList={() => {}} />}
                        {view === 'discover' && <DiscoverView items={communityItems} likes={communityLikes} comments={communityComments} isLoading={isCommunityLoading} onViewDetails={setDetailedItem} />}
                    </>
                )}
            </main>
            <Navigation />
            
            {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} />}
            {/* Other modals would go here */}
        </div>
    );
};

export default App;
