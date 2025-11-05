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
import { FoodItem, FoodItemType, SortKey, TypeFilter, RatingFilter, ShoppingList, HydratedShoppingListItem } from './types';
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
import { ManageMembersModal } from './components/ManageMembersModal';

type Modal = 'form' | 'details' | 'settings' | 'duplicates' | 'addToList' | 'manageMembers' | null;
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
  const { user } = useAuth();
  const { t } = useTranslation();
  const { addToast } = useToast();
  const { 
    foodItems, isLoadingItems, addFoodItem, updateFoodItem, deleteFoodItem, 
    publicFoodItems, isLoadingPublicItems, likes, comments,
    shoppingLists, allShoppingListItems, createShoppingList, updateShoppingList, deleteShoppingList,
    groupMembers, removeMemberFromList,
    lastUsedShoppingListId, setLastUsedShoppingListId,
    addShoppingListItem, toggleShoppingListItem,
  } = useData();

  const [view, setView] = useState<View>('list');
  const [modal, setModal] = useState<Modal>(null);
  const [modalList, setModalList] = useState<ShoppingList | null>(null);
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
    
    return allShoppingListItems
        .filter(item => item.list_id === shoppingModeList.id)
        .map(item => {
            const foodItemData = item.food_items || {};
            const hydratedItem: HydratedShoppingListItem = {
                id: foodItemData.id || item.food_item_id!,
                user_id: foodItemData.user_id || '',
                created_at: foodItemData.created_at || item.created_at,
                name: item.name, 
                rating: foodItemData.rating || 0,
                notes: foodItemData.notes,
                image: foodItemData.image,
                tags: foodItemData.tags,
                item_type: foodItemData.item_type || 'product',
                is_public: foodItemData.is_public || false,
                shared_with_list_id: foodItemData.shared_with_list_id,
                nutri_score: foodItemData.nutri_score,
                purchase_location: foodItemData.purchase_location,
                ingredients: foodItemData.ingredients,
                allergens: foodItemData.allergens,
                is_lactose_free: foodItemData.is_lactose_free,
                is_vegan: foodItemData.is_vegan,
                is_gluten_free: foodItemData.is_gluten_free,
                restaurant_name: foodItemData.restaurant_name,
                cuisine_type: foodItemData.cuisine_type,
                price: foodItemData.price,
                shoppingListItemId: item.id,
                quantity: item.quantity,
                checked: item.checked,
                added_by: item.added_by,
            };
            return hydratedItem;
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
    try {
        if(isEditing) {
          await updateFoodItem({ ...item, id: currentItem.id, user_id: currentItem.user_id, created_at: currentItem.created_at });
          addToast({ message: t('form.button.update'), type: 'success' });
        } else {
          await addFoodItem(item);
          addToast({ message: t('form.button.save'), type: 'success' });
        }
        setModal(null);
        setCurrentItem(null);
    } catch (error) {
       const message = error instanceof Error ? error.message : "Failed to save item.";
       addToast({ message, type: 'error' });
    } finally {
        setPotentialDuplicates([]);
        setItemToSave(null);
    }
  }, [addFoodItem, updateFoodItem, foodItems, currentItem, t, addToast]);
  
  const checkIfDuplicate = useCallback((item: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) => {
     const isEditing = !!(currentItem && 'id' in currentItem);
     if(isEditing) {
        onSaveItem(item);
        return;
     }
     const duplicates = foodItems.filter(fi => 
       fi.name.toLowerCase().trim() === item.name.toLowerCase().trim()
     );

     if(duplicates.length > 0) {
        setPotentialDuplicates(duplicates);
        setItemToSave(item);
        setModal('duplicates');
     } else {
        onSaveItem(item);
     }
  }, [foodItems, onSaveItem, currentItem]);

  const handleConfirmSave = useCallback(() => {
      if (itemToSave) {
        onSaveItem(itemToSave);
      }
  }, [itemToSave, onSaveItem]);
  

  const handleDeleteItem = useCallback(async (id: string) => {
    if (window.confirm(t('list.delete.confirm'))) {
      try {
        await deleteFoodItem(id);
        addToast({ message: t('toast.itemDeleted'), type: 'info' });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete item.";
        addToast({ message, type: 'error' });
      }
    }
  }, [deleteFoodItem, t, addToast]);

  const handleEditItem = useCallback((id: string) => {
    const itemToEdit = foodItems.find(item => item.id === id);
    if (itemToEdit) {
      setCurrentItem(itemToEdit);
      setItemTypeForNew(itemToEdit.item_type);
      setModal('form');
    }
  }, [foodItems]);

  const handleViewDetails = useCallback((item: FoodItem) => {
    setCurrentItem(item);
    setModal('details');
  }, []);

  const handleOpenForm = useCallback((type: FoodItemType) => {
    setCurrentItem(null);
    setItemTypeForNew(type);
    setModal('form');
  }, []);

  const handleCloseModal = useCallback(() => {
    setModal(null);
    setCurrentItem(null);
    setPotentialDuplicates([]);
    setItemToSave(null);
  }, []);
  
  const handleAddToShoppingList = useCallback((item: FoodItem) => {
      if (shoppingLists.length === 0) {
        addToast({ message: t('toast.noShoppingLists'), type: 'info' });
        return;
      }
      setCurrentItem(item);
      setModal('addToList');
  }, [shoppingLists, addToast, t]);

  const handleConfirmAddToList = useCallback(async (listId: string, quantity: number) => {
    if (currentItem) {
        try {
            await addShoppingListItem({
                list_id: listId,
                food_item_id: currentItem.id,
                name: currentItem.name,
                quantity,
            });
            const listName = shoppingLists.find(l => l.id === listId)?.name || '';
            addToast({ message: t('toast.addedToList', { itemName: currentItem.name, listName }), type: 'success' });
            setLastUsedShoppingListId(listId);
            handleCloseModal();
        } catch(e) {
            const message = e instanceof Error ? e.message : "Failed to add to list.";
            addToast({ message, type: 'error' });
        }
    }
  }, [currentItem, addShoppingListItem, handleCloseModal, addToast, shoppingLists, setLastUsedShoppingListId, t]);

  const filteredItems = useMemo(() => {
    let items = [...foodItems];
    
    if (filteredIds) {
      const idSet = new Set(filteredIds);
      items = items.filter(item => idSet.has(item.id));
    }

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(lowercasedTerm) ||
        item.notes?.toLowerCase().includes(lowercasedTerm) ||
        item.tags?.some(tag => tag.toLowerCase().includes(lowercasedTerm))
      );
    }
    
    if (typeFilter !== 'all') {
      items = items.filter(item => item.item_type === typeFilter);
    }

    if (ratingFilter !== 'all') {
      items = items.filter(item => {
        if (ratingFilter === 'liked') return item.rating >= 4;
        if (ratingFilter === 'disliked') return item.rating <= 2;
        return true;
      });
    }

    const sortFunctions: Record<SortKey, (a: FoodItem, b: FoodItem) => number> = {
      'date_desc': (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      'date_asc': (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      'rating_desc': (a, b) => b.rating - a.rating,
      'rating_asc': (a, b) => a.rating - b.rating,
      'name_asc': (a, b) => a.name.localeCompare(b.name),
      'name_desc': (a, b) => b.name.localeCompare(a.name),
    };

    return items.sort(sortFunctions[sortBy]);
  }, [foodItems, searchTerm, typeFilter, ratingFilter, sortBy, filteredIds]);
  
  const handleAiSearch = useCallback(async (query: string) => {
      if (!isAiEnabled) return;
      
      setIsAiSearchLoading(true);
      try {
        const ids = await performConversationalSearch(query, foodItems);
        setFilteredIds(ids);
      } catch (error) {
        const message = error instanceof Error ? error.message : "AI search failed.";
        addToast({ message, type: 'error' });
      } finally {
        setIsAiSearchLoading(false);
      }
  }, [isAiEnabled, foodItems, addToast]);

  const handleResetFilters = useCallback(() => {
    setSearchTerm('');
    setTypeFilter('all');
    setRatingFilter('all');
    setFilteredIds(null);
  }, []);

  const handleSelectList = useCallback((listId: string) => {
      const list = shoppingLists.find(l => l.id === listId);
      if(list) {
          setShoppingModeList(list);
      }
  }, [shoppingLists]);
  
  const handleManageMembers = useCallback((list: ShoppingList) => {
      setShoppingModeList(null); // Close shopping mode if open
      setModalList(list);
      setModal('manageMembers');
  }, []);

  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard 
          items={filteredItems} 
          onViewAll={() => setView('list')} 
          onAddNew={() => handleOpenForm('product')}
          onDelete={handleDeleteItem}
          onEdit={handleEditItem}
          onViewDetails={handleViewDetails}
          onAddToShoppingList={handleAddToShoppingList}
        />;
      case 'discover':
        return <DiscoverView 
          items={publicFoodItems} 
          isLoading={isLoadingPublicItems}
          onViewDetails={handleViewDetails}
          likes={likes}
          comments={comments}
        />;
      case 'groups':
        return <GroupsView 
          shoppingLists={shoppingLists}
          members={groupMembers}
          onSelectList={handleSelectList}
          onCreateList={createShoppingList}
          onRenameList={updateShoppingList}
          onDeleteList={deleteShoppingList}
          onManageMembers={handleManageMembers}
        />;
      case 'list':
      default:
        return (
          <>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">{t('header.view.list')}</h1>
                <button onClick={() => setIsFilterPanelOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <AdjustmentsHorizontalIcon className="w-5 h-5" />
                    <span>{t('filter.buttonText')}</span>
                </button>
            </div>
            {isLoadingItems ? (
              <div className="flex justify-center mt-8"><SpinnerIcon className="w-8 h-8 text-indigo-500" /></div>
            ) : (
              <FoodItemList 
                items={filteredItems} 
                onDelete={handleDeleteItem}
                onEdit={handleEditItem}
                onViewDetails={handleViewDetails}
                onAddToShoppingList={handleAddToShoppingList}
              />
            )}
            <div className="fixed bottom-20 right-4 z-20">
              <button
                onClick={() => handleOpenForm('product')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-4 rounded-full shadow-lg transition-transform transform hover:scale-105"
                aria-label={t('form.addNewButton')}
              >
                  <PlusCircleIcon className="w-8 h-8" />
              </button>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      {showApiKeyBanner && (
        <ApiKeyBanner
          onDismiss={() => {
            setShowApiKeyBanner(false);
            localStorage.setItem('apiKeyBannerDismissed', 'true');
          }}
          onOpenSettings={() => setModal('settings')}
        />
      )}
      
      <main className="container mx-auto p-4 pb-24">
        {renderContent()}
      </main>
      
      <BottomNavBar currentView={view} setView={setView} />
      
      {modal === 'form' && (
        <FoodItemForm
          onSaveItem={checkIfDuplicate}
          onCancel={handleCloseModal}
          initialData={currentItem}
          item_type={itemTypeForNew}
          shoppingLists={shoppingLists}
        />
      )}
      {modal === 'details' && currentItem && (
        <FoodItemDetailModal item={currentItem} onClose={handleCloseModal} />
      )}
      {modal === 'settings' && <SettingsModal onClose={handleCloseModal} />}
      {modal === 'duplicates' && (
        <DuplicateConfirmationModal
          items={potentialDuplicates}
          itemName={itemToSave?.name || ''}
          onConfirm={handleConfirmSave}
          onCancel={handleCloseModal}
        />
      )}
      {modal === 'addToList' && currentItem && (
          <AddToListModal 
              item={currentItem}
              lists={shoppingLists}
              onAdd={handleConfirmAddToList}
              onClose={handleCloseModal}
          />
      )}
      {modal === 'manageMembers' && modalList && (
          <ManageMembersModal
              list={modalList}
              members={groupMembers[modalList.id] || []}
              ownerId={modalList.owner_id}
              currentUserId={user!.id}
              onClose={handleCloseModal}
              onRemoveMember={removeMemberFromList}
          />
      )}
      
      {isFilterPanelOpen && (
        <FilterPanel 
          onClose={() => setIsFilterPanelOpen(false)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          ratingFilter={ratingFilter}
          setRatingFilter={setRatingFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onReset={handleResetFilters}
          onAiSearch={handleAiSearch}
          isAiSearchLoading={isAiSearchLoading}
        />
      )}

      {shoppingModeList && (
        <ShoppingMode 
            list={shoppingModeList}
            items={shoppingModeItems}
            isLoading={isLoadingItems}
            onClose={() => setShoppingModeList(null)}
            onItemToggle={toggleShoppingListItem}
            onManageMembers={handleManageMembers}
        />
      )}
    </div>
  );
};

export default App;