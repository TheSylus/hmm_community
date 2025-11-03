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

type View = 'dashboard' | 'list' | 'discover' | 'groups';

const App: React.FC = () => {
    const { session, user } = useAuth();
    const { t } = useTranslation();
    const { isAiEnabled } = useAppSettings();

    const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
    const [publicFoodItems, setPublicFoodItems] = useState<FoodItem[]>([]);
    const [groupFeedItems, setGroupFeedItems] = useState<FoodItem[]>([]);
    const [likes, setLikes] = useState<Like[]>([]);
    const [comments, setComments] = useState<CommentWithProfile[]>([]);
    
    const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
    const [activeShoppingListId, setActiveShoppingListId] = useState<string | null>(null);
    const [shoppingListItems, setShoppingListItems] = useState<HydratedShoppingListItem[]>([]);
    const [shoppingListMembers, setShoppingListMembers] = useState<Record<string, UserProfile[]>>({});

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
        // Check periodically in case it gets added via another tab
        const interval = setInterval(checkApiKey, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleSaveApiKey = (apiKey: string) => {
        // The key is saved via environment variables (see vite.config.ts),
        // but for the client to recognize it without a reload, we can set it on process.env.
        // This is a client-side only change.
        process.env.API_KEY = apiKey;
        setIsApiKeyModalOpen(false);
        setShowApiKeyBanner(false);
    };

    const handleDismissApiKeyBanner = () => {
        setShowApiKeyBanner(false);
        localStorage.setItem('apiKeyBannerDismissed', 'true');
    };

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const handleSyncComplete = () => {
          fetchFoodItems();
          fetchShoppingLists();
        };

        navigator.serviceWorker.addEventListener('message', event => {
          if (event.data && event.data.type === 'SYNC_COMPLETE') {
            handleSyncComplete();
          }
        });

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);
    
    const fetchFoodItems = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('food_items')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching food items:', error);
        else setFoodItems(data || []);
        setLoading(false);
    }, [user]);

    const fetchPublicFoodItems = useCallback(async () => {
        setIsPublicItemsLoading(true);
        const { data, error } = await supabase
            .from('food_items')
            .select('*')
            .eq('isPublic', true)
            .neq('user_id', user?.id || '') // Exclude own items
            .order('created_at', { ascending: false })
            .limit(50);
        if (error) console.error("Error fetching public food items:", error);
        else setPublicFoodItems(data || []);
        setIsPublicItemsLoading(false);
    }, [user?.id]);
    
    const fetchLikesAndComments = useCallback(async () => {
        const { data: likesData, error: likesError } = await supabase.from('likes').select('*');
        if (likesError) console.error("Error fetching likes", likesError);
        else setLikes(likesData || []);

        const { data: commentsData, error: commentsError } = await supabase
            .from('comments')
            .select(`*, profiles(display_name)`)
            .order('created_at', { ascending: true });
        if (commentsError) console.error("Error fetching comments", commentsError);
        else setComments(commentsData as CommentWithProfile[] || []);
    }, []);

    const fetchShoppingLists = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase.rpc('get_user_shopping_lists');

        if (error) {
            console.error('Error fetching shopping lists:', error);
        } else {
            setShoppingLists(data || []);
            const memberPromises = (data || []).map(list =>
                supabase.from('shopping_list_members')
                    .select('user_id, profiles(id, display_name)')
                    .eq('list_id', list.id)
            );
            const membersResults = await Promise.all(memberPromises);
            const membersMap: Record<string, UserProfile[]> = {};
            membersResults.forEach((res, index) => {
                const listId = (data || [])[index].id;
                if (!res.error) {
                    membersMap[listId] = res.data.map(m => m.profiles as UserProfile).filter(Boolean);
                }
            });
            setShoppingListMembers(membersMap);
        }
    }, [user]);

    useEffect(() => {
        if (session) {
            fetchFoodItems();
            fetchPublicFoodItems();
            fetchLikesAndComments();
            fetchShoppingLists();
        }
    }, [session, fetchFoodItems, fetchPublicFoodItems, fetchLikesAndComments, fetchShoppingLists]);

    const handleSaveItem = async (item: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) => {
        if (!user) return;
        
        // Check for duplicates
        const similarItems = foodItems.filter(fi => fi.name.toLowerCase().includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(fi.name.toLowerCase()));
        if (similarItems.length > 0 && !editingItem) {
            setIsDuplicateModalOpen({ items: similarItems, newItem: item });
            return;
        }

        await proceedWithSave(item);
    };

    const proceedWithSave = async (item: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) => {
        if (!user) return;

        if (editingItem) {
            // Update
            const { data, error } = await supabase
                .from('food_items')
                .update(item)
                .eq('id', editingItem.id)
                .select()
                .single();
            if (error) console.error('Error updating item:', error);
            else if (data) {
                setFoodItems(foodItems.map(i => i.id === data.id ? data : i));
            }
        } else {
            // Insert
            const newItem = { ...item, user_id: user.id };
            const { data, error } = await supabase
                .from('food_items')
                .insert(newItem)
                .select()
                .single();
            if (error) console.error('Error saving item:', error);
            else if (data) {
                setFoodItems([data, ...foodItems]);
            }
        }
        closeForm();
    };

    const handleDeleteItem = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            const { error } = await supabase.from('food_items').delete().eq('id', id);
            if (error) console.error('Error deleting item:', error);
            else {
                setFoodItems(foodItems.filter(item => item.id !== id));
            }
        }
    };
    
    // ... other handlers (delete, edit, etc.)

    const filteredItems = useMemo(() => {
        let items = aiSearchResultIds ? foodItems.filter(item => aiSearchResultIds.includes(item.id)) : foodItems;

        return items
            .filter(item => {
                const searchLower = searchTerm.toLowerCase();
                const nameMatch = item.name.toLowerCase().includes(searchLower);
                const notesMatch = item.notes?.toLowerCase().includes(searchLower) || false;
                
                const typeMatch = typeFilter === 'all' || item.itemType === typeFilter;

                const ratingMatch = ratingFilter === 'all' ||
                    (ratingFilter === 'liked' && item.rating >= 4) ||
                    (ratingFilter === 'disliked' && item.rating <= 2);

                return (nameMatch || notesMatch) && typeMatch && ratingMatch;
            })
            .sort((a, b) => {
                switch (sortBy) {
                    case 'date_asc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    case 'rating_desc': return b.rating - a.rating;
                    case 'rating_asc': return a.rating - b.rating;
                    case 'name_asc': return a.name.localeCompare(b.name);
                    case 'name_desc': return b.name.localeCompare(a.name);
                    case 'date_desc':
                    default:
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                }
            });
    }, [foodItems, searchTerm, typeFilter, ratingFilter, sortBy, aiSearchResultIds]);


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
        if (!isAiEnabled) {
            alert("Please enable AI features in settings.");
            return;
        }
        setIsAiSearchLoading(true);
        try {
            const ids = await performConversationalSearch(query, foodItems);
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
        setSearchTerm('');
        setTypeFilter('all');
        setRatingFilter('all');
        setSortBy('date_desc');
        setAiSearchResultIds(null);
    };
    
    // ... shopping list functions
    const selectShoppingList = async (listId: string) => {
        setActiveShoppingListId(listId);
        
        const { data, error } = await supabase.rpc('get_hydrated_shopping_list_items', { p_list_id: listId });

        if (error) {
            console.error("Error fetching shopping list items:", error);
            setShoppingListItems([]);
        } else {
            setShoppingListItems(data || []);
        }

        const { data: feedData, error: feedError } = await supabase
            .from('food_items')
            .select('*')
            .eq('shared_with_list_id', listId)
            .order('created_at', { ascending: false });

        if (feedError) console.error("Error fetching group feed:", feedError);
        else setGroupFeedItems(feedData || []);

        setIsShoppingListModalOpen(true);
    };
    
    // Auth check
    if (!session) return <Auth />;
    if (isAiEnabled && !hasValidApiKey() && isApiKeyModalOpen) {
        return <ApiKeyModal onKeySave={handleSaveApiKey} />;
    }

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
            {isAiEnabled && !hasValidApiKey() && showApiKeyBanner && <ApiKeyBanner onDismiss={handleDismissApiKeyBanner} onOpenSettings={() => setIsApiKeyModalOpen(true)} />}
            <OfflineIndicator isOnline={isOnline} />
            <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-20">
              {/* Header and Nav */}
            </header>

            <main className="p-4 md:p-6 lg:p-8">
                {view === 'dashboard' && <Dashboard items={foodItems} onViewAll={() => setView('list')} onAddNew={() => openForm('product')} onDelete={handleDeleteItem} onEdit={(id) => openForm(foodItems.find(i=>i.id===id)!.itemType, foodItems.find(i => i.id === id))} onViewDetails={setIsDetailModalOpen} onAddToGroupShoppingList={()=>{}} />}
                {view === 'list' && <FoodItemList items={filteredItems} onDelete={handleDeleteItem} onEdit={(id) => openForm(foodItems.find(i=>i.id===id)!.itemType, foodItems.find(i => i.id === id))} onViewDetails={setIsDetailModalOpen} onAddToGroupShoppingList={()=>{}} />}
                {view === 'discover' && <DiscoverView items={publicFoodItems} isLoading={isPublicItemsLoading} onViewDetails={setIsDetailModalOpen} likes={likes} comments={comments} />}
                {view === 'groups' && <GroupsView shoppingLists={shoppingLists} members={shoppingListMembers} onSelectList={selectShoppingList} onCreateList={async (name) => {
                    const { data, error } = await supabase.from('shopping_lists').insert({ name, owner_id: user!.id }).select().single();
                    if(data) fetchShoppingLists();
                }} />}
            </main>
            
            {/* Modals */}
            {isFormOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={closeForm}></div>}
            {isFormOpen && (
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <FoodItemForm onSaveItem={handleSaveItem} onCancel={closeForm} initialData={editingItem} itemType={editingItem?.itemType || itemTypeToAdd} shoppingLists={shoppingLists} />
                </div>
            )}
            
            {isShoppingListModalOpen && activeShoppingListId && (
                <ShoppingListModal
                    allLists={shoppingLists}
                    activeListId={activeShoppingListId}
                    listData={shoppingListItems}
                    listMembers={shoppingListMembers[activeShoppingListId] || []}
                    currentUser={user}
                    groupFeedItems={groupFeedItems}
                    likes={likes}
                    comments={comments}
                    onClose={() => setIsShoppingListModalOpen(false)}
                    onSelectList={selectShoppingList}
                    onRemove={async (id) => {
                       await supabase.from('shopping_list_items').delete().eq('id', id);
                       if(activeShoppingListId) selectShoppingList(activeShoppingListId);
                    }}
                    onClear={async () => {
                        await supabase.from('shopping_list_items').delete().eq('list_id', activeShoppingListId).eq('checked', true);
                        if(activeShoppingListId) selectShoppingList(activeShoppingListId);
                    }}
                    onToggleChecked={async (id, isChecked) => {
                        await supabase.from('shopping_list_items').update({ checked: isChecked, checked_by_user_id: isChecked ? user?.id : null }).eq('id', id);
                        if(activeShoppingListId) selectShoppingList(activeShoppingListId);
                    }}
                    onCreateList={async (name) => {
                        await supabase.from('shopping_lists').insert({ name, owner_id: user!.id });
                        fetchShoppingLists();
                    }}
                    onDeleteList={async (id) => {
                        await supabase.from('shopping_lists').delete().eq('id', id);
                        setIsShoppingListModalOpen(false);
                        fetchShoppingLists();
                    }}
                    onLeaveList={async (id) => {
                        await supabase.from('shopping_list_members').delete().eq('list_id', id).eq('user_id', user!.id);
                        setIsShoppingListModalOpen(false);
                        fetchShoppingLists();
                    }}
                    onViewDetails={setIsDetailModalOpen}
                />
            )}

             {isDuplicateModalOpen && (
                <DuplicateConfirmationModal 
                    items={isDuplicateModalOpen.items}
                    itemName={isDuplicateModalOpen.newItem.name}
                    onConfirm={() => {
                        proceedWithSave(isDuplicateModalOpen.newItem);
                        setIsDuplicateModalOpen(null);
                    }}
                    onCancel={() => setIsDuplicateModalOpen(null)}
                />
            )}
             {isDetailModalOpen && (
                <FoodItemDetailModal
                    item={isDetailModalOpen}
                    likes={likes.filter(l => l.food_item_id === isDetailModalOpen.id)}
                    comments={comments.filter(c => c.food_item_id === isDetailModalOpen.id)}
                    currentUser={user}
                    onClose={() => setIsDetailModalOpen(null)}
                    onEdit={(id) => {
                        setIsDetailModalOpen(null);
                        openForm(foodItems.find(i=>i.id===id)!.itemType, foodItems.find(i => i.id === id));
                    }}
                    onImageClick={setIsImageModalOpen}
                    onToggleLike={async (id) => {
                        const existingLike = likes.find(l => l.food_item_id === id && l.user_id === user?.id);
                        if (existingLike) {
                            await supabase.from('likes').delete().eq('id', existingLike.id);
                        } else {
                            await supabase.from('likes').insert({ food_item_id: id, user_id: user!.id });
                        }
                        fetchLikesAndComments();
                    }}
                    onAddComment={async (id, content) => {
                        await supabase.from('comments').insert({ food_item_id: id, user_id: user!.id, content });
                        fetchLikesAndComments();
                    }}
                    onDeleteComment={async(id) => {
                        await supabase.from('comments').delete().eq('id', id);
                        fetchLikesAndComments();
                    }}
                />
            )}
            {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
            {isImageModalOpen && <ImageModal imageUrl={isImageModalOpen} onClose={() => setIsImageModalOpen(null)} />}
            {isFilterPanelOpen && <FilterPanel onClose={() => setIsFilterPanelOpen(false)} {...{searchTerm, setSearchTerm, typeFilter, setTypeFilter, ratingFilter, setRatingFilter, sortBy, setSortBy, onAiSearch: handleAiSearch, isAiSearchLoading}} onReset={resetFilters} />}

        </div>
    );
};

export default App;
