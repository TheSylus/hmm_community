
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FoodItem, FoodItemType, ShoppingListItem, ShoppingList, UserProfile, Household, Receipt, ReceiptItem } from './types';
import { FoodItemForm } from './components/FoodItemForm';
import { FoodItemList } from './components/FoodItemList';
import { Dashboard } from './components/Dashboard';
import { ShoppingListView } from './components/ShoppingListView'; 
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
import { useReceipts } from './hooks/useReceipts';
import * as geminiService from './services/geminiService';
import { createReceipt } from './services/receiptService';
import { useTranslation } from './i18n/index';
import { PlusCircleIcon, SettingsIcon, ShoppingBagIcon, FunnelIcon, XMarkIcon, BuildingStorefrontIcon, MagnifyingGlassIcon, SpinnerIcon, UserCircleIcon, UserGroupIcon, BeakerIcon, BarcodeIcon, CameraIcon, PencilIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from './components/Icons';
import { useModalHistory } from './hooks/useModalHistory';
import { triggerHaptic } from './utils/haptics';
import { useAppSettings } from './contexts/AppSettingsContext';
import { BottomNavigation } from './components/BottomNavigation';
import { FinanceDashboard } from './components/finance/FinanceDashboard';
import { CameraCapture } from './components/CameraCapture';
import { ReceiptReviewModal } from './components/finance/ReceiptReviewModal';

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
export type TypeFilter = 'all' | 'product' | 'dish' | 'drugstore';
export type OwnerFilter = 'all' | 'mine' | 'family'; 

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

const App: React.FC = () => {
  const { t } = useTranslation();
  const { session, user } = useAuth();
  const { isBarcodeScannerEnabled } = useAppSettings();

  // --- Hook Integration ---
  
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

  const { 
    foodItems, 
    familyFoodItems, 
    isLoading: isFoodLoading, 
    error: foodError, 
    saveItem, 
    deleteItem, 
    refreshData: refreshFoodData
  } = useFoodData(user, userProfile?.household_id);

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

  // New Hook for Receipts
  const {
      receipts,
      isLoading: isReceiptsLoading,
      refreshReceipts,
      getMonthlySpending,
      getCategoryBreakdown
  } = useReceipts(user, userProfile?.household_id);


  // --- Local UI State ---
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'inventory' | 'shopping' | 'finance'>('inventory');

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  
  // Filtering & Sorting State
  const [searchTerm, setSearchTerm] = useState('');
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiSearchResults, setAiSearchResults] = useState<{ ids: string[] | null, error: string | null, isLoading: boolean }>({ ids: null, error: null, isLoading: false });
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all'); 
  const [sortBy, setSortBy] = useState<SortKey>('date_desc');
  
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Modal & Overlay State
  const [isFilterPanelVisible, setIsFilterPanelVisible] = useState(false);
  const [potentialDuplicates, setPotentialDuplicates] = useState<FoodItem[]>([]);
  const [itemToAdd, setItemToAdd] = useState<Omit<FoodItem, 'id' | 'user_id' | 'created_at'> | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<FoodItem | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sharedItemToShow, setSharedItemToShow] = useState<Omit<FoodItem, 'id' | 'user_id' | 'created_at'> | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSmartAddLoading, setIsSmartAddLoading] = useState(false);
  
  const [formStartMode, setFormStartMode] = useState<'barcode' | 'camera' | 'none'>('none');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Receipt States
  const [isReceiptCameraOpen, setIsReceiptCameraOpen] = useState(false);
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const [scannedReceiptData, setScannedReceiptData] = useState<(Partial<Receipt> & { items: Partial<ReceiptItem>[] }) | null>(null);

  useModalHistory(isFormVisible, () => setIsFormVisible(false));
  useModalHistory(isSettingsOpen, () => setIsSettingsOpen(false));
  useModalHistory(!!detailItem, () => setDetailItem(null));
  useModalHistory(isFilterPanelVisible, () => setIsFilterPanelVisible(false));
  useModalHistory(!!sharedItemToShow, () => setSharedItemToShow(null));
  useModalHistory(isReceiptCameraOpen, () => setIsReceiptCameraOpen(false));
  useModalHistory(!!scannedReceiptData, () => setScannedReceiptData(null));


  const isAnyFilterActive = useMemo(() => searchTerm.trim() !== '' || ratingFilter !== 'all' || typeFilter !== 'all' || aiSearchQuery !== '' || ownerFilter !== 'all', [searchTerm, ratingFilter, typeFilter, aiSearchQuery, ownerFilter]);
  
  const shoppingListFoodIds = useMemo(() => {
      return new Set(shoppingListItems.map(item => item.food_item_id));
  }, [shoppingListItems]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const householdInvite = params.get('join_household');
    if (householdInvite) {
        localStorage.setItem('pending_household_invite', householdInvite);
        window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const processPendingInvite = async () => {
        const storedInvite = localStorage.getItem('pending_household_invite');
        if (storedInvite && userProfile) {
            if (!userProfile.household_id) {
                try {
                    await joinHousehold(storedInvite);
                    localStorage.removeItem('pending_household_invite');
                    window.location.reload();
                } catch (e) {
                    console.error("Failed to join household from pending invite:", e);
                    setToastMessage("Failed to join household. Link invalid or expired.");
                    localStorage.removeItem('pending_household_invite');
                }
            } else {
                localStorage.removeItem('pending_household_invite');
            }
        }
    };
    if (userProfile) {
        processPendingInvite();
    }
  }, [userProfile, joinHousehold, t]);


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

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'SYNC_COMPLETE') {
            console.log('Sync complete! Re-fetching data.');
            setToastMessage(t('offline.syncComplete'));
            if(user) {
              refreshFoodData();
              refreshHousehold();
              refreshReceipts();
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
  }, [refreshFoodData, refreshHousehold, refreshReceipts, user, t]);


  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleCancelForm = useCallback(() => {
      setIsFormVisible(false);
      setEditingItem(null);
      setFormStartMode('none');
  }, []);

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
                restaurantName: minified.rn, cuisineType: minified.ct, price: minified.p,
            };
            setSharedItemToShow(reconstructedItem);
        } catch (error) { console.error("Failed to parse shared item data from URL:", error); }
      };
      processShareData();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSaveFormItem = useCallback(async (itemData: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) => {
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
        triggerHaptic('success');
        handleCancelForm();
      }
  }, [editingItem, foodItems, saveItem, handleCancelForm]);


  const handleConfirmDuplicateAdd = useCallback(async () => {
    if (itemToAdd) {
        await saveItem(itemToAdd);
        triggerHaptic('success');
    }
    setItemToAdd(null);
    setPotentialDuplicates([]);
    handleCancelForm();
  }, [itemToAdd, saveItem, handleCancelForm]);
  
  const handleDeleteFormItem = useCallback(async (id: string) => {
      triggerHaptic('warning');
      if (window.confirm("Are you sure you want to delete this item?")) {
        await deleteItem(id);
      }
  }, [deleteItem]);


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
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setRatingFilter('all');
    setTypeFilter('all');
    setOwnerFilter('all');
    clearAiSearch();
  }, [clearAiSearch]);
  
  const handleToggleShoppingList = useCallback((item: FoodItem) => {
      const existingItem = shoppingListItems.find(i => i.food_item_id === item.id);
      
      if (existingItem) {
          removeItem(existingItem.id);
          triggerHaptic('medium');
          setToastMessage(t('shoppingList.removedToast', { name: item.name }));
      } else {
          addItemToList(item.id, 1);
          triggerHaptic('success');
          setToastMessage(t('shoppingList.addedToast', { name: item.name }));
      }
  }, [shoppingListItems, removeItem, addItemToList, t]);

  const handleSmartQuickAdd = useCallback(async (input: string) => {
      if (!user) return;
      setIsSmartAddLoading(true);
      try {
          const parsedItems = await geminiService.parseShoppingList(input);
          let addedCount = 0;
          const allAvailableItems = [...foodItems, ...familyFoodItems];

          for (const parsedItem of parsedItems) {
              let match = allAvailableItems.find(i => i.name.toLowerCase() === parsedItem.name.toLowerCase());
              let foodItemId = match?.id;

              if (!foodItemId) {
                  const newItemData: Omit<FoodItem, 'id' | 'user_id' | 'created_at'> = {
                      name: parsedItem.name,
                      rating: 0,
                      itemType: 'product', 
                      category: parsedItem.category,
                      isFamilyFavorite: !!userProfile?.household_id, 
                  };
                  try {
                      const { createFoodItem } = await import('./services/foodItemService');
                      const newItem = await createFoodItem(newItemData, user.id);
                      foodItemId = newItem.id;
                      refreshFoodData();
                  } catch (e) {
                      console.error("Failed to auto-create item", e);
                      continue;
                  }
              }

              if (foodItemId) {
                  addItemToList(foodItemId, parsedItem.quantity);
                  addedCount++;
              }
          }
          if (addedCount > 0) {
              triggerHaptic('success');
              setToastMessage(t('shoppingList.addedAnotherToast', { name: `${addedCount} items` }));
          }
      } catch (e) {
          console.error("Smart Add failed:", e);
          setToastMessage("Could not process list. Please try again.");
      } finally {
          setIsSmartAddLoading(false);
      }
  }, [user, foodItems, familyFoodItems, userProfile, addItemToList, refreshFoodData, t]);


  const handleHouseholdCreateWrapper = useCallback(async (name: string) => {
      try {
          await createHousehold(name);
          setToastMessage(t('shoppingList.joinSuccess', { householdName: name }));
      } catch (e) {
          // Error handled in hook
      }
  }, [createHousehold, t]);
  
  const handleAddSharedItem = useCallback(async () => {
    if (sharedItemToShow) {
      await saveItem(sharedItemToShow);
      triggerHaptic('success');
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
      setFormStartMode('none');
      setIsFormVisible(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [foodItems, familyFoodItems]);
  
  const handleQuickCamera = useCallback(() => {
      setEditingItem(null);
      setFormStartMode('camera');
      setIsFormVisible(true);
  }, []);

  const handleCancelDuplicateAdd = useCallback(() => {
    setItemToAdd(null);
    setPotentialDuplicates([]);
  }, []);

  const filteredAndSortedItems = useMemo(() => {
    const uniqueItemsMap = new Map<string, FoodItem>();
    familyFoodItems.forEach(item => uniqueItemsMap.set(item.id, item));
    foodItems.forEach(item => uniqueItemsMap.set(item.id, item));
    let items = Array.from(uniqueItemsMap.values());

    if (aiSearchResults.ids) {
      const idSet = new Set(aiSearchResults.ids);
      items = items.filter(item => idSet.has(item.id));
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    
    items = items
      .filter(item => typeFilter === 'all' || item.itemType === typeFilter)
      .filter(item => {
        if (ownerFilter === 'mine') return item.user_id === user?.id; 
        if (ownerFilter === 'family') return item.isFamilyFavorite; 
        return true; 
      })
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
  }, [foodItems, familyFoodItems, searchTerm, ratingFilter, typeFilter, ownerFilter, sortBy, aiSearchResults.ids, user?.id]);
  
  const toggleCategory = useCallback((category: string) => {
      setCollapsedCategories(prev => {
          const newSet = new Set(prev);
          if (newSet.has(category)) newSet.delete(category);
          else newSet.add(category);
          return newSet;
      });
  }, []);

  const allVisibleCategories = useMemo(() => {
      const cats = new Set<string>();
      filteredAndSortedItems.forEach(item => cats.add(item.category || 'other'));
      return Array.from(cats);
  }, [filteredAndSortedItems]);

  const isAllCollapsed = allVisibleCategories.length > 0 && collapsedCategories.size >= allVisibleCategories.length;

  const toggleAllCategories = useCallback(() => {
      if (isAllCollapsed) {
          setCollapsedCategories(new Set()); 
      } else {
          setCollapsedCategories(new Set(allVisibleCategories)); 
      }
  }, [isAllCollapsed, allVisibleCategories]);


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

  const handleToggleFamilyStatus = useCallback(async (item: FoodItem) => {
      if (!user || item.user_id !== user.id) return;
      const newStatus = !item.isFamilyFavorite;
      const { id, user_id, created_at, ...dataToSave } = item;
      const payload = { ...dataToSave, isFamilyFavorite: newStatus };
      const success = await saveItem(payload, id);
      if (success) {
          triggerHaptic('medium');
          setToastMessage(newStatus 
              ? t('toast.familyShared', { name: item.name }) 
              : t('toast.private', { name: item.name })
          );
      }
  }, [user, saveItem, t]);

  // --- Receipt Logic ---
  const handleReceiptCapture = async (imageDataUrl: string) => {
      setIsReceiptCameraOpen(false);
      setIsProcessingReceipt(true);
      try {
          // Analyze via Gemini
          const analyzed = await geminiService.analyzeReceiptImage(imageDataUrl);
          setScannedReceiptData(analyzed);
      } catch (e) {
          console.error("Receipt Analysis Failed", e);
          setToastMessage("Could not scan receipt.");
      } finally {
          setIsProcessingReceipt(false);
      }
  };

  const handleSaveReceipt = async (data: Partial<Receipt> & { items: Partial<ReceiptItem>[] }) => {
      if (!user) return;
      try {
          await createReceipt(data, user.id, userProfile?.household_id || undefined);
          setScannedReceiptData(null);
          setToastMessage("Receipt Saved!");
          refreshReceipts(); // Update dashboard
      } catch (e) {
          console.error("Save Receipt Failed", e);
          setToastMessage("Failed to save receipt.");
      }
  };


  if (!session) {
    return <Auth />;
  }

  const renderContent = () => {
    // 1. Inventory View
    if (activeTab === 'inventory') {
        if (isFoodLoading && foodItems.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center pt-20">
                    <SpinnerIcon className="w-12 h-12 text-indigo-500" />
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            );
        }
        
        // AI Search Banner Logic (only for Inventory)
        const aiBanner = aiSearchResults.ids !== null ? (
            <div className="mb-6 p-4 bg-indigo-50 dark:bg-gray-800 rounded-lg flex items-center justify-between border border-indigo-100 dark:border-indigo-900/50">
                <div>
                    <h2 className="text-xl font-bold text-indigo-800 dark:text-indigo-200">{t('conversationalSearch.resultsTitle')}</h2>
                    <p className="text-sm text-indigo-600 dark:text-indigo-300 italic">"{aiSearchQuery}"</p>
                </div>
                <button onClick={clearAiSearch} className="flex items-center gap-2 text-sm bg-indigo-200 dark:bg-indigo-600/50 hover:bg-indigo-300 dark:hover:bg-indigo-600/80 text-indigo-800 dark:text-indigo-100 font-semibold py-1.5 px-3 rounded-full transition">
                    <XMarkIcon className="w-4 h-4" />
                    {t('conversationalSearch.clear')}
                </button>
            </div>
        ) : null;

        const aiError = aiSearchResults.error ? <p className="text-red-500 dark:text-red-400 text-center my-4">{aiSearchResults.error}</p> : null;

        return (
            <>
                {aiBanner}
                {aiError}
                <Dashboard 
                    items={filteredAndSortedItems}
                    isLoading={isFoodLoading}
                    onAddNew={handleQuickCamera}
                    onEdit={handleStartEdit}
                    onDelete={handleDeleteFormItem}
                    onViewDetails={handleViewDetails}
                    onAddToShoppingList={handleToggleShoppingList}
                    onToggleFamilyStatus={handleToggleFamilyStatus}
                    shoppingListFoodIds={shoppingListFoodIds}
                    isFiltering={isAnyFilterActive}
                    collapsedCategories={collapsedCategories}
                    onToggleCategory={toggleCategory}
                />
            </>
        );
    } 
    
    // 2. Shopping List View
    else if (activeTab === 'shopping') {
        return (
            <ShoppingListView 
                allLists={shoppingLists}
                activeListId={activeShoppingListId}
                listData={hydratedShoppingList} 
                household={household}
                householdMembers={householdMembers}
                currentUser={user}
                onRemove={removeItem} 
                onClear={clearCompleted} 
                onToggleChecked={toggleChecked} 
                onSelectList={setActiveShoppingListId}
                onCreateList={createList}
                onDeleteList={deleteList}
                onUpdateQuantity={updateQuantity}
                onSmartAdd={handleSmartQuickAdd}
                isSmartAddLoading={isSmartAddLoading}
            />
        );
    }

    // 3. Finance View
    else if (activeTab === 'finance') {
        // Calculate Totals for Dashboard
        const monthlyData = getMonthlySpending();
        const categoryData = getCategoryBreakdown();
        // Current Month Total
        const currentMonthLabel = new Date().toLocaleString('default', { month: 'short' });
        const currentTotal = monthlyData.find(d => d.label === currentMonthLabel)?.value || 0;

        return (
            <>
                <FinanceDashboard 
                    monthlyData={monthlyData}
                    categoryData={categoryData}
                    totalSpend={currentTotal}
                    isLoading={isReceiptsLoading}
                    onScan={() => setIsReceiptCameraOpen(true)}
                />
                
                {/* Global Overlays for Finance Flow */}
                {isReceiptCameraOpen && (
                    <CameraCapture 
                        onCapture={handleReceiptCapture}
                        onClose={() => setIsReceiptCameraOpen(false)}
                        mode="receipt"
                    />
                )}

                {isProcessingReceipt && (
                    <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 animate-fade-in text-white">
                        <SpinnerIcon className="w-12 h-12 text-white mb-4" />
                        <p className="text-lg font-bold">Analyzing Receipt...</p>
                        <p className="text-sm opacity-70">Detecting items and prices</p>
                    </div>
                )}

                {scannedReceiptData && (
                    <ReceiptReviewModal 
                        receiptData={scannedReceiptData}
                        onSave={handleSaveReceipt}
                        onClose={() => setScannedReceiptData(null)}
                    />
                )}
            </>
        );
    }
  }

  // Aggregate errors for display
  const displayError = foodError || householdError || shoppingListError;

  return (
    <div className="min-h-[100dvh] bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans transition-colors duration-300">
       
       {/* Full Screen Form Overlay */}
       {isFormVisible && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-100 dark:bg-gray-900 p-safe-top">
                <FoodItemForm 
                    onSaveItem={handleSaveFormItem} 
                    onCancel={handleCancelForm}
                    initialData={editingItem}
                    initialItemType={editingItem?.itemType || 'product'}
                    householdId={userProfile?.household_id || null}
                    startMode={formStartMode}
                />
            </div>
       )}

       {/* Main App Shell */}
       {!isFormVisible && (
           <>
            <header className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm shadow-md dark:shadow-lg sticky top-0 z-30 pt-safe-top">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex justify-between items-center gap-4">
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-green-500 dark:from-indigo-400 dark:to-green-400">
                            {t('header.title')}
                        </h1>
                        <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label={t('settings.title')}>
                            <SettingsIcon className="w-7 h-7 text-gray-600 dark:text-gray-300" />
                        </button>
                    </div>
                    
                    {/* Filter Bar (Only show in Inventory Tab) */}
                    {activeTab === 'inventory' && (
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
                            
                            <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 rounded-md p-1">
                                <button 
                                    onClick={() => setIsFilterPanelVisible(true)} 
                                    className="flex items-center justify-center p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-200"
                                    title={t('header.filter.button')}
                                >
                                    <FunnelIcon className="w-5 h-5" />
                                </button>
                                
                                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-0.5"></div>

                                <button
                                    onClick={toggleAllCategories}
                                    className="flex items-center justify-center p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-200"
                                    title={isAllCollapsed ? "Alles ausklappen" : "Alles einklappen"}
                                >
                                    {isAllCollapsed ? <ArrowsPointingOutIcon className="w-5 h-5" /> : <ArrowsPointingInIcon className="w-5 h-5" />}
                                </button>
                            </div>
                            </div>

                            {isAnyFilterActive && (
                                <div className="flex items-center gap-2 flex-wrap pt-1">
                                    {ownerFilter !== 'all' && <ActiveFilterPill onDismiss={() => setOwnerFilter('all')}>{t(`header.filter.active.owner.${ownerFilter}`)}</ActiveFilterPill>}
                                    {searchTerm.trim() && <ActiveFilterPill onDismiss={() => setSearchTerm('')}>{t('header.filter.active.search', { term: searchTerm })}</ActiveFilterPill>}
                                    {aiSearchQuery && <ActiveFilterPill onDismiss={clearAiSearch}>{t('header.filter.active.aiSearch', { term: aiSearchQuery })}</ActiveFilterPill>}
                                    {typeFilter !== 'all' && <ActiveFilterPill onDismiss={() => setTypeFilter('all')}>{t(`header.filter.active.type.${typeFilter}`)}</ActiveFilterPill>}
                                    {ratingFilter !== 'all' && <ActiveFilterPill onDismiss={() => setRatingFilter('all')}>{t(`header.filter.active.rating.${ratingFilter}`)}</ActiveFilterPill>}
                                    <button onClick={clearAllFilters} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">{t('header.filter.clearAll')}</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>
            
            <OfflineIndicator isOnline={isOnline} />

            <main className="container mx-auto p-4 md:p-8 pb-32">
                {displayError && isOnline && <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative mb-6" role="alert">{displayError}</div>}
                {renderContent()}
            </main>

            {/* Floating Action Button - Only on Inventory Tab */}
            {activeTab === 'inventory' && (
                <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] right-6 z-30">
                    <button
                        onClick={handleQuickCamera}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-4 rounded-full shadow-xl transition-transform transform hover:scale-105 flex items-center justify-center active:scale-95"
                        aria-label={t('form.button.takePhoto')}
                    >
                        <CameraIcon className="w-8 h-8" />
                    </button>
                </div>
            )}

            <BottomNavigation 
                activeTab={activeTab} 
                onTabChange={setActiveTab} 
                shoppingListCount={shoppingListItems.filter(i => !i.checked).length}
            />
           </>
       )}

      {toastMessage && (
         <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 text-sm font-semibold py-2 px-4 rounded-full shadow-lg animate-fade-in-out z-50">
            {toastMessage}
        </div>
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
            ownerFilter={ownerFilter}
            setOwnerFilter={setOwnerFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onReset={clearAllFilters}
            onAiSearch={handleConversationalSearch}
            isAiSearchLoading={aiSearchResults.isLoading}
        />
      )}

      {isSettingsOpen && <SettingsModal 
          onClose={() => setIsSettingsOpen(false)} 
          household={household}
          householdMembers={householdMembers}
          onHouseholdCreate={handleHouseholdCreateWrapper}
          onHouseholdLeave={leaveHousehold}
          onHouseholdDelete={deleteHousehold}
          error={householdError} 
      />}

      {potentialDuplicates.length > 0 && itemToAdd && (
        <DuplicateConfirmationModal items={potentialDuplicates} itemName={itemToAdd.name} onConfirm={handleConfirmDuplicateAdd} onCancel={handleCancelDuplicateAdd} />
      )}
      
      {detailItem && <FoodItemDetailModal 
        item={detailItem}
        currentUser={user}
        onClose={() => setDetailItem(null)}
        onEdit={() => handleStartEdit(detailItem.id)}
        onImageClick={setSelectedImage}
      />}

      {sharedItemToShow && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setSharedItemToShow(null)} role="dialog" aria-modal="true">
            <div className="relative bg-white dark:bg-gray-900 p-6 rounded-lg shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('modal.shared.title')}</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{t('modal.shared.description')}</p>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex-1 overflow-y-auto">
                    <FoodItemDetailView item={{ ...sharedItemToShow, id: 'shared-item-preview', user_id: '', created_at: new Date().toISOString() }} onImageClick={setSelectedImage} />
                </div>
                <div className="mt-6 flex flex-col sm:flex-row justify-end gap-4 border-t border-gray-200 dark:border-gray-700 pt-6">
                <button onClick={() => setSharedItemToShow(null)} className="w-full sm:w-auto px-6 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-md font-semibold transition-colors">{t('modal.shared.close')}</button>
                <button onClick={handleAddSharedItem} className="w-full sm:w-auto px-8 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors">{t('modal.shared.addToList')}</button>
                </div>
            </div>
        </div>
      )}
      
      {selectedImage && <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />}
      <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
          .animate-fade-in { animation: fadeIn 0.2s ease-out; }
          @keyframes fade-in-out {
              0%, 100% { opacity: 0; transform: translateY(20px) translateX(-50%); }
              10%, 90% { opacity: 1; transform: translateY(0) translateX(-50%); }
          }
          .animate-fade-in-out { animation: fade-in-out 3s ease-in-out; }
      `}</style>
    </div>
  );
};

export default App;
