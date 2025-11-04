import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Auth } from './components/Auth';
import { useAuth } from './contexts/AuthContext';
import { useData } from './hooks/useData';
import { Dashboard } from './components/Dashboard';
import { FoodItemList } from './components/FoodItemList';
import { DiscoverView } from './components/DiscoverView';
import { GroupsView } from './components/GroupsView';
import { FoodItemForm } from './components/FoodItemForm';
import { FoodItemDetailModal } from './components/FoodItemDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { ApiKeyBanner } from './components/ApiKeyBanner';
import { useAppSettings } from './contexts/AppSettingsContext';
import { hasValidApiKey } from './services/geminiService';
import { FoodItem, FoodItemType, SortKey, TypeFilter, RatingFilter, ShoppingList, HydratedShoppingListItem } from './types';
import { ToastContainer } from './components/Toast';
import { performConversationalSearch } from './services/geminiService';
import { useToast } from './contexts/ToastContext';
import { DuplicateConfirmationModal } from './components/DuplicateConfirmationModal';
import { SpinnerIcon, AdjustmentsHorizontalIcon, Cog6ToothIcon, ShoppingBagIcon } from './components/Icons';
import { FilterPanel } from './components/FilterPanel';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AddToListModal } from './components/AddToListModal';
import { useTranslation } from './i18n';
import { BottomNavBar } from './components/BottomNavBar';
import { ShoppingMode } from './components/ShoppingMode';

export type View = 'dashboard' | 'list' | 'discover' | 'groups';
type Modal = 'form' | 'details' | 'settings' | 'duplicates' | 'addToList' | null;

const App: React.FC = () => {
  const { session, loading } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><SpinnerIcon className="w-12 h-12 text-indigo-500" /></div>;
  }

  return (
    <>
      <OfflineIndicator isOnline={isOnline} />
      {session ? <MainApp /> : <Auth />}
      <ToastContainer />
    </>
  );
};

const MainApp = () => {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const { 
    foodItems, isLoadingItems, addFoodItem, updateFoodItem, deleteFoodItem, 
    publicFoodItems, isLoadingPublicItems, likes, comments, 
    shoppingLists, createShoppingList, addShoppingListItem,
    lastUsedShoppingListId, setLastUsedShoppingListId,
    getShoppingListItems, toggleShoppingListItem,
  } = useData();

  const [view, setView] = useState<View>('dashboard');
  const [modal, setModal] = useState<Modal>(null);
  const [currentItem, setCurrentItem] = useState<FoodItem | null>(null);
  const [itemTypeForNew, setItemTypeForNew] = useState<FoodItemType>('product');
  const [showApiKeyBanner, setShowApiKeyBanner] = useState(false);
  const { isAiEnabled } = useAppSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('date_desc');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isAiSearchLoading, setIsAiSearchLoading] = useState(false);
  const [filteredIds, setFilteredIds] = useState<string[] | null>(null);
  const [potentialDuplicates, setPotentialDuplicates] = useState<FoodItem[]>([]);
  const [itemToSave, setItemToSave] = useState<Omit<FoodItem, 'id' | 'user_id' | 'created_at'> | null>(null);
  
  // State for Shopping Mode
  const [shoppingModeList, setShoppingModeList] = useState<ShoppingList | null>(null);
  const { data: shoppingModeItems, isLoading: isLoadingShoppingModeItems } = getShoppingListItems(shoppingModeList?.id);

  const viewTitles: Record<View, string> = {
    dashboard: t('header.view.dashboard'),
    list: t('header.view.list'),
    discover: t('header.view.discover'),
    groups: t('header.view.groups'),
  };

  useEffect(() => {
    const keyExists = hasValidApiKey();
    const bannerDismissed = localStorage.getItem('apiKeyBannerDismissed') === 'true';
    if (isAiEnabled && !keyExists && !bannerDismissed) {
      setShowApiKeyBanner(true);
    } else {
      setShowApiKeyBanner(false);
    }
  }, [isAiEnabled]);

  const onSaveItem = useCallback(async (item: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) => {
    const isEditing = !!(currentItem && 'id' in currentItem);
    if(isEditing) {
      await updateFoodItem({ ...item, id: currentItem.id, user_id: currentItem.user_id, created_at: currentItem.created_at });
      addToast({ message: t('form.button.update'), type: 'success' });
    } else {
      await addFoodItem(item);
      addToast({ message: t('form.button.save'), type: 'success' });
    }
    setModal(null);
    setCurrentItem(null);
  }, [addFoodItem, updateFoodItem, currentItem, addToast, t]);

  const onDeleteItem = async (id: string) => {
    if (window.confirm(t('list.empty.description'))) {
      await deleteFoodItem(id);
      addToast({ message: 'Item deleted.', type: 'info' });
    }
  };

  const onEditItem = (id: string) => {
    const item = foodItems.find(i => i.id === id);
    if (item) {
      setCurrentItem(item);
      setModal('form');
    }
  };

  const handleAddToShoppingListRequest = (item: FoodItem) => {
      setCurrentItem(item);
      setModal('addToList');
  };
  
  const handleOpenShoppingMode = useCallback((listId: string) => {
    const list = shoppingLists.find(l => l.id === listId);
    if (list) {
      setLastUsedShoppingListId(list.id);
      setShoppingModeList(list);
    }
  }, [shoppingLists, setLastUsedShoppingListId]);

  const handleQuickAccessShoppingList = useCallback(() => {
    if (shoppingLists.length === 0) {
      setView('groups');
      addToast({ message: t('toast.noShoppingLists'), type: 'info' });
      return;
    }
    const targetListId = lastUsedShoppingListId || shoppingLists[0].id;
    handleOpenShoppingMode(targetListId);
  }, [shoppingLists, lastUsedShoppingListId, handleOpenShoppingMode, setView, addToast, t]);

  const handleConfirmAddItemToList = async (listId: string, quantity: number) => {
    if (!currentItem) return;

    try {
        await addShoppingListItem({
            list_id: listId,
            food_item_id: currentItem.id,
            name: currentItem.name,
            quantity,
        });
        const listName = shoppingLists.find(l => l.id === listId)?.name || 'list';
        addToast({ message: t('toast.addedToList', { itemName: currentItem.name, listName }), type: 'success' });
    } catch (error) {
        console.error("Failed to add item to list", error);
        addToast({ message: 'Failed to add item.', type: 'error' });
    } finally {
        setModal(null);
        setCurrentItem(null);
    }
  };

  const handleToggleShoppingListItem = async (itemId: string, checked: boolean) => {
    if (!shoppingModeList) return;
    await toggleShoppingListItem({ listId: shoppingModeList.id, itemId, checked });
  };

  const filteredItems = useMemo(() => {
    let items = foodItems;
    if (filteredIds) {
      const idSet = new Set(filteredIds);
      items = items.filter(item => idSet.has(item.id));
    }
    return items
      .filter(item => searchTerm ? item.name.toLowerCase().includes(searchTerm.toLowerCase()) : true)
      .filter(item => typeFilter === 'all' ? true : item.itemType === typeFilter)
      .filter(item => {
        if (ratingFilter === 'all') return true;
        if (ratingFilter === 'liked') return item.rating >= 4;
        if (ratingFilter === 'disliked') return item.rating <= 2;
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'date_asc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case 'rating_desc': return b.rating - a.rating;
          case 'rating_asc': return a.rating - b.rating;
          case 'name_asc': return a.name.localeCompare(b.name);
          case 'name_desc': return b.name.localeCompare(a.name);
          default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); // date_desc
        }
      });
  }, [foodItems, searchTerm, typeFilter, ratingFilter, sortBy, filteredIds]);

  const onAiSearch = async (query: string) => {
    setIsAiSearchLoading(true);
    try {
        const ids = await performConversationalSearch(query, foodItems);
        setFilteredIds(ids);
        setIsFilterPanelOpen(false);
    } catch (e) {
        const message = e instanceof Error ? e.message : "AI search failed";
        addToast({ message, type: 'error' });
    } finally {
        setIsAiSearchLoading(false);
    }
  };

  const resetFilters = () => {
      setSearchTerm('');
      setTypeFilter('all');
      setRatingFilter('all');
      setSortBy('date_desc');
      setFilteredIds(null);
  };
  
  const renderView = () => {
    if (isLoadingItems) return <div className="flex justify-center mt-8"><SpinnerIcon className="w-8 h-8 text-indigo-500" /></div>;
    switch (view) {
      case 'dashboard': return <Dashboard items={foodItems} onViewAll={() => setView('list')} onAddNew={() => { setCurrentItem(null); setItemTypeForNew('product'); setModal('form'); }} onDelete={onDeleteItem} onEdit={onEditItem} onViewDetails={(item) => { setCurrentItem(item); setModal('details'); }} onAddToShoppingList={handleAddToShoppingListRequest} />;
      case 'discover': return <DiscoverView items={publicFoodItems} isLoading={isLoadingPublicItems} onViewDetails={(item) => { setCurrentItem(item); setModal('details'); }} likes={likes} comments={comments} />;
      case 'groups': return <GroupsView shoppingLists={shoppingLists} members={{}} onSelectList={handleOpenShoppingMode} onCreateList={(name) => createShoppingList(name)} />;
      case 'list':
      default: return <FoodItemList items={filteredItems} onDelete={onDeleteItem} onEdit={onEditItem} onViewDetails={(item) => { setCurrentItem(item); setModal('details'); }} onAddToShoppingList={handleAddToShoppingListRequest} />;
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pb-20">
      {showApiKeyBanner && <ApiKeyBanner onDismiss={() => { setShowApiKeyBanner(false); localStorage.setItem('apiKeyBannerDismissed', 'true'); }} onOpenSettings={() => setModal('settings')} />}
      
      <header className="bg-white dark:bg-gray-800 shadow-sm p-4 sticky top-0 z-20">
        <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{viewTitles[view]}</h1>
            <div className="flex items-center gap-2">
                {view === 'list' && (
                    <button onClick={() => setIsFilterPanelOpen(true)} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" aria-label={t('header.button.filter')}>
                        <AdjustmentsHorizontalIcon className="w-6 h-6" />
                    </button>
                )}
                <button onClick={handleQuickAccessShoppingList} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" aria-label={t('header.button.shoppingList')}>
                    <ShoppingBagIcon className="w-6 h-6" />
                </button>
                <button onClick={() => setModal('settings')} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" aria-label={t('header.button.settings')}>
                    <Cog6ToothIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
      </header>

      <main className="container mx-auto p-4">{renderView()}</main>

      <BottomNavBar currentView={view} setView={setView} />
      
      {isFilterPanelOpen && <FilterPanel onClose={() => setIsFilterPanelOpen(false)} searchTerm={searchTerm} setSearchTerm={setSearchTerm} typeFilter={typeFilter} setTypeFilter={setTypeFilter} ratingFilter={ratingFilter} setRatingFilter={setRatingFilter} sortBy={sortBy} setSortBy={setSortBy} onReset={resetFilters} onAiSearch={onAiSearch} isAiSearchLoading={isAiSearchLoading} />}
      {modal === 'form' && <FoodItemForm onSaveItem={onSaveItem} onCancel={() => setModal(null)} initialData={currentItem} itemType={currentItem?.itemType || itemTypeForNew} shoppingLists={shoppingLists} />}
      {modal === 'details' && currentItem && <FoodItemDetailModal item={currentItem} onClose={() => { setModal(null); setCurrentItem(null); }} />}
      {modal === 'settings' && <SettingsModal onClose={() => setModal(null)} />}
      {modal === 'duplicates' && <DuplicateConfirmationModal items={potentialDuplicates} itemName={itemToSave?.name || ''} onConfirm={() => itemToSave && onSaveItem(itemToSave)} onCancel={() => setModal(null)} />}
      {shoppingModeList && <ShoppingMode list={shoppingModeList} items={shoppingModeItems || []} isLoading={isLoadingShoppingModeItems} onClose={() => setShoppingModeList(null)} onItemToggle={handleToggleShoppingListItem} onAddItem={() => {}} />}
      {modal === 'addToList' && currentItem && <AddToListModal item={currentItem} lists={shoppingLists} onAdd={handleConfirmAddItemToList} onClose={() => { setModal(null); setCurrentItem(null); }} />}
    </div>
  );
};

export default App;