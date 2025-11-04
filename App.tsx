import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Auth } from './components/Auth';
import { useAuth } from './contexts/AuthContext';
import { useData } from './hooks/useData';
import { FoodItemList } from './components/FoodItemList';
import { FoodItemForm } from './components/FoodItemForm';
import { FoodItemDetailModal } from './components/FoodItemDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { ApiKeyBanner } from './components/ApiKeyBanner';
import { useAppSettings } from './contexts/AppSettingsContext';
import { hasValidApiKey } from './services/geminiService';
import { FoodItem, FoodItemType, SortKey, TypeFilter, RatingFilter, ShoppingList, UserProfile, HydratedShoppingListItem } from './types';
import { ToastContainer } from './components/Toast';
import { performConversationalSearch } from './services/geminiService';
import { useToast } from './contexts/ToastContext';
import { DuplicateConfirmationModal } from './components/DuplicateConfirmationModal';
import { SpinnerIcon, AdjustmentsHorizontalIcon, Cog6ToothIcon, ShoppingBagIcon, PlusCircleIcon, MagnifyingGlassIcon } from './components/Icons';
import { FilterPanel } from './components/FilterPanel';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AddToListModal } from './components/AddToListModal';
import { useTranslation } from './i18n';
import { ShoppingMode } from './components/ShoppingMode';
import { BottomNavBar } from './components/BottomNavBar';
import { Dashboard } from './components/Dashboard';
import { DiscoverView } from './components/DiscoverView';
import { GroupsView } from './components/GroupsView';

type Modal = 'form' | 'details' | 'settings' | 'duplicates' | 'addToList' | null;
export type View = 'list' | 'dashboard' | 'discover' | 'groups';

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
    shoppingLists, allShoppingListItems, createShoppingList, groupMembers, addShoppingListItem,
    lastUsedShoppingListId, setLastUsedShoppingListId,
    toggleShoppingListItem,
  } = useData();

  const [view, setView] = useState<View>('list');
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
  
  const [shoppingModeList, setShoppingModeList] = useState<ShoppingList | null>(null);

  const shoppingModeItems = useMemo((): HydratedShoppingListItem[] => {
    if (!shoppingModeList) return [];
    
    // The new `allShoppingListItems` from the hook already contains joined `food_items` data.
    // We just need to filter and map it to the `HydratedShoppingListItem` shape.
    return allShoppingListItems
        .filter(item => item.list_id === shoppingModeList.id)
        .map(item => {
            const foodItemData = item.food_items || {};
            return {
                // Base FoodItem properties, preferring the joined data but with fallbacks
                id: foodItemData.id || item.food_item_id || item.id,
                user_id: foodItemData.user_id || '',
                created_at: foodItemData.created_at || item.created_at,
                name: item.name, // The name on the list item is the source of truth
                rating: foodItemData.rating || 0,
                notes: foodItemData.notes,
                image: foodItemData.image,
                tags: foodItemData.tags,
                itemType: foodItemData.itemType || 'product',
                isPublic: foodItemData.isPublic || false,
                shared_with_list_id: foodItemData.shared_with_list_id,
                nutriScore: foodItemData.nutriScore,
                purchaseLocation: foodItemData.purchaseLocation,
                ingredients: foodItemData.ingredients,
                allergens: foodItemData.allergens,
                isLactoseFree: foodItemData.isLactoseFree,
                isVegan: foodItemData.isVegan,
                isGlutenFree: foodItemData.isGlutenFree,
                restaurantName: foodItemData.restaurantName,
                cuisineType: foodItemData.cuisineType,
                price: foodItemData.price,
                
                // Hydrated properties
                shoppingListItemId: item.id,
                quantity: item.quantity,
                checked: item.checked,
                added_by: item.added_by,
            };
        });
  }, [shoppingModeList, allShoppingListItems]);


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
    if (window.confirm(t('list.delete.confirm'))) {
      await deleteFoodItem(id);
      addToast({ message: t('toast.itemDeleted'), type: 'info' });
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
      addToast({ message: t('toast.noShoppingLists'), type: 'info' });
      setView('groups');
      return;
    }
    const targetListId = lastUsedShoppingListId || shoppingLists[0]?.id;
    if (targetListId) {
        handleOpenShoppingMode(targetListId);
    }
  }, [shoppingLists, lastUsedShoppingListId, handleOpenShoppingMode, addToast, t]);

  const handleConfirmAddItemToList = async (listId: string, quantity: number) => {
    if (!currentItem) return;
    try {
        await addShoppingListItem({ list_id: listId, food_item_id: currentItem.id, name: currentItem.name, quantity });
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
    await toggleShoppingListItem({ itemId, checked });
  };

  const filteredItems = useMemo(() => {
    let items = foodItems;
    if (filteredIds) {
      const idSet = new Set(filteredIds);
      items = items.filter(item => idSet.has(item.id));
    }
    return items
      .filter(item => searchTerm ? item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || item.tags?.join(' ').toLowerCase().includes(searchTerm.toLowerCase()) : true)
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
          default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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
  
  const handleAddNewItem = (type: FoodItemType) => {
    setCurrentItem(null);
    setItemTypeForNew(type);
    setModal('form');
  };

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard 
                  items={foodItems} 
                  onViewAll={() => setView('list')} 
                  onAddNew={() => handleAddNewItem('product')} 
                  onDelete={onDeleteItem} 
                  onEdit={onEditItem}
                  onViewDetails={(item) => { setCurrentItem(item); setModal('details'); }}
                  onAddToShoppingList={handleAddToShoppingListRequest}
                />;
      case 'discover':
        return <DiscoverView 
                  items={publicFoodItems} 
                  isLoading={isLoadingPublicItems} 
                  onViewDetails={(item) => { setCurrentItem(item); setModal('details'); }}
                  likes={likes}
                  comments={comments}
                />;
      case 'groups':
        return <GroupsView 
                  shoppingLists={shoppingLists}
                  members={groupMembers}
                  onSelectList={handleOpenShoppingMode}
                  onCreateList={createShoppingList}
                />;
      case 'list':
      default:
        return isLoadingItems ? (
          <div className="flex justify-center mt-8"><SpinnerIcon className="w-8 h-8 text-indigo-500" /></div>
        ) : (
          <FoodItemList items={filteredItems} onDelete={onDeleteItem} onEdit={onEditItem} onViewDetails={(item) => { setCurrentItem(item); setModal('details'); }} onAddToShoppingList={handleAddToShoppingListRequest} />
        );
    }
  };

  const getHeaderTitle = () => {
    if (view === 'list') return t('header.title');
    return t(`header.view.${view}`);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pb-20">
      {showApiKeyBanner && <ApiKeyBanner onDismiss={() => { setShowApiKeyBanner(false); localStorage.setItem('apiKeyBannerDismissed', 'true'); }} onOpenSettings={() => setModal('settings')} />}
      
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 shadow-sm">
        <header className="container mx-auto p-4 flex justify-between items-center">
            <button onClick={() => setView('list')} className="cursor-pointer">
              <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-green-500 dark:from-indigo-400 dark:to-green-400">{getHeaderTitle()}</h1>
            </button>
            <div className="flex items-center gap-2">
                <button onClick={handleQuickAccessShoppingList} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" aria-label={t('header.button.shoppingList')}>
                    <ShoppingBagIcon className="w-6 h-6" />
                </button>
                <button onClick={() => setModal('settings')} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" aria-label={t('header.button.settings')}>
                    <Cog6ToothIcon className="w-6 h-6" />
                </button>
            </div>
        </header>
        {view === 'list' && (
            <div className="container mx-auto px-4 pb-4">
                <div className="flex gap-2 items-center">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder={t('header.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-gray-700 border-transparent rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3 pl-10"
                        />
                    </div>
                    <button 
                        onClick={() => setIsFilterPanelOpen(true)} 
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                        <AdjustmentsHorizontalIcon className="w-5 h-5" />
                        <span>{t('filter.buttonText')}</span>
                    </button>
                </div>
            </div>
        )}
      </div>

      <main className="container mx-auto p-4">
        {renderView()}
      </main>

      <div className="fixed bottom-24 right-6 z-10">
        <button
            onClick={() => handleAddNewItem('product')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-4 rounded-full shadow-lg transition-transform transform hover:scale-110"
            aria-label={t('form.addNewButton')}
        >
            <PlusCircleIcon className="w-8 h-8" />
        </button>
      </div>
      
      <BottomNavBar currentView={view} setView={setView} />
      
      {isFilterPanelOpen && <FilterPanel onClose={() => setIsFilterPanelOpen(false)} searchTerm={searchTerm} setSearchTerm={setSearchTerm} typeFilter={typeFilter} setTypeFilter={setTypeFilter} ratingFilter={ratingFilter} setRatingFilter={setRatingFilter} sortBy={sortBy} setSortBy={setSortBy} onReset={resetFilters} onAiSearch={onAiSearch} isAiSearchLoading={isAiSearchLoading} />}
      {modal === 'form' && <FoodItemForm onSaveItem={onSaveItem} onCancel={() => setModal(null)} initialData={currentItem} itemType={currentItem?.itemType || itemTypeForNew} shoppingLists={shoppingLists} />}
      {modal === 'details' && currentItem && <FoodItemDetailModal item={currentItem} onClose={() => { setModal(null); setCurrentItem(null); }} />}
      {modal === 'settings' && <SettingsModal onClose={() => setModal(null)} />}
      {modal === 'duplicates' && <DuplicateConfirmationModal items={potentialDuplicates} itemName={itemToSave?.name || ''} onConfirm={() => itemToSave && onSaveItem(itemToSave)} onCancel={() => setModal(null)} />}
      {shoppingModeList && <ShoppingMode list={shoppingModeList} items={shoppingModeItems} isLoading={isLoadingItems} onClose={() => setShoppingModeList(null)} onItemToggle={handleToggleShoppingListItem} onAddItem={() => {}} />}
      {modal === 'addToList' && currentItem && <AddToListModal item={currentItem} lists={shoppingLists} onAdd={handleConfirmAddItemToList} onClose={() => { setModal(null); setCurrentItem(null); }} />}
    </div>
  );
};

export default App;
