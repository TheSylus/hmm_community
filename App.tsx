import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FoodItem, FoodItemType, SortKey, TypeFilter, RatingFilter, ShoppingList } from './types';
import { useData } from './hooks/useData';
import { useAuth } from './contexts/AuthContext';
import { useToast } from './contexts/ToastContext';
import { useTranslation } from './i18n';
import { performConversationalSearch } from './services/geminiService';
import { Auth } from './components/Auth';
import { FoodItemForm } from './components/FoodItemForm';
import { FoodItemList } from './components/FoodItemList';
import { FoodItemDetailModal } from './components/FoodItemDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { Dashboard } from './components/Dashboard';
import { BottomNavBar } from './components/BottomNavBar';
import { FilterPanel } from './components/FilterPanel';
import { useAppSettings } from './contexts/AppSettingsContext';
import { ApiKeyBanner } from './components/ApiKeyBanner';
import { ApiKeyModal } from './components/ApiKeyModal';
import { DuplicateConfirmationModal } from './components/DuplicateConfirmationModal';
import { DiscoverView } from './components/DiscoverView';
import { GroupsView } from './components/GroupsView';
import { ShoppingMode } from './components/ShoppingMode';
import { ManageMembersModal } from './components/ManageMembersModal';
import { AddToListModal } from './components/AddToListModal';
import { ProfileModal } from './components/ProfileModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export type View = 'dashboard' | 'list' | 'discover' | 'groups';

const App: React.FC = () => {
    // Hooks
    const { session, user } = useAuth();
    const data = useData();
    const { addToast } = useToast();
    const { t } = useTranslation();
    const { isAiEnabled } = useAppSettings();

    // App State
    const [view, setView] = useState<View>('dashboard');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
    const [formItemType, setFormItemType] = useState<FoodItemType>('product');
    const [viewingItem, setViewingItem] = useState<FoodItem | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
    const [showApiKeyBanner, setShowApiKeyBanner] = useState(false);
    const [duplicateItem, setDuplicateItem] = useState<{item: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>, existing: FoodItem[]} | null>(null);
    const [isAiSearchLoading, setIsAiSearchLoading] = useState(false);
    const [selectedShoppingList, setSelectedShoppingList] = useState<string | null>(null);
    const [managingMembersList, setManagingMembersList] = useState<ShoppingList | null>(null);
    const [addingToShoppingList, setAddingToShoppingList] = useState<FoodItem | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    
    // List Filtering State
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
    const [sortBy, setSortBy] = useState<SortKey>('date_desc');
    const [aiFilteredIds, setAiFilteredIds] = useState<string[] | null>(null);

    // Online/Offline status
    useEffect(() => {
        const goOnline = () => setIsOnline(true);
        const goOffline = () => setIsOnline(false);
        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);
        return () => {
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
        };
    }, []);

    // API Key Banner Logic
    useEffect(() => {
        const keyExists = !!process.env.API_KEY;
        const bannerDismissed = sessionStorage.getItem('apiKeyBannerDismissed') === 'true';
        if (isAiEnabled && !keyExists && !bannerDismissed) {
            setShowApiKeyBanner(true);
        } else {
            setShowApiKeyBanner(false);
        }
    }, [isAiEnabled]);

    const handleSaveApiKey = (key: string) => {
        // In a real app, this would be handled more securely, but for this context, we set it on process.env.
        // The vite.config.ts setup is for build-time injection. This is a runtime override.
        Object.defineProperty(process.env, 'API_KEY', { value: key, writable: true });
        setIsApiKeyModalOpen(false);
        setShowApiKeyBanner(false);
    };

    // Form Handling
    const handleOpenForm = (type: FoodItemType) => {
        setEditingItem(null);
        setFormItemType(type);
        setIsFormOpen(true);
    };

    const handleEditItem = (id: string) => {
        const itemToEdit = data.foodItems.find(item => item.id === id);
        if (itemToEdit) {
            setEditingItem(itemToEdit);
            setFormItemType(itemToEdit.item_type);
            setIsFormOpen(true);
        }
    };
    
    const handleSaveItem = async (item: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) => {
        // Check for duplicates before saving a new item
        if (!editingItem) {
            const existing = data.foodItems.filter(i => i.name.toLowerCase() === item.name.toLowerCase());
            if(existing.length > 0) {
                setDuplicateItem({ item, existing });
                return;
            }
        }
        await performSave(item);
    };
    
    const performSave = async (item: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) => {
        try {
            if (editingItem) {
                await data.updateFoodItem({ id: editingItem.id, updates: item });
            } else {
                await data.addFoodItem(item);
            }
            setIsFormOpen(false);
            setEditingItem(null);
            setDuplicateItem(null);
        } catch (error) {
            console.error("Failed to save item:", error);
        }
    };
    
    const handleDeleteItem = async (id: string) => {
        if (window.confirm(t('list.delete.confirm'))) {
            try {
                await data.deleteFoodItem(id);
                addToast({ message: t('toast.itemDeleted'), type: 'info' });
            } catch (error) {
                console.error("Failed to delete item:", error);
            }
        }
    };

    // List Filtering & Sorting Logic
    const filteredAndSortedItems = useMemo(() => {
        let items = data.foodItems;

        if (aiFilteredIds) {
            const idSet = new Set(aiFilteredIds);
            items = items.filter(item => idSet.has(item.id));
        } else {
             items = items.filter(item => {
                const searchMatch = searchTerm.toLowerCase() ? (
                    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
                ) : true;
                const typeMatch = typeFilter === 'all' || item.item_type === typeFilter;
                const ratingMatch = ratingFilter === 'all' || (ratingFilter === 'liked' && item.rating >= 4) || (ratingFilter === 'disliked' && item.rating <= 2);
                return searchMatch && typeMatch && ratingMatch;
            });
        }
        
        return [...items].sort((a, b) => {
            switch (sortBy) {
                case 'date_asc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case 'rating_desc': return b.rating - a.rating;
                case 'rating_asc': return a.rating - b.rating;
                case 'name_asc': return a.name.localeCompare(b.name);
                case 'name_desc': return b.name.localeCompare(a.name);
                default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); // date_desc
            }
        });
    }, [data.foodItems, searchTerm, typeFilter, ratingFilter, sortBy, aiFilteredIds]);
    
    const handleAiSearch = async (query: string) => {
        setIsAiSearchLoading(true);
        try {
            const ids = await performConversationalSearch(query, data.foodItems);
            setAiFilteredIds(ids);
            setSearchTerm(''); // Clear manual search
            setIsFilterPanelOpen(false);
        } catch(e) {
            console.error(e);
            addToast({ message: e instanceof Error ? e.message : 'AI Search failed', type: 'error' });
        } finally {
            setIsAiSearchLoading(false);
        }
    };

    const resetFilters = useCallback(() => {
        setSearchTerm('');
        setTypeFilter('all');
        setRatingFilter('all');
        setSortBy('date_desc');
        setAiFilteredIds(null);
    }, []);

    // Shopping List Item handling
    const { data: shoppingListItems, isLoading: isLoadingShoppingListItems } = data.getShoppingListItems(selectedShoppingList);
    
    const handleAddToShoppingList = async (listId: string, quantity: number) => {
        if (!addingToShoppingList) return;
        try {
            await data.addShoppingListItem({ listId, foodItemId: addingToShoppingList.id, name: addingToShoppingList.name, quantity });
            const list = data.shoppingLists.find(l => l.id === listId);
            addToast({ message: t('toast.addedToList', { itemName: addingToShoppingList.name, listName: list?.name || '' }), type: 'success' });
            setAddingToShoppingList(null);
        } catch (error) {
            console.error("Failed to add to shopping list:", error);
        }
    };

    // Render Logic
    if (!session) {
        return <Auth />;
    }
    
    const renderView = () => {
        switch (view) {
            case 'dashboard':
                return <Dashboard items={data.foodItems} onAddNew={() => handleOpenForm('product')} onDelete={handleDeleteItem} onEdit={handleEditItem} onViewDetails={setViewingItem} onAddToShoppingList={setAddingToShoppingList} />;
            case 'list':
                return <FoodItemList items={filteredAndSortedItems} onDelete={handleDeleteItem} onEdit={handleEditItem} onViewDetails={setViewingItem} onAddToShoppingList={setAddingToShoppingList} />;
            case 'discover':
                return <DiscoverView items={data.publicFoodItems} isLoading={data.isLoadingPublicItems} onViewDetails={setViewingItem} likes={data.likes} comments={data.comments} />;
            case 'groups':
                return <GroupsView shoppingLists={data.shoppingLists} members={data.groupMembers} onSelectList={setSelectedShoppingList} onCreateList={data.createShoppingList} onRenameList={data.renameShoppingList} onDeleteList={data.deleteShoppingList} onManageMembers={setManagingMembersList}/>;
            default:
                return null;
        }
    };

    if (data.isLoadingFoodItems && data.foodItems.length === 0) {
        return <div className="min-h-screen bg-gray-100 dark:bg-gray-900" />;
    }
    
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-20">
            <OfflineIndicator isOnline={isOnline} />
            {showApiKeyBanner && <ApiKeyBanner onDismiss={() => { setShowApiKeyBanner(false); sessionStorage.setItem('apiKeyBannerDismissed', 'true'); }} onOpenSettings={() => { setIsSettingsOpen(true); setShowApiKeyBanner(false); }} />}
            
            <header className="bg-white dark:bg-gray-800 shadow-sm p-4 sticky top-0 z-20">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">{t('header.title')}</h1>
                    <div className="flex items-center gap-2">
                         <button onClick={() => setIsFilterPanelOpen(true)} className="p-2 text-gray-600 dark:text-gray-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">{t('filter.buttonText')}</button>
                         <button onClick={() => handleOpenForm('product')} className="px-3 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 text-sm">{t('form.addNewButton')}</button>
                    </div>
                </div>
            </header>
            
            <main className="container mx-auto p-4">
                {renderView()}
            </main>
            
            <BottomNavBar currentView={view} setView={setView} onOpenSettings={() => setIsSettingsOpen(true)} />

            {/* Modals */}
            {isFormOpen && <FoodItemForm onSaveItem={handleSaveItem} onCancel={() => setIsFormOpen(false)} initialData={editingItem} item_type={formItemType} shoppingLists={data.shoppingLists} />}
            {viewingItem && <FoodItemDetailModal item={viewingItem} onClose={() => setViewingItem(null)} />}
            {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} onOpenProfile={() => setIsProfileModalOpen(true)} />}
            {isFilterPanelOpen && <FilterPanel onClose={() => setIsFilterPanelOpen(false)} searchTerm={searchTerm} setSearchTerm={setSearchTerm} typeFilter={typeFilter} setTypeFilter={setTypeFilter} ratingFilter={ratingFilter} setRatingFilter={setRatingFilter} sortBy={sortBy} setSortBy={setSortBy} onReset={resetFilters} onAiSearch={handleAiSearch} isAiSearchLoading={isAiSearchLoading} />}
            {isApiKeyModalOpen && <ApiKeyModal onKeySave={handleSaveApiKey} />}
            {duplicateItem && <DuplicateConfirmationModal items={duplicateItem.existing} itemName={duplicateItem.item.name} onConfirm={() => performSave(duplicateItem.item)} onCancel={() => setDuplicateItem(null)} />}
            {selectedShoppingList && <ShoppingMode list={data.shoppingLists.find(l => l.id === selectedShoppingList)!} items={shoppingListItems || []} isLoading={isLoadingShoppingListItems} currentUserId={user!.id} onClose={() => setSelectedShoppingList(null)} onItemToggle={(args) => data.toggleShoppingListItem({ ...args, listId: selectedShoppingList })} onManageMembers={setManagingMembersList} onLeaveList={data.leaveShoppingList} onDeleteList={data.deleteShoppingList} />}
            {managingMembersList && <ManageMembersModal list={managingMembersList} members={data.groupMembers[managingMembersList.id] || []} ownerId={managingMembersList.owner_id} currentUserId={user!.id} onClose={() => setManagingMembersList(null)} onRemoveMember={data.removeMemberFromShoppingList} onAddMember={data.addMemberToShoppingList} />}
            {addingToShoppingList && <AddToListModal item={addingToShoppingList} lists={data.shoppingLists} onAdd={handleAddToShoppingList} onClose={() => setAddingToShoppingList(null)} />}
            {isProfileModalOpen && <ProfileModal onClose={() => setIsProfileModalOpen(false)} />}
        </div>
    );
};

export default App;
