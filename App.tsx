import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './services/supabaseClient';
import { FoodItem, ShoppingList, ShoppingListItem, ShoppingListMember, UserProfile, HydratedShoppingListItem, FoodItemType, Like, CommentWithProfile, SortKey, RatingFilter, TypeFilter } from './types';
import { Auth } from './components/Auth';
import { FoodItemList } from './components/FoodItemList';
import { FoodItemForm } from './components/FoodItemForm';
import { useAuth } from './contexts/AuthContext';
import { useTranslation } from './i18n';
import { performConversationalSearch } from './services/geminiService';
import { Dashboard } from './components/Dashboard';
import { DiscoverView } from './components/DiscoverView';
import { GroupsView } from './components/GroupsView';
import { SettingsModal } from './components/SettingsModal';
import { FilterPanel } from './components/FilterPanel';
import { FoodItemDetailModal } from './components/FoodItemDetailModal';
import { ImageModal } from './components/ImageModal';
import { ShoppingListModal } from './components/ShoppingListModal';
import { DuplicateConfirmationModal } from './components/DuplicateConfirmationModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ApiKeyBanner } from './components/ApiKeyBanner';
import { ApiKeyModal } from './components/ApiKeyModal';
import { hasValidApiKey } from './services/geminiService';
import { useAppSettings } from './contexts/AppSettingsContext';
import { HomeIcon, DocumentTextIcon, GlobeAltIcon, UserGroupIcon, PlusCircleIcon, AdjustmentsHorizontalIcon, Cog6ToothIcon, ShoppingBagIcon } from './components/Icons';

type View = 'dashboard' | 'list' | 'discover' | 'groups';

const App: React.FC = () => {
    const { session, user } = useAuth();
    const { t } = useTranslation();
    const { isAiEnabled } = useAppSettings();

    // Data states
    const [allFoodItems, setAllFoodItems] = useState<FoodItem[]>([]);
    const [publicFoodItems, setPublicFoodItems] = useState<FoodItem[]>([]);
    const [likes, setLikes] = useState<Like[]>([]);
    const [comments, setComments] = useState<CommentWithProfile[]>([]);
    
    // Group and Shopping List states
    const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
    const [shoppingListMembers, setShoppingListMembers] = useState<Record<string, UserProfile[]>>({});
    const [allProfiles, setAllProfiles] = useState<Record<string, UserProfile>>({});
    const [allListItems, setAllListItems] = useState<ShoppingListItem[]>([]);
    const [activeShoppingListData, setActiveShoppingListData] = useState<{
        list: ShoppingList | null,
        members: UserProfile[],
        items: HydratedShoppingListItem[],
        feed: FoodItem[],
    }>({ list: null, members: [], items: [], feed: [] });


    // UI and Flow states
    const [loading, setLoading] = useState(true);
    const [isPublicItemsLoading, setIsPublicItemsLoading] = useState(false);
    const [view, setView] = useState<View>('dashboard');
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
    const [itemTypeToAdd, setItemTypeToAdd] = useState<FoodItemType>('product');

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<FoodItem | null>(null);
    const [isImageModalOpen, setIsImageModalOpen] = useState<string | null>(null);
    const [isShoppingListModalOpen, setIsShoppingListModalOpen] = useState(false);
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState<{ items: FoodItem[], newItem: Omit<FoodItem, 'id' | 'user_id' | 'created_at'> } | null>(null);
    
    // Filtering and sorting state
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
    const [sortBy, setSortBy] = useState<SortKey>('date_desc');
    const [aiSearchResultIds, setAiSearchResultIds] = useState<string[] | null>(null);
    const [isAiSearchLoading, setIsAiSearchLoading] = useState(false);

    // Offline status
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // API Key Management
    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
    const [showApiKeyBanner, setShowApiKeyBanner] = useState(false);

    // Memoized user's own items
    const userFoodItems = useMemo(() => allFoodItems.filter(item => item.user_id === user?.id), [allFoodItems, user]);
    
    useEffect(() => {
        const checkApiKey = () => {
            const isValid = hasValidApiKey();
            if (!isValid && !localStorage.getItem('apiKeyBannerDismissed')) {
                setShowApiKeyBanner(true);
            } else {
                setShowApiKeyBanner(false);
            }
        };

        checkApiKey();
        const interval = setInterval(checkApiKey, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleSaveApiKey = (apiKey: string) => {
        process.env.API_KEY = apiKey;
        setIsApiKeyModalOpen(false);
        setShowApiKeyBanner(false);
    };

    const handleDismissApiKeyBanner = () => {
        setShowApiKeyBanner(false);
        localStorage.setItem('apiKeyBannerDismissed', 'true');
    };

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        // Fetch ALL items the user can see (own + shared via RLS)
        const { data: foodData, error: foodError } = await supabase
            .from('food_items')
            .select('*')
            .order('created_at', { ascending: false });

        if (foodError) console.error('Error fetching food items:', foodError);
        else setAllFoodItems(foodData || []);
        
        // Fetch all lists the user is a member of
        const { data: listData, error: listError } = await supabase.rpc('get_user_shopping_lists');
        if (listError) console.error('Error fetching shopping lists:', listError);
        else setShoppingLists(listData || []);

        // Fetch all memberships for those lists
        const listIds = (listData || []).map(l => l.id);
        if (listIds.length > 0) {
            const { data: membersData, error: membersError } = await supabase
                .from('shopping_list_members')
                .select('list_id, user_id')
                .in('list_id', listIds);
            
            if (membersError) console.error('Error fetching members:', membersError);
            else {
                const userIds = [...new Set(membersData.map(m => m.user_id))];
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, display_name')
                    .in('id', userIds);
                
                if (profilesError) console.error('Error fetching profiles:', profilesError);
                else {
                    const profilesMap = (profilesData || []).reduce((acc, p) => {
                        acc[p.id] = p;
                        return acc;
                    }, {} as Record<string, UserProfile>);
                    setAllProfiles(profilesMap);
                    
                    const membersByList = (membersData || []).reduce((acc, member) => {
                        if (!acc[member.list_id]) acc[member.list_id] = [];
                        acc[member.list_id].push(member);
                        return acc;
                    }, {} as Record<string, {list_id: string, user_id: string}[]>);
                    
                    const finalMembersMap = Object.keys(membersByList).reduce((acc, listId) => {
                        acc[listId] = membersByList[listId]
                            .map(m => profilesMap[m.user_id])
                            .filter(Boolean);
                        return acc;
                    }, {} as Record<string, UserProfile[]>);
                    setShoppingListMembers(finalMembersMap);
                }
            }
            
            const { data: listItemsData, error: listItemsError } = await supabase
                .from('shopping_list_items')
                .select('*')
                .in('list_id', listIds);

            if (listItemsError) console.error('Error fetching list items:', listItemsError);
            else setAllListItems(listItemsData || []);
        }

        setLoading(false);
    }, [user]);


    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        navigator.serviceWorker.addEventListener('message', event => {
          if (event.data && event.data.type === 'SYNC_COMPLETE') fetchData();
        });
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [fetchData]);

    const fetchPublicData = useCallback(async () => {
        setIsPublicItemsLoading(true);
        const { data, error } = await supabase
            .from('food_items').select('*').eq('isPublic', true)
            .neq('user_id', user?.id || '').order('created_at', { ascending: false }).limit(50);
        if (error) console.error("Error fetching public food items:", error);
        else setPublicFoodItems(data || []);
        
        const { data: likesData, error: likesError } = await supabase.from('likes').select('*');
        if (likesError) console.error("Error fetching likes", likesError);
        else setLikes(likesData || []);

        const { data: commentsData, error: commentsError } = await supabase
            .from('comments').select(`*, profiles(display_name)`).order('created_at', { ascending: true });
        if (commentsError) console.error("Error fetching comments", commentsError);
        else setComments(commentsData as CommentWithProfile[] || []);

        setIsPublicItemsLoading(false);
    }, [user?.id]);

    useEffect(() => {
        if (session) {
            fetchData();
            fetchPublicData();
        }
    }, [session, fetchData, fetchPublicData]);

    const handleSaveItem = async (item: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) => {
        if (!user) return;
        
        const similarItems = userFoodItems.filter(fi => fi.name.toLowerCase().includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(fi.name.toLowerCase()));
        if (similarItems.length > 0 && !editingItem) {
            setIsDuplicateModalOpen({ items: similarItems, newItem: item });
            return;
        }
        await proceedWithSave(item);
    };

    const proceedWithSave = async (item: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) => {
        if (!user) return;
        if (editingItem) {
            const { data, error } = await supabase.from('food_items').update(item).eq('id', editingItem.id).select().single();
            if (error) console.error('Error updating item:', error);
            else if (data) setAllFoodItems(allFoodItems.map(i => i.id === data.id ? data : i));
        } else {
            const { data, error } = await supabase.from('food_items').insert({ ...item, user_id: user.id }).select().single();
            if (error) console.error('Error saving item:', error);
            else if (data) setAllFoodItems([data, ...allFoodItems]);
        }
        closeForm();
    };

    const handleDeleteItem = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            const { error } = await supabase.from('food_items').delete().eq('id', id);
            if (error) console.error('Error deleting item:', error);
            else setAllFoodItems(allFoodItems.filter(item => item.id !== id));
        }
    };
    
    const handleAddToGroupShoppingList = async (item: FoodItem) => {
        if (shoppingLists.length === 1) {
            await supabase.from('shopping_list_items').insert({ list_id: shoppingLists[0].id, food_item_id: item.id, added_by_user_id: user!.id });
            fetchData();
        } else {
            // Here you could open a modal to select a list
            alert('Added to default list (feature to select list coming soon!)');
            await supabase.from('shopping_list_items').insert({ list_id: shoppingLists[0].id, food_item_id: item.id, added_by_user_id: user!.id });
            fetchData();
        }
    };

    const filteredItems = useMemo(() => {
        let items = aiSearchResultIds ? userFoodItems.filter(item => aiSearchResultIds.includes(item.id)) : userFoodItems;
        return items.filter(item => {
            const searchLower = searchTerm.toLowerCase();
            const nameMatch = item.name.toLowerCase().includes(searchLower);
            const notesMatch = item.notes?.toLowerCase().includes(searchLower) || false;
            const typeMatch = typeFilter === 'all' || item.itemType === typeFilter;
            const ratingMatch = ratingFilter === 'all' || (ratingFilter === 'liked' && item.rating >= 4) || (ratingFilter === 'disliked' && item.rating <= 2);
            return (nameMatch || notesMatch) && typeMatch && ratingMatch;
        }).sort((a, b) => {
            switch (sortBy) {
                case 'date_asc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case 'rating_desc': return b.rating - a.rating;
                case 'rating_asc': return a.rating - b.rating;
                case 'name_asc': return a.name.localeCompare(b.name);
                case 'name_desc': return b.name.localeCompare(a.name);
                default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
        });
    }, [userFoodItems, searchTerm, typeFilter, ratingFilter, sortBy, aiSearchResultIds]);

    const openForm = (itemType: FoodItemType, itemToEdit: FoodItem | null = null) => {
        setItemTypeToAdd(itemType);
        setEditingItem(itemToEdit);
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingItem(null);
    };
    
    const handleAiSearch = async (query: string) => {
        if (!isAiEnabled) { alert("Please enable AI features in settings."); return; }
        setIsAiSearchLoading(true);
        try {
            const ids = await performConversationalSearch(query, userFoodItems);
            setAiSearchResultIds(ids);
        } catch (e) {
            console.error("AI Search failed", e);
            alert(e instanceof Error ? e.message : "An unknown error occurred during AI search.");
            setAiSearchResultIds(null);
        } finally {
            setIsAiSearchLoading(false);
        }
    };

    const resetFilters = () => {
        setSearchTerm(''); setTypeFilter('all'); setRatingFilter('all'); setSortBy('date_desc'); setAiSearchResultIds(null);
    };
    
    const selectShoppingList = (listId: string) => {
        const list = shoppingLists.find(l => l.id === listId) || null;
        const members = shoppingListMembers[listId] || [];
        const itemsForList = allListItems.filter(i => i.list_id === listId);
        
        const hydratedItems: HydratedShoppingListItem[] = itemsForList.map(listItem => {
            const foodItemDetails = allFoodItems.find(fi => fi.id === listItem.food_item_id);
            if (!foodItemDetails) return null;
            return {
                ...foodItemDetails,
                shoppingListItemId: listItem.id,
                checked: listItem.checked,
                added_by_user_id: listItem.added_by_user_id,
                checked_by_user_id: listItem.checked_by_user_id,
            };
        }).filter((i): i is HydratedShoppingListItem => i !== null);
        
        const feed = allFoodItems.filter(fi => fi.shared_with_list_id === listId);
        
        setActiveShoppingListData({ list, members, items: hydratedItems, feed });
        setIsShoppingListModalOpen(true);
    };
    
    if (!session) return <Auth />;
    if (isAiEnabled && !hasValidApiKey() && isApiKeyModalOpen) return <ApiKeyModal onKeySave={handleSaveApiKey} />;

    const navItems = [
        { view: 'dashboard', label: t('navigation.dashboard'), icon: HomeIcon },
        { view: 'list', label: t('navigation.myList'), icon: DocumentTextIcon },
        { view: 'discover', label: t('navigation.discover'), icon: GlobeAltIcon },
        { view: 'groups', label: t('navigation.groups'), icon: UserGroupIcon },
    ];

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
            {isAiEnabled && !hasValidApiKey() && showApiKeyBanner && <ApiKeyBanner onDismiss={handleDismissApiKeyBanner} onOpenSettings={() => setIsApiKeyModalOpen(true)} />}
            <OfflineIndicator isOnline={isOnline} />
            
            <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20 px-4 py-3">
              <div className="flex justify-between items-center max-w-6xl mx-auto">
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t('header.title')}</h1>
                <div className="flex items-center gap-2">
                    {view === 'list' && (
                        <button onClick={() => setIsFilterPanelOpen(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
                            <AdjustmentsHorizontalIcon className="w-6 h-6" />
                        </button>
                    )}
                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
                        <Cog6ToothIcon className="w-6 h-6" />
                    </button>
                </div>
              </div>
            </header>

            <main className="p-4 md:p-6 lg:p-8 pb-24">
                {view === 'dashboard' && <Dashboard items={userFoodItems} onViewAll={() => setView('list')} onAddNew={() => openForm('product')} onDelete={handleDeleteItem} onEdit={(id) => openForm(userFoodItems.find(i=>i.id===id)!.itemType, userFoodItems.find(i => i.id === id))} onViewDetails={setIsDetailModalOpen} onAddToGroupShoppingList={handleAddToGroupShoppingList} />}
                {view === 'list' && <FoodItemList items={filteredItems} onDelete={handleDeleteItem} onEdit={(id) => openForm(userFoodItems.find(i=>i.id===id)!.itemType, userFoodItems.find(i => i.id === id))} onViewDetails={setIsDetailModalOpen} onAddToGroupShoppingList={handleAddToGroupShoppingList} />}
                {view === 'discover' && <DiscoverView items={publicFoodItems} isLoading={isPublicItemsLoading} onViewDetails={setIsDetailModalOpen} likes={likes} comments={comments} />}
                {view === 'groups' && <GroupsView shoppingLists={shoppingLists} members={shoppingListMembers} onSelectList={selectShoppingList} onCreateList={async (name) => {
                    if (!user) return;
                    const { data: newList, error: listError } = await supabase
                        .from('shopping_lists')
                        .insert({ name, owner_id: user.id })
                        .select()
                        .single();

                    if (listError) {
                        console.error('Error creating list:', listError);
                        return;
                    }
                    
                    if (newList) {
                        const { error: memberError } = await supabase
                            .from('shopping_list_members')
                            .insert({ list_id: newList.id, user_id: user.id });

                        if (memberError) {
                            console.error('Error adding owner as member:', memberError);
                        }
                        
                        fetchData();
                    }
                }} />}
            </main>
            
            {!isFormOpen && (
                <button onClick={() => openForm('product')} className="fixed bottom-24 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg z-30 transition-transform transform hover:scale-110" aria-label={t('form.addNewButton')}>
                    <PlusCircleIcon className="w-8 h-8"/>
                </button>
            )}

            <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-t-md z-30">
                <div className="flex justify-around max-w-6xl mx-auto">
                    {navItems.map(item => (
                        <button key={item.view} onClick={() => setView(item.view as View)} className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors ${view === item.view ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-300'}`}>
                            <item.icon className="w-6 h-6" />
                            <span className="text-xs font-medium">{item.label}</span>
                        </button>
                    ))}
                </div>
            </nav>
            
            {isFormOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fade-in-fast" onClick={closeForm}></div>
            )}
            {isFormOpen && (
                <div className="fixed top-0 left-0 right-0 bottom-0 z-50 overflow-y-auto p-4 pt-16">
                     <div className="max-w-2xl mx-auto">
                        <FoodItemForm onSaveItem={handleSaveItem} onCancel={closeForm} initialData={editingItem} itemType={editingItem?.itemType || itemTypeToAdd} shoppingLists={shoppingLists} />
                    </div>
                </div>
            )}
            
            {isShoppingListModalOpen && activeShoppingListData.list && (
                <ShoppingListModal
                    allLists={shoppingLists}
                    activeListId={activeShoppingListData.list.id}
                    listData={activeShoppingListData.items}
                    listMembers={activeShoppingListData.members}
                    currentUser={user}
                    groupFeedItems={activeShoppingListData.feed}
                    likes={likes}
                    comments={comments}
                    onClose={() => setIsShoppingListModalOpen(false)}
                    onSelectList={selectShoppingList}
                    onRemove={async (id) => { await supabase.from('shopping_list_items').delete().eq('id', id); selectShoppingList(activeShoppingListData.list!.id); }}
                    onClear={async () => { await supabase.from('shopping_list_items').delete().eq('list_id', activeShoppingListData.list!.id).eq('checked', true); selectShoppingList(activeShoppingListData.list!.id); }}
                    onToggleChecked={async (id, isChecked) => { await supabase.from('shopping_list_items').update({ checked: isChecked, checked_by_user_id: isChecked ? user?.id : null }).eq('id', id); selectShoppingList(activeShoppingListData.list!.id); }}
                    onCreateList={async (name) => { await supabase.from('shopping_lists').insert({ name, owner_id: user!.id }); fetchData(); }}
                    onDeleteList={async (id) => { await supabase.from('shopping_lists').delete().eq('id', id); setIsShoppingListModalOpen(false); fetchData(); }}
                    onLeaveList={async (id) => { await supabase.from('shopping_list_members').delete().eq('list_id', id).eq('user_id', user!.id); setIsShoppingListModalOpen(false); fetchData(); }}
                    onViewDetails={setIsDetailModalOpen}
                />
            )}

             {isDuplicateModalOpen && (
                <DuplicateConfirmationModal items={isDuplicateModalOpen.items} itemName={isDuplicateModalOpen.newItem.name} onConfirm={() => { proceedWithSave(isDuplicateModalOpen.newItem); setIsDuplicateModalOpen(null); }} onCancel={() => setIsDuplicateModalOpen(null)} />
            )}
             {isDetailModalOpen && (
                <FoodItemDetailModal item={isDetailModalOpen} likes={likes.filter(l => l.food_item_id === isDetailModalOpen.id)} comments={comments.filter(c => c.food_item_id === isDetailModalOpen.id)} currentUser={user} onClose={() => setIsDetailModalOpen(null)} onEdit={(id) => { setIsDetailModalOpen(null); openForm(allFoodItems.find(i=>i.id===id)!.itemType, allFoodItems.find(i => i.id === id)); }} onImageClick={setIsImageModalOpen} onToggleLike={async (id) => { const existingLike = likes.find(l => l.food_item_id === id && l.user_id === user?.id); if (existingLike) { await supabase.from('likes').delete().eq('id', existingLike.id); } else { await supabase.from('likes').insert({ food_item_id: id, user_id: user!.id }); } fetchPublicData(); }} onAddComment={async (id, content) => { await supabase.from('comments').insert({ food_item_id: id, user_id: user!.id, content }); fetchPublicData(); }} onDeleteComment={async(id) => { await supabase.from('comments').delete().eq('id', id); fetchPublicData(); }} />
            )}
            {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
            {isImageModalOpen && <ImageModal imageUrl={isImageModalOpen} onClose={() => setIsImageModalOpen(null)} />}
            {isFilterPanelOpen && <FilterPanel onClose={() => setIsFilterPanelOpen(false)} {...{searchTerm, setSearchTerm, typeFilter, setTypeFilter, ratingFilter, setRatingFilter, sortBy, setSortBy, onAiSearch: handleAiSearch, isAiSearchLoading}} onReset={resetFilters} />}
            <style>{`.animate-fade-in-fast { animation: fadeIn 0.2s ease-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
    );
};

export default App;
