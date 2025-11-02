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
    const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

    // State for modals and banners
    const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);
    const [showApiKeyBanner, setShowApiKeyBanner] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [detailedItem, setDetailedItem] = useState<FoodItem | null>(null);
    const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
    
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
    
    const Header = () => (
        <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">{t('header.title')}</h1>
            <div className="flex items-center gap-2">
                <button onClick={() => setIsShoppingListOpen(true)} className="relative p-2">
                    <ShoppingBagIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    {shoppingListItems.length > 0 && (
                        <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">
                            {shoppingListItems.filter(i => !i.checked).length}
                        </span>
                    )}
                </button>
                <button onClick={() => setShowSettingsModal(true)}><Cog6ToothIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" /></button>
            </div>
        </header>
    );

    const Navigation = () => (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-[0_-2px_5px_rgba(0,0,0,0.1)] flex justify-around items-center h-16">
            <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 text-sm transition-colors ${view === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`}><HomeIcon className="w-6 h-6"/>{t('nav.dashboard')}</button>
            <button onClick={() => setView('list')} className={`flex flex-col items-center gap-1 text-sm transition-colors ${view === 'list' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`}><ListBulletIcon className="w-6 h-6"/>{t('nav.list')}</button>
            <button 
                onClick={() => { setFormItemType('product'); setIsFormVisible(true); }} 
                className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center transform -translate-y-1/3 shadow-lg hover:bg-indigo-700 transition-transform hover:scale-105"
                aria-label={t('nav.add')}
            >
                <PlusCircleIcon className="w-8 h-8"/>
            </button>
            <button onClick={() => setView('discover')} className={`flex flex-col items-center gap-1 text-sm transition-colors ${view === 'discover' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`}><GlobeAltIcon className="w-6 h-6"/>{t('nav.discover')}</button>
            <button onClick={() => setIsFilterPanelOpen(true)} className="flex flex-col items-center gap-1 text-sm text-gray-600 dark:text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M3.792 2.938A49.069 49.069 0 0112 2.25c2.797 0 5.54.236 8.209.688a1.857 1.857 0 011.541 1.836v1.044a3 3 0 01-.879 2.121l-6.182 6.182a1.5 1.5 0 00-.439 1.061v2.927a3 3 0 01-1.658 2.684l-1.757.878A.75.75 0 0112 21.75v-5.455a1.5 1.5 0 00-.439-1.061l-6.182-6.182A3 3 0 013.75 6.818v-1.044A1.857 1.857 0 013.792 2.938z" clipRule="evenodd" /></svg>{t('nav.filter')}</button>
        </nav>
    );
    
    useEffect(() => {
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

    const fetchAllData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);

        const [
            { data: itemsData, error: itemsError },
            { data: profileData, error: profileError },
            { data: listsData, error: listsError },
            { data: membersData, error: membersError }
        ] = await Promise.all([
            supabase.from('food_items').select('*').eq('user_id', user.id),
            supabase.from('profiles').select('*').eq('id', user.id).single(),
            supabase.from('shopping_lists').select('*'),
            supabase.from('shopping_list_members').select('*, profiles!inner(id, display_name)')
        ]);

        if (itemsError) console.error('Error fetching food items:', itemsError);
        else setFoodItems(itemsData || []);
        
        if (profileError && profileError.code !== 'PGRST116') console.error('Error fetching profile:', profileError);
        else setCurrentUserProfile(profileData);
        
        if (listsError) console.error('Error fetching lists:', listsError);
        else {
            const userLists = (membersData || []).filter(m => m.user_id === user.id).map(m => m.list_id);
            const visibleLists = (listsData || []).filter(l => userLists.includes(l.id));
            setShoppingLists(visibleLists);

            if (visibleLists.length > 0) {
                const currentActive = localStorage.getItem('activeListId');
                const newActiveId = currentActive && visibleLists.some(l => l.id === currentActive) ? currentActive : visibleLists[0].id;
                setActiveShoppingListId(newActiveId);
            } else {
                setActiveShoppingListId(null);
            }
        }
        
        setIsLoading(false);
    }, [user]);

    const fetchCommunityData = useCallback(async () => {
        setIsCommunityLoading(true);
        const [
            { data: itemsData, error: itemsError },
            { data: likesData, error: likesError },
            { data: commentsData, error: commentsError }
        ] = await Promise.all([
            supabase.from('food_items').select('*').eq('isPublic', true).neq('user_id', user?.id || '').order('created_at', { ascending: false }),
            supabase.from('likes').select('*'),
            supabase.from('comments').select('*, profiles(display_name)')
        ]);

        if (itemsError) console.error("Error fetching community items:", itemsError); else setCommunityItems(itemsData || []);
        if (likesError) console.error("Error fetching likes:", likesError); else setCommunityLikes(likesData || []);
        if (commentsError) console.error("Error fetching comments:", commentsError); else setCommunityComments(commentsData as CommentWithProfile[] || []);
        
        setIsCommunityLoading(false);
    }, [user?.id]);

    const fetchShoppingListData = useCallback(async () => {
        if (!activeShoppingListId) {
            setShoppingListItems([]);
            setShoppingListMembers([]);
            return;
        }

        const [
            { data: itemsData, error: itemsError },
            { data: membersData, error: membersError }
        ] = await Promise.all([
            supabase.from('shopping_list_items').select('*, food_items(*)').eq('list_id', activeShoppingListId),
            supabase.from('shopping_list_members').select('*, profiles!inner(id, display_name)').eq('list_id', activeShoppingListId)
        ]);
        
        if (itemsError) console.error("Error fetching list items:", itemsError);
        else {
            const hydratedItems = (itemsData || [])
                .filter(item => item.food_items)
                .map(item => ({
                    ...(item.food_items as FoodItem),
                    shoppingListItemId: item.id,
                    checked: item.checked,
                    added_by_user_id: item.added_by_user_id,
                    checked_by_user_id: item.checked_by_user_id,
                }));
            setShoppingListItems(hydratedItems);
        }

        if (membersError) console.error("Error fetching list members:", membersError);
        else {
            const members = (membersData || []).map(m => m.profiles as UserProfile);
            setShoppingListMembers(members);
        }
    }, [activeShoppingListId]);

    useEffect(() => {
        if (session) {
            fetchAllData();
            if (view === 'discover') fetchCommunityData();
        }
    }, [session, fetchAllData, view, fetchCommunityData]);

    useEffect(() => {
        fetchShoppingListData();
    }, [activeShoppingListId, fetchShoppingListData]);

    // Real-time Subscriptions
    useEffect(() => {
        if (!user) return;
        
        // My Items
        const itemChanges = supabase.channel('food_items')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'food_items', filter: `user_id=eq.${user.id}` }, payload => {
                fetchAllData(); // Refetch all my data on change
            }).subscribe();

        // Community Items
        const publicItemChanges = supabase.channel('public_food_items')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'food_items', filter: 'isPublic=eq.true' }, payload => {
                if(view === 'discover') fetchCommunityData();
            }).subscribe();

        // Likes & Comments
        const likesChanges = supabase.channel('likes').on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => {
            if(view === 'discover' || detailedItem) fetchCommunityData();
        }).subscribe();
        const commentsChanges = supabase.channel('comments').on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
            if(view === 'discover' || detailedItem) fetchCommunityData();
        }).subscribe();

        // Shopping Lists
        const listChanges = supabase.channel('shopping_lists').on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_lists' }, () => fetchAllData()).subscribe();
        const memberChanges = supabase.channel('shopping_list_members').on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_list_members' }, () => {
            fetchAllData();
            fetchShoppingListData();
        }).subscribe();
        const listItemChanges = supabase.channel('shopping_list_items').on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_list_items', filter: `list_id=eq.${activeShoppingListId}` }, () => fetchShoppingListData()).subscribe();

        return () => {
            supabase.removeChannel(itemChanges);
            supabase.removeChannel(publicItemChanges);
            supabase.removeChannel(likesChanges);
            supabase.removeChannel(commentsChanges);
            supabase.removeChannel(listChanges);
            supabase.removeChannel(memberChanges);
            supabase.removeChannel(listItemChanges);
        };
    }, [user, view, detailedItem, activeShoppingListId, fetchAllData, fetchCommunityData, fetchShoppingListData]);
    
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

    const handleSaveItem = async (itemData: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) => {
        if (!user) return;
        if (editingItem) {
            await supabase.from('food_items').update(itemData).eq('id', editingItem.id);
        } else {
            await supabase.from('food_items').insert({ ...itemData, user_id: user.id });
        }
        setIsFormVisible(false);
        setEditingItem(null);
    };
    
    const handleDeleteItem = async (id: string) => {
        if (window.confirm(t('card.deleteConfirm'))) {
            await supabase.from('food_items').delete().eq('id', id);
        }
    };
    
    const handleEditItem = (id: string) => {
        const item = [...foodItems, ...communityItems].find(i => i.id === id);
        if (item) {
            setEditingItem(item);
            setFormItemType(item.itemType);
            setIsFormVisible(true);
        }
    };
    
    const handleUpdateProfile = async (displayName: string): Promise<boolean> => {
        if (!user) return false;
        const { error } = await supabase.from('profiles').upsert({ id: user.id, display_name: displayName });
        if (error) { console.error('Error updating profile:', error); return false; }
        return true;
    };
    
    // Community Handlers
    const handleToggleLike = async (foodItemId: string) => {
        if (!user) return;
        const existingLike = communityLikes.find(l => l.food_item_id === foodItemId && l.user_id === user.id);
        if (existingLike) {
            await supabase.from('likes').delete().eq('id', existingLike.id);
        } else {
            await supabase.from('likes').insert({ food_item_id: foodItemId, user_id: user.id });
        }
    };

    const handleAddComment = async (foodItemId: string, content: string) => {
        if (!user) return;
        await supabase.from('comments').insert({ food_item_id: foodItemId, user_id: user.id, content });
    };

    const handleDeleteComment = async (commentId: string) => {
        await supabase.from('comments').delete().eq('id', commentId);
    };

    // Shopping List Handlers
    const handleAddToShoppingList = async (itemToAdd: FoodItem) => {
        if (!user || !activeShoppingListId) {
            setIsShoppingListOpen(true); // Prompt user to select a list
            return;
        }
        const isAlreadyOnList = shoppingListItems.some(li => li.food_item_id === itemToAdd.id);
        if (isAlreadyOnList) {
            setIsShoppingListOpen(true);
            return; // Already on list
        }
        await supabase.from('shopping_list_items').insert({ list_id: activeShoppingListId, food_item_id: itemToAdd.id, added_by_user_id: user.id });
        setIsShoppingListOpen(true);
    };

    const handleRemoveFromShoppingList = async (shoppingListItemId: string) => {
        await supabase.from('shopping_list_items').delete().eq('id', shoppingListItemId);
    };

    const handleToggleChecked = async (shoppingListItemId: string, isChecked: boolean) => {
        if (!user) return;
        await supabase.from('shopping_list_items').update({ checked: isChecked, checked_by_user_id: isChecked ? user.id : null }).eq('id', shoppingListItemId);
    };

    const handleClearCheckedItems = async () => {
        const checkedIds = shoppingListItems.filter(i => i.checked).map(i => i.shoppingListItemId);
        await supabase.from('shopping_list_items').delete().in('id', checkedIds);
    };

    const handleCreateList = async (name: string) => {
        if (!user) return;
        const { data } = await supabase.from('shopping_lists').insert({ name, owner_id: user.id }).select().single();
        if (data) {
            await supabase.from('shopping_list_members').insert({ list_id: data.id, user_id: user.id });
            setActiveShoppingListId(data.id);
        }
    };
    
    const handleDeleteList = async (listId: string) => {
        await supabase.from('shopping_lists').delete().eq('id', listId);
    };
    
    const handleLeaveList = async (listId: string) => {
        if (!user) return;
        await supabase.from('shopping_list_members').delete().eq('list_id', listId).eq('user_id', user.id);
    };
    
    const handleSelectList = (listId: string) => {
        setActiveShoppingListId(listId);
        localStorage.setItem('activeListId', listId);
    };


    if (!session) return <Auth />;
    if (isApiKeyMissing) return <ApiKeyModal onKeySave={handleKeySave} />;

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
            {showApiKeyBanner && <ApiKeyBanner onDismiss={() => { setShowApiKeyBanner(false); localStorage.setItem('apiKeyBannerDismissed', 'true'); }} onOpenSettings={() => { setShowApiKeyBanner(false); setShowSettingsModal(true); }} />}
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
                        {view === 'dashboard' && <Dashboard items={foodItems} onViewAll={() => setView('list')} onAddNew={() => { setFormItemType('product'); setIsFormVisible(true); }} onDelete={handleDeleteItem} onEdit={handleEditItem} onViewDetails={setDetailedItem} onAddToShoppingList={handleAddToShoppingList} />}
                        {view === 'list' && <FoodItemList items={foodItems} onDelete={handleDeleteItem} onEdit={handleEditItem} onViewDetails={setDetailedItem} onAddToShoppingList={handleAddToShoppingList} />}
                        {view === 'discover' && <DiscoverView items={communityItems} likes={communityLikes} comments={communityComments} isLoading={isCommunityLoading} onViewDetails={setDetailedItem} />}
                    </>
                )}
            </main>
            <Navigation />
            
            {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} onUpdateProfile={handleUpdateProfile} currentUserProfile={currentUserProfile} />}
            {detailedItem && <FoodItemDetailModal item={detailedItem} likes={communityLikes.filter(l => l.food_item_id === detailedItem.id)} comments={communityComments.filter(c => c.food_item_id === detailedItem.id)} currentUser={user} onClose={() => setDetailedItem(null)} onEdit={handleEditItem} onImageClick={setImageModalUrl} onToggleLike={handleToggleLike} onAddComment={handleAddComment} onDeleteComment={handleDeleteComment} />}
            {imageModalUrl && <ImageModal imageUrl={imageModalUrl} onClose={() => setImageModalUrl(null)} />}
            {isShoppingListOpen && <ShoppingListModal allLists={shoppingLists} activeListId={activeShoppingListId} listData={shoppingListItems} listMembers={shoppingListMembers} currentUser={user} onClose={() => setIsShoppingListOpen(false)} onRemove={handleRemoveFromShoppingList} onClear={handleClearCheckedItems} onToggleChecked={handleToggleChecked} onSelectList={handleSelectList} onCreateList={handleCreateList} onDeleteList={handleDeleteList} onLeaveList={handleLeaveList} />}
        </div>
    );
};

export default App;
