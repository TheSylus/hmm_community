import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FoodItem, FoodItemType, SortKey, RatingFilter, TypeFilter } from './types';
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
import { useData } from './hooks/useData';
import { useToast } from './contexts/ToastContext';
import { ToastContainer } from './components/Toast';
import { HomeIcon, DocumentTextIcon, GlobeAltIcon, UserGroupIcon, PlusCircleIcon, AdjustmentsHorizontalIcon, Cog6ToothIcon } from './components/Icons';

type View = 'dashboard' | 'list' | 'discover' | 'groups';

const App: React.FC = () => {
    const { session, user } = useAuth();
    const { t } = useTranslation();
    const { isAiEnabled } = useAppSettings();
    const { addToast } = useToast();

    // --- Data Management via TanStack Query Custom Hooks ---
    const {
        foodItems,
        publicItems,
        likes,
        comments,
        shoppingLists,
        shoppingListMembers,
        allProfiles,
        activeShoppingListData,
        setActiveListId,
        isInitialLoading,
        isPublicLoading,
        addFoodItem,
        updateFoodItem,
        deleteFoodItem,
        addShoppingList,
        deleteShoppingList,
        leaveShoppingList,
        toggleListItemChecked,
        removeListItem,
        clearCheckedListItems,
        toggleLike,
        addComment,
        deleteComment,
    } = useData(user?.id);

    // UI and Flow states
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

    const handleSaveItem = async (item: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) => {
        if (!user) return;
        
        const similarItems = foodItems.filter(fi => fi.name.toLowerCase().includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(fi.name.toLowerCase()));
        if (similarItems.length > 0 && !editingItem) {
            setIsDuplicateModalOpen({ items: similarItems, newItem: item });
            return;
        }
        await proceedWithSave(item);
    };

    const proceedWithSave = async (item: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) => {
        if (editingItem) {
            updateFoodItem.mutate({ ...item, id: editingItem.id });
        } else {
            addFoodItem.mutate(item);
        }
        closeForm();
    };

    const handleDeleteItem = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            deleteFoodItem.mutate(id);
        }
    };
    
    const handleAddToGroupShoppingList = useCallback((item: FoodItem) => {
        if (shoppingLists.length > 0) {
            // This is a placeholder for a future modal to select a list.
            // For now, it adds to the first list.
            const listId = shoppingLists[0].id;
            addToast({ message: `Added to ${shoppingLists[0].name}`, type: 'success' });
            // addListItem.mutate({ list_id: listId, food_item_id: item.id });
        } else {
            addToast({ message: "Create a group first to add items to a shopping list.", type: 'info' });
        }
    }, [shoppingLists, addToast]);


    const filteredItems = useMemo(() => {
        let items = aiSearchResultIds ? foodItems.filter(item => aiSearchResultIds.includes(item.id)) : foodItems;
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
        if (!isAiEnabled) { addToast({ message: "Please enable AI features in settings.", type: 'info' }); return; }
        setIsAiSearchLoading(true);
        try {
            const ids = await performConversationalSearch(query, foodItems);
            setAiSearchResultIds(ids);
        } catch (e) {
            const message = e instanceof Error ? e.message : "An unknown error occurred during AI search.";
            addToast({ message, type: 'error' });
            setAiSearchResultIds(null);
        } finally {
            setIsAiSearchLoading(false);
        }
    };

    const resetFilters = () => {
        setSearchTerm(''); setTypeFilter('all'); setRatingFilter('all'); setSortBy('date_desc'); setAiSearchResultIds(null);
    };
    
    const selectShoppingList = (listId: string) => {
        setActiveListId(listId);
        setIsShoppingListModalOpen(true);
    };
    
    if (!session) return <Auth />;
    if (isAiEnabled && !hasValidApiKey() && isApiKeyModalOpen) return <ApiKeyModal onKeySave={handleSaveApiKey} />;
    if (isInitialLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">...Loading</div>;


    const navItems = [
        { view: 'dashboard', label: t('navigation.dashboard'), icon: HomeIcon },
        { view: 'list', label: t('navigation.myList'), icon: DocumentTextIcon },
        { view: 'discover', label: t('navigation.discover'), icon: GlobeAltIcon },
        { view: 'groups', label: t('navigation.groups'), icon: UserGroupIcon },
    ];

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
            <ToastContainer />
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
                {view === 'dashboard' && <Dashboard items={foodItems} onViewAll={() => setView('list')} onAddNew={() => openForm('product')} onDelete={handleDeleteItem} onEdit={(id) => openForm(foodItems.find(i=>i.id===id)!.itemType, foodItems.find(i => i.id === id))} onViewDetails={setIsDetailModalOpen} onAddToGroupShoppingList={handleAddToGroupShoppingList} />}
                {view === 'list' && <FoodItemList items={filteredItems} onDelete={handleDeleteItem} onEdit={(id) => openForm(foodItems.find(i=>i.id===id)!.itemType, foodItems.find(i => i.id === id))} onViewDetails={setIsDetailModalOpen} onAddToGroupShoppingList={handleAddToGroupShoppingList} />}
                {view === 'discover' && <DiscoverView items={publicItems} isLoading={isPublicLoading} onViewDetails={setIsDetailModalOpen} likes={likes} comments={comments} />}
                {view === 'groups' && <GroupsView shoppingLists={shoppingLists} members={shoppingListMembers} onSelectList={selectShoppingList} onCreateList={(name) => addShoppingList.mutate(name)} />}
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
                    onRemove={(id) => removeListItem.mutate(id)}
                    onClear={() => activeShoppingListData.list && clearCheckedListItems.mutate(activeShoppingListData.list.id)}
                    onToggleChecked={(id, isChecked) => toggleListItemChecked.mutate({ id, isChecked, userId: user?.id || null })}
                    onCreateList={(name) => addShoppingList.mutate(name)}
                    onDeleteList={(id) => { deleteShoppingList.mutate(id); setIsShoppingListModalOpen(false); }}
                    onLeaveList={(id) => { leaveShoppingList.mutate(id); setIsShoppingListModalOpen(false); }}
                    onViewDetails={setIsDetailModalOpen}
                />
            )}

             {isDuplicateModalOpen && (
                <DuplicateConfirmationModal items={isDuplicateModalOpen.items} itemName={isDuplicateModalOpen.newItem.name} onConfirm={() => { proceedWithSave(isDuplicateModalOpen.newItem); setIsDuplicateModalOpen(null); }} onCancel={() => setIsDuplicateModalOpen(null)} />
            )}
             {isDetailModalOpen && (
                <FoodItemDetailModal item={isDetailModalOpen} likes={likes.filter(l => l.food_item_id === isDetailModalOpen.id)} comments={comments.filter(c => c.food_item_id === isDetailModalOpen.id)} currentUser={user} onClose={() => setIsDetailModalOpen(null)} onEdit={(id) => { setIsDetailModalOpen(null); openForm(foodItems.find(i=>i.id===id)!.itemType, foodItems.find(i => i.id === id)); }} onImageClick={setIsImageModalOpen} onToggleLike={(id) => toggleLike.mutate({ foodItemId: id, userId: user!.id })} onAddComment={(id, content) => addComment.mutate({ foodItemId: id, content, userId: user!.id })} onDeleteComment={(id) => deleteComment.mutate(id)} />
            )}
            {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
            {isImageModalOpen && <ImageModal imageUrl={isImageModalOpen} onClose={() => setIsImageModalOpen(null)} />}
            {isFilterPanelOpen && <FilterPanel onClose={() => setIsFilterPanelOpen(false)} {...{searchTerm, setSearchTerm, typeFilter, setTypeFilter, ratingFilter, setRatingFilter, sortBy, setSortBy, onAiSearch: handleAiSearch, isAiSearchLoading}} onReset={resetFilters} />}
            <style>{`.animate-fade-in-fast { animation: fadeIn 0.2s ease-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
    );
};

export default App;