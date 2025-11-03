import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './services/supabaseClient';
import { FoodItem, FoodItemType, ShoppingList, Like, CommentWithProfile, UserProfile, ShoppingListItem, ShoppingListMember } from './types';
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
import { HomeIcon, MagnifyingGlassIcon, GlobeAltIcon, SettingsIcon, FunnelIcon, UserGroupIcon, PlusCircleIcon } from './components/Icons';
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

    const [items, setItems] = useState<FoodItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<View>('dashboard');
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
    const [formItemType, setFormItemType] = useState<FoodItemType>('product');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [selectedItemDetails, setSelectedItemDetails] = useState<FoodItem | null>(null);
    const [viewingImage, setViewingImage] = useState<string | null>(null);

    // Filters and Search
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
    const [sortBy, setSortBy] = useState<SortKey>('date_desc');
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [aiSearchResults, setAiSearchResults] = useState<string[] | null>(null);
    const [isAiSearchLoading, setIsAiSearchLoading] = useState(false);

    // Discover View
    const [discoverItems, setDiscoverItems] = useState<FoodItem[]>([]);
    const [likes, setLikes] = useState<Like[]>([]);
    const [comments, setComments] = useState<CommentWithProfile[]>([]);
    const [isDiscoverLoading, setIsDiscoverLoading] = useState(true);
    
    // Groups / Shopping Lists
    const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
    const [shoppingListItems, setShoppingListItems] = useState<ShoppingListItem[]>([]);
    const [shoppingListMembers, setShoppingListMembers] = useState<ShoppingListMember[]>([]);
    const [activeShoppingListId, setActiveShoppingListId] = useState<string | null>(null);
    const [isShoppingListModalOpen, setIsShoppingListModalOpen] = useState(false);

    // Duplicate Check
    const [duplicateCheck, setDuplicateCheck] = useState<{ potential: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>, existing: FoodItem[] } | null>(null);

    // API Key Banner
    const [showApiKeyBanner, setShowApiKeyBanner] = useState(false);

    useEffect(() => {
        const isDismissed = sessionStorage.getItem('apiKeyBannerDismissed') === 'true';
        if (!hasValidApiKey() && !isDismissed) {
            setShowApiKeyBanner(true);
        }
    }, []);

    const handleApiKeyBannerDismiss = () => {
        sessionStorage.setItem('apiKeyBannerDismissed', 'true');
        setShowApiKeyBanner(false);
    };


    const fetchAllData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);

        const [itemsRes, listsRes, membersRes, listItemsRes] = await Promise.all([
            supabase.from('food_items').select('*').eq('user_id', user.id),
            supabase.from('shopping_lists').select('*, shopping_list_members!inner(*)').eq('shopping_list_members.user_id', user.id),
            supabase.from('shopping_list_members').select('*'),
            supabase.from('shopping_list_items').select('*')
        ]);

        if (itemsRes.error) console.error('Error fetching items:', itemsRes.error);
        else setItems((itemsRes.data as FoodItem[]) || []);

        if (listsRes.error) console.error('Error fetching shopping lists:', listsRes.error);
        else setShoppingLists((listsRes.data as ShoppingList[]) || []);
        
        if (membersRes.error) console.error('Error fetching list members:', membersRes.error);
        else setShoppingListMembers((membersRes.data as ShoppingListMember[]) || []);

        if (listItemsRes.error) console.error('Error fetching shopping list items:', listItemsRes.error);
        else setShoppingListItems((listItemsRes.data as ShoppingListItem[]) || []);

        setIsLoading(false);
    }, [user]);
    
    const fetchDiscoverData = useCallback(async () => {
        setIsDiscoverLoading(true);
        const [discoverRes, likesRes, commentsRes] = await Promise.all([
            supabase.from('food_items').select('*').eq('isPublic', true).order('created_at', { ascending: false }).limit(50),
            supabase.from('likes').select('*'),
            supabase.from('comments').select('*, profiles(display_name)').order('created_at', { ascending: true })
        ]);
        
        if (discoverRes.error) console.error('Error fetching discover items:', discoverRes.error);
        else setDiscoverItems((discoverRes.data as FoodItem[]) || []);

        if (likesRes.error) console.error('Error fetching likes:', likesRes.error);
        else setLikes((likesRes.data as Like[]) || []);

        if (commentsRes.error) console.error('Error fetching comments:', commentsRes.error);
        else setComments((commentsRes.data as CommentWithProfile[]) || []);

        setIsDiscoverLoading(false);
    }, []);


    useEffect(() => {
        if (user) {
            fetchAllData();
            fetchDiscoverData();
        }
    }, [user, fetchAllData, fetchDiscoverData]);
    
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        const channel = supabase.channel('db-changes');
        channel
          .on('postgres_changes', { event: '*', schema: 'public' }, () => {
            fetchAllData();
            fetchDiscoverData();
          })
          .subscribe();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            supabase.removeChannel(channel);
        };
    }, [fetchAllData, fetchDiscoverData]);

    const handleSaveItem = async (itemData: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) => {
        if (!user) return;
        
        const dataToInsert = { ...itemData, user_id: user.id };

        const { error } = editingItem
            ? await supabase.from('food_items').update(itemData).eq('id', editingItem.id)
            : await supabase.from('food_items').insert(dataToInsert);

        if (error) {
            console.error('Error saving item:', error);
        } else {
            setIsFormOpen(false);
            setEditingItem(null);
            setDuplicateCheck(null);
        }
    };
    
    const handleDeleteItem = async (id: string) => {
        if (window.confirm(t('card.deleteAria', { name: items.find(i=>i.id === id)?.name || 'item' }))) {
            await supabase.from('food_items').delete().eq('id', id);
        }
    };
    
    const handleCreateList = async (name: string) => {
        if (!user) return;
        const { data, error } = await supabase.from('shopping_lists').insert({ name, owner_id: user.id }).select();
        if (error) console.error("Error creating list", error);
        else if (data) {
            await supabase.from('shopping_list_members').insert({ list_id: data[0].id, user_id: user.id });
        }
    };

    const handleSelectList = (listId: string) => {
        setActiveShoppingListId(listId);
        setIsShoppingListModalOpen(true);
    };
    
    const handleAddToShoppingList = async (foodItemId: string, listId: string) => {
        if (!user) return;
        await supabase.from('shopping_list_items').insert({ food_item_id: foodItemId, list_id: listId, added_by_user_id: user.id });
    };


    const filteredItems = useMemo(() => {
      let filtered = aiSearchResults ? items.filter(i => aiSearchResults.includes(i.id)) : [...items];
      
      if (searchTerm) {
          const lowercasedTerm = searchTerm.toLowerCase();
          filtered = filtered.filter(item =>
              item.name.toLowerCase().includes(lowercasedTerm) ||
              item.notes?.toLowerCase().includes(lowercasedTerm)
          );
      }
      if (typeFilter !== 'all') {
          filtered = filtered.filter(item => item.itemType === typeFilter);
      }
      if (ratingFilter !== 'all') {
          filtered = filtered.filter(item => {
              if (ratingFilter === 'liked') return item.rating >= 4;
              if (ratingFilter === 'disliked') return item.rating <= 2 && item.rating > 0;
              return true;
          });
      }

      return filtered.sort((a, b) => {
          switch (sortBy) {
              case 'date_asc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
              case 'rating_desc': return b.rating - a.rating;
              case 'rating_asc': return a.rating - b.rating;
              case 'name_asc': return a.name.localeCompare(b.name);
              case 'name_desc': return b.name.localeCompare(a.name);
              default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
      });
    }, [items, searchTerm, typeFilter, ratingFilter, sortBy, aiSearchResults]);


    const renderContent = () => {
        if (isLoading) return <div className="flex justify-center items-center pt-20"><PlusCircleIcon className="w-12 h-12 text-gray-400 animate-spin" /></div>;
        switch (view) {
            case 'dashboard': return <Dashboard items={items} onViewAll={() => setView('list')} onAddNew={() => handleOpenForm('product')} onDelete={handleDeleteItem} onEdit={handleOpenFormWithItem} onViewDetails={setSelectedItemDetails} onAddToGroupShoppingList={() => {}} />;
            case 'list': return <FoodItemList items={filteredItems} onDelete={handleDeleteItem} onEdit={handleOpenFormWithItem} onViewDetails={setSelectedItemDetails} onAddToGroupShoppingList={() => {}} />;
            case 'discover': return <DiscoverView items={discoverItems} likes={likes} comments={comments} isLoading={isDiscoverLoading} onViewDetails={setSelectedItemDetails} />;
            case 'groups': return <GroupsView shoppingLists={shoppingLists} onSelectList={handleSelectList} onCreateList={handleCreateList} />;
            default: return null;
        }
    };
    
    const handleOpenForm = (type: FoodItemType) => {
        setEditingItem(null);
        setFormItemType(type);
        setIsFormOpen(true);
    };

    const handleOpenFormWithItem = (id: string) => {
        const itemToEdit = items.find(i => i.id === id);
        if (itemToEdit) {
            setEditingItem(itemToEdit);
            setFormItemType(itemToEdit.itemType);
            setIsFormOpen(true);
        }
    };


    if (!session) return <Auth />;

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-white flex flex-col">
            {showApiKeyBanner && <ApiKeyBanner onDismiss={handleApiKeyBannerDismiss} onOpenSettings={() => setIsSettingsOpen(true)} />}
            <OfflineIndicator isOnline={isOnline} />
            
            <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-xl font-bold">{t('header.title')}</h1>
                <div className="flex items-center gap-2">
                    {view === 'list' && (
                        <button onClick={() => setIsFilterPanelOpen(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                            <FunnelIcon className="w-6 h-6" />
                        </button>
                    )}
                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <SettingsIcon className="w-6 h-6" />
                    </button>
                </div>
            </header>

            <main className="flex-1 container mx-auto p-4 pb-24">
                {renderContent()}
            </main>

            <div
                onClick={() => handleOpenForm('product')}
                className="fixed bottom-24 right-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-4 rounded-full shadow-lg cursor-pointer transition-transform transform hover:scale-110 z-20"
            >
                <PlusCircleIcon className="w-8 h-8" />
            </div>

            <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 grid grid-cols-4 z-20">
                {(['dashboard', 'list', 'discover', 'groups'] as View[]).map(v => (
                    <button key={v} onClick={() => setView(v)} className={`flex flex-col items-center justify-center p-2 transition-colors ${view === v ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        {v === 'dashboard' && <HomeIcon className="w-6 h-6" />}
                        {v === 'list' && <MagnifyingGlassIcon className="w-6 h-6" />}
                        {v === 'discover' && <GlobeAltIcon className="w-6 h-6" />}
                        {v === 'groups' && <UserGroupIcon className="w-6 h-6" />}
                        <span className="text-xs font-medium">{t(`navigation.${v}`)}</span>
                    </button>
                ))}
            </nav>

            {isFormOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-30 overflow-y-auto" onClick={() => setIsFormOpen(false)}>
                  <div className="flex items-center justify-center min-h-screen p-4">
                    <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                      <FoodItemForm
                        onSaveItem={handleSaveItem}
                        onCancel={() => { setIsFormOpen(false); setEditingItem(null); }}
                        initialData={editingItem}
                        itemType={formItemType}
                        shoppingLists={shoppingLists}
                      />
                    </div>
                  </div>
                </div>
            )}
            
            {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
            {isShoppingListModalOpen && activeShoppingListId && (
                <ShoppingListModal 
                    allLists={shoppingLists}
                    activeListId={activeShoppingListId}
                    listData={[]} // Placeholder
                    listMembers={[]} // Placeholder
                    currentUser={user}
                    groupFeedItems={[]} // Placeholder
                    likes={likes}
                    comments={comments}
                    onClose={() => setIsShoppingListModalOpen(false)}
                    onRemove={() => {}}
                    onClear={() => {}}
                    onToggleChecked={() => {}}
                    onSelectList={setActiveShoppingListId}
                    onCreateList={handleCreateList}
                    onDeleteList={() => {}}
                    onLeaveList={() => {}}
                    onViewDetails={setSelectedItemDetails}
                />
            )}
        </div>
    );
};

export default App;
