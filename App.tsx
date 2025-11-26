import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FoodItem, FoodItemType, ShoppingListItem, ShoppingList, UserProfile, Household } from './types';
import { FoodItemForm } from './components/FoodItemForm';
import { FoodItemList } from './components/FoodItemList';
import { Dashboard } from './components/Dashboard';
import { ShoppingListModal } from './components/ShoppingListModal';
import { FilterPanel } from './components/FilterPanel';
import { DuplicateConfirmationModal } from './components/DuplicateConfirmationModal';
import { ImageModal } from './components/ImageModal';
import { SettingsModal } from './components/SettingsModal';
import { FoodItemDetailModal } from './components/FoodItemDetailModal';
import { FoodItemDetailView } from './components/FoodItemDetailView';
import { Auth } from './components/Auth';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useAuth } from './contexts/AuthContext';
import { useFoodData } from './hooks/useFoodData';
import { useHousehold } from './hooks/useHousehold';
import { useShoppingList } from './hooks/useShoppingList';
import * as geminiService from './services/geminiService';
import { useTranslation } from './i18n/index';
import { PlusCircleIcon, SettingsIcon, ShoppingBagIcon, FunnelIcon, XMarkIcon, BuildingStorefrontIcon, MagnifyingGlassIcon, SpinnerIcon, UserCircleIcon, UserGroupIcon, HomeIcon } from './components/Icons';

// Helper function to decode from URL-safe Base64 and decompress the data
const decodeAndDecompress = async (base64UrlString: string): Promise<any> => {
  let base64 = base64UrlString.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) { base64 += '='; }
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) { bytes[i] = binaryString.charCodeAt(i); }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  const decompressed = await new Response(stream).text();
  return JSON.parse(decompressed);
};

export type SortKey = 'date_desc' | 'date_asc' | 'rating_desc' | 'rating_asc' | 'name_asc' | 'name_desc';
export type RatingFilter = 'liked' | 'disliked' | 'all';
export type TypeFilter = 'all' | 'product' | 'dish';
export type AppView = 'dashboard' | 'list' | 'family';


// A version of FoodItem that includes its status on the shopping list
export type HydratedShoppingListItem = FoodItem & {
  shoppingListItemId: string;
  checked: boolean;
  added_by_user_id: string;
  checked_by_user_id: string | null;
  quantity: number;
};


const ActiveFilterPill: React.FC<{onDismiss: () => void, children: React.ReactNode}> = ({onDismiss, children}) => (
  <div className="flex items-center gap-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-600/50 dark:text-indigo-200 text-xs font-semibold px-2 py-1 rounded-full">
      <span>{children}</span>
      <button onClick={onDismiss} className="p-0.5 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-500/50">
          <XMarkIcon className="w-3 h-3"/>
      </button>
  </div>
);


export const App: React.FC = () => {
  const { t } = useTranslation();
  const { session, user } = useAuth();

  // --- Hook Integration ---
  
  // 1. Household Management
  const { 
    userProfile, 
    household, 
    householdMembers, 
    loading: isHouseholdLoading,
    error: householdError,
    createHousehold,
    joinHousehold,
    leaveHousehold,
    deleteHousehold,
    refreshHousehold
  } = useHousehold(user);

  // 2. Food Data Management
  const { 
    foodItems, 
    familyFoodItems, 
    isLoading: isFoodLoading, 
    error: foodError, 
    saveItem, 
    deleteItem,
    refreshData: refreshFoodData
  } = useFoodData(user, userProfile?.household_id);

  // 3. Shopping List Management
  const {
    shoppingLists,
    activeShoppingListId,
    shoppingListItems,
    error: shoppingListError,
    setActiveShoppingListId,
    createList,
    deleteList,
    addItemToList,
    updateQuantity,
    removeItem,
    toggleChecked,
    clearCompleted
  } = useShoppingList(user, household);


  // --- Local UI State ---
  
  // UI/View State
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  
  // Filtering & Sorting State
  const [searchTerm, setSearchTerm] = useState('');
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiSearchResults, setAiSearchResults] = useState<{ ids: string[] | null, error: string | null, isLoading: boolean }>({ ids: null, error: null, isLoading: false });
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('date_desc');
  
  // Modal & Overlay State
  const [isFilterPanelVisible, setIsFilterPanelVisible] = useState(false);
  const [potentialDuplicates, setPotentialDuplicates] = useState<FoodItem[]>([]);
  const [itemToAdd, setItemToAdd] = useState<Omit<FoodItem, 'id' | 'user_id' | 'created_at'> | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<FoodItem | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
  const [sharedItemToShow, setSharedItemToShow] = useState<Omit<FoodItem, 'id' | 'user_id' | 'created_at'> | null>(null);
  const [isItemTypeModalVisible, setIsItemTypeModalVisible] = useState(false);
  const [newItemType, setNewItemType] = useState<FoodItemType>('product');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Offline State
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const isAnyFilterActive = useMemo(() => searchTerm.trim() !== '' || ratingFilter !== 'all' || typeFilter !== 'all' || aiSearchQuery !== '', [searchTerm, ratingFilter, typeFilter, aiSearchQuery]);
  
  // Compute set of food IDs currently in the shopping list to pass down to components
  const shoppingListFoodIds = useMemo(() => {
      return new Set(shoppingListItems.map(item => item.food_item_id));
  }, [shoppingListItems]);

  // --- Pending Invite Logic ---
  // Capture URL param immediately on mount, even if not logged in
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const householdInvite = params.get('join_household');
    if (householdInvite) {
        localStorage.setItem('pending_household_invite', householdInvite);
        // Clean URL to look nice
        window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Process pending invite when User Profile is ready
  useEffect(() => {
    const processPendingInvite = async () => {
        // Check localStorage for invite preserved across login redirect
        const storedInvite = localStorage.getItem('pending_household_invite');
        
        if (storedInvite && userProfile) {
            if (!userProfile.household_id) {
                try {
                    await joinHousehold(storedInvite);
                    // Clear it so we don't try again
                    localStorage.removeItem('pending_household_invite');
                    // HARD RELOAD: Critical for updating RLS policies and Hooks dependencies effectively
                    // giving the user a fresh state with the new household permissions.
                    window.location.reload();
                } catch (e) {
                    console.error("Failed to join household from pending invite:", e);
                    setToastMessage("Failed to join household. Link invalid or expired.");
                    localStorage.removeItem('pending_household_invite');
                }
            } else {
                // User already has a household, ignore or warn? For now just clear.
                localStorage.removeItem('pending_household_invite');
            }
        }
    };

    if (userProfile) {
        processPendingInvite();
    }
  }, [userProfile, joinHousehold, t]);


  // Listen for online/offline status changes
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

  // Listen for service worker sync messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'SYNC_COMPLETE') {
            console.log('Sync complete! Re-fetching data.');
            setToastMessage(t('offline.syncComplete'));
            if(user) {
              refreshFoodData();
              refreshHousehold();
            }
        }
    };
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }
    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
    };
  }, [refreshFoodData, refreshHousehold, user, t]);


  // Toast Message Timeout
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleCancelForm = useCallback(() => {
      setIsFormVisible(false);
      setEditingItem(null);
  }, []);

  // URL Share Data Handling
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareData = params.get('s');
    
    if (shareData) {
      const processShareData = async () => {
        try {
            const minified = await decodeAndDecompress(shareData);
            const reconstructedItem: Omit<FoodItem, 'id' | 'user_id' | 'created_at'> = {
                name: minified.n || '', rating: minified.r || 0, itemType: minified.it || 'product', notes: minified.no, tags: minified.t,
                nutriScore: minified.ns, ingredients: minified.i, allergens: minified.a, isLactoseFree: !!minified.lf, isVegan: !!minified.v, isGlutenFree: !!minified.gf,
                restaurantName: minified.rn, cuisineType: minified.ct, price: minified.p, category: minified.c
            };
            setSharedItemToShow(reconstructedItem);
        } catch (error) { console.error("Failed to parse shared item data from URL:", error); }
      };
      processShareData();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // View Switching Logic
  useEffect(() => {
    if (searchTerm.trim() !== '' || ratingFilter !== 'all' || typeFilter !== 'all' || aiSearchResults.ids !== null) {
      setActiveView('list');
    }
  }, [searchTerm, ratingFilter, typeFilter, aiSearchResults.ids]);

  // Main Action Handlers utilizing Hooks
  const handleSaveFormItem = useCallback(async (itemData: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) => {
      // Check for duplicates only if adding new item
      if (!editingItem) {
          const duplicates = foodItems.filter(item => item.name.trim().toLowerCase() === itemData.name.trim().toLowerCase());
          if (duplicates.length > 0) {
              setPotentialDuplicates(duplicates);
              setItemToAdd(itemData);
              return;
          }
      }

      const success = await saveItem(itemData, editingItem?.id);
      if (success) {
        handleCancelForm();
      }
  }, [editingItem, foodItems, saveItem, handleCancelForm]);


  const handleConfirmDuplicateAdd = useCallback(async () => {
    if (itemToAdd) {
        await saveItem(itemToAdd);
    }
    setItemToAdd(null);
    setPotentialDuplicates([]);
    handleCancelForm();
  }, [itemToAdd, saveItem, handleCancelForm]);
  
  const handleDeleteFormItem = useCallback(async (id: string) => {
      await deleteItem(id);
  }, [deleteItem]);


  // Other Handlers
  const handleConversationalSearch = useCallback(async (query: string) => {
    setAiSearchQuery(query);
    setIsFilterPanelVisible(false);
    setAiSearchResults({ ids: null, error: null, isLoading: true });
    try {
      const resultIds = await geminiService.performConversationalSearch(query, foodItems);
      setAiSearchResults({ ids: resultIds, error: null, isLoading: false });
    } catch (e) {
      console.error(e);
      setAiSearchResults({ ids: null, error: t('conversationalSearch.error'), isLoading: false });
    }
  }, [foodItems, t]);

  const clearAiSearch = useCallback(() => {
    setAiSearchQuery('');
    setAiSearchResults({ ids: null, error: null, isLoading: false });
    if(!isAnyFilterActive) {
      setActiveView('dashboard');
    }
  }, [isAnyFilterActive]);

  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setRatingFilter('all');
    setTypeFilter('all');
    clearAiSearch();
    setActiveView('dashboard');
  }, [clearAiSearch]);
  
  const handleAddToShoppingListWrapper = useCallback((item: FoodItem) => {
      addItemToList(item.id, 1);
      setToastMessage(t('shoppingList.addedToast', { name: item.name }));
  }, [addItemToList, t]);

  const handleHouseholdCreateWrapper = useCallback(async (name: string) => {
      try {
          await createHousehold(name);
          setToastMessage(t('shoppingList.joinSuccess', { householdName: name }));
      } catch (e) {
          // Error handled in hook, but we might want toast
      }
  }, [createHousehold, t]);
  
  const handleAddSharedItem = useCallback(async () => {
    if (sharedItemToShow) {
      await saveItem(sharedItemToShow);
      setSharedItemToShow(null);
    }
  }, [sharedItemToShow, saveItem]);

  const handleViewDetails = useCallback((item: FoodItem) => {
    setDetailItem(item);
  }, []);

  const handleStartEdit = useCallback((id: string) => {
    const itemToEdit = [...foodItems, ...familyFoodItems].find(item => item.id === id);
    if (itemToEdit) {
      setDetailItem(null);
      setEditingItem(itemToEdit);
      setIsFormVisible(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [foodItems, familyFoodItems]);
  
  const handleAddNewClick = useCallback(() => {
    setEditingItem(null);
    setIsItemTypeModalVisible(true);
  }, []);

  const handleSelectType = useCallback((type: FoodItemType) => {
    setNewItemType(type);
    setIsItemTypeModalVisible(false);
    setIsFormVisible(true);
  }, []);
  
  const handleCancelDuplicateAdd = useCallback(() => {
    setItemToAdd(null);
    setPotentialDuplicates([]);
  }, []);

  const filteredAndSortedItems = useMemo(() => {
    let items = activeView === 'family' ? familyFoodItems : foodItems;

    if (aiSearchResults.ids) {
      const idSet = new Set(aiSearchResults.ids);
      items = items.filter(item => idSet.has(item.id));
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    items = items
      .filter(item => typeFilter === 'all' || item.itemType === typeFilter)
      .filter(item => {
        if (ratingFilter === 'all') return true;
        if (ratingFilter === 'liked') return item.rating >= 4;
        if (ratingFilter === 'disliked') return item.rating <= 2 && item.rating > 0;
        return true;
      })
      .filter(item =>  !searchTerm.trim() ? true : (
          item.name.toLowerCase().includes(lowerCaseSearchTerm) ||
          item.notes?.toLowerCase().includes(lowerCaseSearchTerm) ||
          item.tags?.join(' ').toLowerCase().includes(lowerCaseSearchTerm) ||
          (item.itemType === 'dish' && (
              item.restaurantName?.toLowerCase().includes(lowerCaseSearchTerm) ||
              item.cuisineType?.toLowerCase().includes(lowerCaseSearchTerm)
          ))
        )
      );
    return [...items].sort((a, b) => {
      switch (sortBy) {
        case 'date_asc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'rating_desc': return b.rating - a.rating;
        case 'rating_asc': return a.rating - b.rating;
        case 'name_asc': return a.name.localeCompare(b.name);
        case 'name_desc': return b.name.localeCompare(a.name);
        case 'date_desc':
        default: return new Date(b.created_at).getTime() - new Date(b.created_at).getTime();
      }
    });
  }, [foodItems, familyFoodItems, activeView, searchTerm, ratingFilter, typeFilter, sortBy, aiSearchResults.ids]);
  
  const hydratedShoppingList = useMemo((): HydratedShoppingListItem[] => {
      const allVisibleItems = [...foodItems, ...familyFoodItems];
      const foodItemMap = new Map(allVisibleItems.map(item => [item.id, item]));
      const hydratedItems: HydratedShoppingListItem[] = [];
      for (const sli of shoppingListItems) {
        const foodItemDetails = foodItemMap.get(sli.food_item_id);
        if (foodItemDetails) {
          hydratedItems.push(Object.assign({}, foodItemDetails, {
            shoppingListItemId: sli.id, checked: sli.checked, added_by_user_id: sli.added_by_user_id, checked_by_user_id: sli.checked_by_user_id, quantity: sli.quantity,
          }));
        }
      }
      return hydratedItems;
  }, [foodItems, familyFoodItems, shoppingListItems]);


  if (!session) {
    return <Auth />;
  }

  const renderContent = () => {
    if (isFoodLoading || (userProfile?.household_id && !household && isHouseholdLoading)) {
       return (
           <div className="flex flex-col items-center justify-center pt-20">
              <SpinnerIcon className="w-12 h-12 text-indigo-500" />
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Loading...</p>
           </div>
       );
    }
    if (isFormVisible) {
        return (
            <FoodItemForm 
                onSaveItem={handleSaveFormItem} 
                onCancel={handleCancelForm}
                initialData={editingItem}
                itemType={editingItem?.itemType || newItemType}
                householdId={userProfile?.household_id || null}
            />
        );
    }
    switch(activeView) {
      case 'dashboard':
        return (
          <Dashboard 
            items={foodItems}
            onViewAll={() => setActiveView('list')}
            onAddNew={handleAddNewClick}
            onEdit={handleStartEdit}
            onDelete={handleDeleteFormItem}
            onViewDetails={handleViewDetails}
            onAddToShoppingList={handleAddToShoppingListWrapper}
            shoppingListFoodIds={shoppingListFoodIds}
          />
        );
      case 'family':
        if (!household) {
          return (
            <div className="text-center py-10 px-4">
              <h2 className="text-2xl font-semibold text-gray-600 dark:text-gray-400">{t('family.noHousehold.title')}</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">{t('family.noHousehold.description')}</p>
            </div>
          );
        }
        return <FoodItemList items={filteredAndSortedItems} onDelete={handleDeleteFormItem} onEdit={handleStartEdit} onViewDetails={handleViewDetails} onAddToShoppingList={handleAddToShoppingListWrapper} shoppingListFoodIds={shoppingListFoodIds} />;
      case 'list':
      default:
        return (
          <>
            {aiSearchResults.ids !== null && (
              <div className="my-6 p-4 bg-indigo-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-indigo-800 dark:text-indigo-200">{t('conversationalSearch.resultsTitle')}</h2>
                    <p className="text-sm text-indigo-600 dark:text-indigo-300 italic">"{aiSearchQuery}"</p>
                  </div>
                  <button onClick={clearAiSearch} className="flex items-center gap-2 text-sm bg-indigo-200 dark:bg-indigo-600/50 hover:bg-indigo-300 dark:hover:bg-indigo-600/80 text-indigo-800 dark:text-indigo-100 font-semibold py-1.5 px-3 rounded-full transition">
                    <XMarkIcon className="w-4 h-4" />
                    {t('conversationalSearch.clear')}
                  </button>
              </div>
            )}
            {aiSearchResults.error && <p className="text-red-500 dark:text-red-400 text-center my-4">{aiSearchResults.error}</p>}
            <FoodItemList 
              items={filteredAndSortedItems} 
              onDelete={handleDeleteFormItem} 
              onEdit={handleStartEdit}
              onViewDetails={handleViewDetails}
              onAddToShoppingList={handleAddToShoppingListWrapper}
              shoppingListFoodIds={shoppingListFoodIds}
            />
          </>
        );
    }
  }

  // Aggregate errors for display
  const displayError = foodError || householdError || shoppingListError;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans transition-colors duration-300 pb-20">
       <header className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm shadow-md dark:shadow-lg sticky top-0 z-20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center gap-4">
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-green-500 dark:from-indigo-400 dark:to-green-400">
                    {t('header.title')}
                </h1>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsShoppingListOpen(true)} className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label={t('header.shoppingListAria')}>
                        <ShoppingBagIcon className="w-7 h-7 text-gray-600 dark:text-gray-300" />
                        {shoppingListItems.length > 0 && <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs font-bold ring-2 ring-white dark:ring-gray-800">{shoppingListItems.length}</span>}
                    </button>
                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label={t('settings.title')}>
                        <SettingsIcon className="w-7 h-7 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>
            </div>
            {!isFormVisible && (
                <div className="mt-4 space-y-3">
                    <div className="flex gap-2 items-center">
                       <div className="relative flex-1">
                          <input
                              type="search"
                              placeholder={t('header.searchPlaceholder')}
                              value={searchTerm}
                              onChange={e => setSearchTerm(e.target.value)}
                              className="w-full bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-full shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2 pl-10 pr-4 transition"
                          />
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                          </div>
                       </div>
                       <button onClick={() => setIsFilterPanelVisible(true)} className={`relative p-2.5 rounded-full transition-colors ${isAnyFilterActive ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                           <FunnelIcon className="w-6 h-6" />
                           {isAnyFilterActive && <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-gray-800"></span>}
                       </button>
                    </div>
                    {isAnyFilterActive && (
                        <div className="flex flex-wrap gap-2">
                            {searchTerm && <ActiveFilterPill onDismiss={() => setSearchTerm('')}>{t('header.filter.active.search', { term: searchTerm })}</ActiveFilterPill>}
                            {aiSearchQuery && <ActiveFilterPill onDismiss={clearAiSearch}>{t('header.filter.active.aiSearch', { term: aiSearchQuery })}</ActiveFilterPill>}
                            {typeFilter !== 'all' && <ActiveFilterPill onDismiss={() => setTypeFilter('all')}>{t(`header.filter.active.type.${typeFilter}`)}</ActiveFilterPill>}
                            {ratingFilter !== 'all' && <ActiveFilterPill onDismiss={() => setRatingFilter('all')}>{t(`header.filter.active.rating.${ratingFilter}`)}</ActiveFilterPill>}
                            <button onClick={clearAllFilters} className="text-xs text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 underline ml-1">
                                {t('header.filter.clearAll')}
                            </button>
                        </div>
                    )}
                </div>
            )}
          </div>
       </header>

       <main className="container mx-auto px-4 py-6 max-w-6xl">
          {!isOnline && <OfflineIndicator isOnline={isOnline} />}
          {displayError && (
              <div className="bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-4 mb-6 rounded shadow-sm">
                  <p className="font-bold">Error</p>
                  <p>{displayError}</p>
              </div>
          )}
          {renderContent()}
       </main>

       {!isFormVisible && (
        <nav className="fixed bottom-0 w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 pb-safe z-10">
            <div className="flex justify-around items-center h-16">
                <button 
                    onClick={() => setActiveView('dashboard')}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeView === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                    <HomeIcon className="w-6 h-6" />
                    <span className="text-xs font-medium">{t('dashboard.title')}</span>
                </button>
                
                <div className="relative -top-6">
                    <button 
                        onClick={handleAddNewClick}
                        className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center text-white ring-4 ring-gray-100 dark:ring-gray-900"
                    >
                        <PlusCircleIcon className="w-8 h-8" />
                    </button>
                </div>

                <button 
                    onClick={() => setActiveView('family')}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeView === 'family' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                    <UserGroupIcon className="w-6 h-6" />
                    <span className="text-xs font-medium">{t('nav.family')}</span>
                </button>
            </div>
        </nav>
       )}

       {/* Toast Notification */}
       {toastMessage && (
           <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg z-50 animate-fade-in-up text-sm">
               {toastMessage}
           </div>
       )}

       {/* Modals */}
       {isShoppingListOpen && (
           <ShoppingListModal
               allLists={shoppingLists}
               activeListId={activeShoppingListId}
               listData={hydratedShoppingList}
               household={household}
               householdMembers={householdMembers}
               currentUser={user}
               onRemove={removeItem}
               onClear={clearCompleted}
               onClose={() => setIsShoppingListOpen(false)}
               onToggleChecked={toggleChecked}
               onSelectList={setActiveShoppingListId}
               onCreateList={createList}
               onDeleteList={deleteList}
               onUpdateQuantity={updateQuantity}
           />
       )}

       {isFilterPanelVisible && (
           <FilterPanel 
               onClose={() => setIsFilterPanelVisible(false)} 
               searchTerm={searchTerm}
               setSearchTerm={setSearchTerm}
               typeFilter={typeFilter}
               setTypeFilter={setTypeFilter}
               ratingFilter={ratingFilter}
               setRatingFilter={setRatingFilter}
               sortBy={sortBy}
               setSortBy={setSortBy}
               onReset={clearAllFilters}
               onAiSearch={handleConversationalSearch}
               isAiSearchLoading={aiSearchResults.isLoading}
           />
       )}

       {potentialDuplicates.length > 0 && itemToAdd && (
           <DuplicateConfirmationModal 
               items={potentialDuplicates} 
               itemName={itemToAdd.name} 
               onConfirm={handleConfirmDuplicateAdd} 
               onCancel={handleCancelDuplicateAdd} 
           />
       )}

        {selectedImage && (
            <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
        )}

        {detailItem && (
            <FoodItemDetailModal 
                item={detailItem} 
                currentUser={user}
                onClose={() => setDetailItem(null)} 
                onEdit={(id) => { setDetailItem(null); handleStartEdit(id); }}
                onImageClick={setSelectedImage}
            />
        )}

        {isSettingsOpen && (
            <SettingsModal 
                onClose={() => setIsSettingsOpen(false)}
                household={household}
                householdMembers={householdMembers}
                onHouseholdCreate={handleHouseholdCreateWrapper}
                onHouseholdLeave={leaveHousehold}
                onHouseholdDelete={deleteHousehold}
                error={householdError}
            />
        )}
        
        {sharedItemToShow && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setSharedItemToShow(null)}>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('modal.shared.title')}</h3>
                        <button onClick={() => setSharedItemToShow(null)}><XMarkIcon className="w-6 h-6 text-gray-500" /></button>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{t('modal.shared.description')}</p>
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md mb-4">
                        <p className="font-bold">{sharedItemToShow.name}</p>
                        <p className="text-sm text-gray-500">{sharedItemToShow.rating} Stars • {sharedItemToShow.itemType}</p>
                    </div>
                    <p className="text-xs text-gray-400 italic mb-4">{t('modal.shared.summaryNotice')}</p>
                    <button onClick={handleAddSharedItem} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                        {t('modal.shared.addToList')}
                    </button>
                </div>
            </div>
        )}

        {isItemTypeModalVisible && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setIsItemTypeModalVisible(false)}>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl max-w-md w-full transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-6">{t('modal.itemType.title')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button 
                            onClick={() => handleSelectType('product')}
                            className="flex flex-col items-center justify-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border-2 border-transparent hover:border-indigo-500 rounded-xl transition-all duration-200 group"
                        >
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-800 rounded-full text-indigo-600 dark:text-indigo-300 group-hover:scale-110 transition-transform">
                                <ShoppingBagIcon className="w-8 h-8" />
                            </div>
                            <span className="font-semibold text-gray-700 dark:text-gray-200">{t('modal.itemType.product')}</span>
                        </button>
                        <button 
                            onClick={() => handleSelectType('drugstore')}
                            className="flex flex-col items-center justify-center gap-3 p-4 bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 dark:hover:bg-teal-900/50 border-2 border-transparent hover:border-teal-500 rounded-xl transition-all duration-200 group"
                        >
                            <div className="p-3 bg-teal-100 dark:bg-teal-800 rounded-full text-teal-600 dark:text-teal-300 group-hover:scale-110 transition-transform">
                                <HomeIcon className="w-8 h-8" />
                            </div>
                            <span className="font-semibold text-gray-700 dark:text-gray-200">{t('modal.itemType.drugstore')}</span>
                        </button>
                        <button 
                            onClick={() => handleSelectType('dish')}
                            className="flex flex-col items-center justify-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 border-2 border-transparent hover:border-orange-500 rounded-xl transition-all duration-200 group"
                        >
                            <div className="p-3 bg-orange-100 dark:bg-orange-800 rounded-full text-orange-600 dark:text-orange-300 group-hover:scale-110 transition-transform">
                                <BuildingStorefrontIcon className="w-8 h-8" />
                            </div>
                            <span className="font-semibold text-gray-700 dark:text-gray-200">{t('modal.itemType.dish')}</span>
                        </button>
                    </div>
                    <button onClick={() => setIsItemTypeModalVisible(false)} className="mt-6 w-full py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium transition-colors">
                        {t('form.button.cancel')}
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};