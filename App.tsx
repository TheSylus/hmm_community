import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { FoodItem, FoodItemType, ShoppingList, UserProfile, Household, Receipt, ReceiptItem } from './types';
import { FoodItemForm } from './components/FoodItemForm';
import { Dashboard } from './components/Dashboard';
import { ShoppingListView } from './components/ShoppingListView'; 
import { FilterPanel } from './components/FilterPanel';
import { DuplicateConfirmationModal } from './components/DuplicateConfirmationModal';
import { ImageModal } from './components/ImageModal';
import { SettingsModal } from './components/SettingsModal';
import { FoodItemDetailView } from './components/FoodItemDetailView';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { useAuth } from './contexts/AuthContext';
import { useFoodData } from './hooks/useFoodData';
import { useHousehold } from './hooks/useHousehold';
import { useShoppingList } from './hooks/useShoppingList';
import { useReceipts } from './hooks/useReceipts';
import * as geminiService from './services/geminiService';
import { createReceipt } from './services/receiptService';
import { useTranslation } from './i18n/index';
import { XMarkIcon, SpinnerIcon, CameraIcon } from './components/Icons';
import { useModalHistory } from './hooks/useModalHistory';
import { triggerHaptic } from './utils/haptics';
import { useAppSettings } from './contexts/AppSettingsContext';
import { FinanceDashboard } from './components/finance/FinanceDashboard';
import { CameraCapture } from './components/CameraCapture';
import { ReceiptReviewModal } from './components/finance/ReceiptReviewModal';
import { ReceiptToInventoryModal } from './components/finance/ReceiptToInventoryModal';

// --- TYPES & HELPERS ---
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

// --- SUB-COMPONENTS (PAGES) ---

// 1. Settings Page Component
const SettingsPage: React.FC<{
    household: Household | null; 
    householdMembers: UserProfile[]; 
    onHouseholdCreate: (n: string) => Promise<void>; 
    onHouseholdLeave: () => Promise<void>; 
    onHouseholdDelete: () => Promise<void>; 
    error: string | null;
}> = (props) => {
    const navigate = useNavigate();
    return <SettingsModal onClose={() => navigate(-1)} {...props} />;
};

// 2. Detail Page Component
const ItemDetailPage: React.FC<{
    items: FoodItem[]; 
    currentUser: any; 
    onImageClick: (url: string) => void;
}> = ({ items, currentUser, onImageClick }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const item = items.find(i => i.id === id);

    if (!item) return <div className="p-8 text-center">Item not found</div>;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm min-h-[50vh]">
            <FoodItemDetailView item={item} onImageClick={onImageClick} />
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                {item.user_id === currentUser?.id && (
                    <button onClick={() => navigate(`/edit/${item.id}`)} className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md">
                        {t('form.editTitle')}
                    </button>
                )}
            </div>
        </div>
    );
};

// 3. Form Page Component (Add/Edit)
const ItemFormPage: React.FC<{
    items: FoodItem[];
    onSave: (item: any) => Promise<void>;
    householdId: string | null;
}> = ({ items, onSave, householdId }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Determine start mode from state passed via navigation
    const startMode = (location.state as any)?.startMode || 'none';
    const initialItem = id ? items.find(i => i.id === id) : null;

    const handleSave = async (data: any) => {
        // Wrapper to navigate after save
        // We let the parent App handle the actual DB save logic for now
        // Ideally this logic moves here later.
        await onSave(data); 
        navigate(-1);
    };

    return (
        <FoodItemForm 
            onSaveItem={handleSave}
            onCancel={() => navigate(-1)}
            initialData={initialItem}
            initialItemType={initialItem?.itemType || 'product'}
            householdId={householdId}
            startMode={startMode}
        />
    );
};


// --- MAIN APP COMPONENT ---

export const App: React.FC = () => {
  const { t } = useTranslation();
  const { session, user } = useAuth();
  const navigate = useNavigate();

  // --- Hook Integration ---
  
  const { 
    userProfile, household, householdMembers, 
    loading: isHouseholdLoading, error: householdError,
    createHousehold, joinHousehold, leaveHousehold, deleteHousehold, refreshHousehold
  } = useHousehold(user);

  const { 
    foodItems, familyFoodItems, isLoading: isFoodLoading, error: foodError, 
    saveItem, saveItemsBulk, deleteItem, refreshData: refreshFoodData
  } = useFoodData(user, userProfile?.household_id);

  const {
    shoppingLists, activeShoppingListId, shoppingListItems, error: shoppingListError,
    setActiveShoppingListId, createList, deleteList, addItemToList, updateQuantity, removeItem, toggleChecked, clearCompleted
  } = useShoppingList(user, household);

  const {
      receipts, isLoading: isReceiptsLoading, refreshReceipts, getMonthlySpending, getCategoryBreakdown
  } = useReceipts(user, userProfile?.household_id);

  // --- Global State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiSearchResults, setAiSearchResults] = useState<{ ids: string[] | null, error: string | null, isLoading: boolean }>({ ids: null, error: null, isLoading: false });
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all'); 
  const [sortBy, setSortBy] = useState<SortKey>('date_desc');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  
  const [isFilterPanelVisible, setIsFilterPanelVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSmartAddLoading, setIsSmartAddLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Receipt State
  const [isReceiptCameraOpen, setIsReceiptCameraOpen] = useState(false);
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const [scannedReceiptData, setScannedReceiptData] = useState<(Partial<Receipt> & { items: Partial<ReceiptItem>[] }) | null>(null);
  const [confirmedReceiptForImport, setConfirmedReceiptForImport] = useState<{receipt: Receipt, items: ReceiptItem[]} | null>(null);

  // Modal History for transient modals
  useModalHistory(isFilterPanelVisible, () => setIsFilterPanelVisible(false));
  useModalHistory(isReceiptCameraOpen, () => setIsReceiptCameraOpen(false));
  useModalHistory(!!selectedImage, () => setSelectedImage(null));

  // --- Derived State ---
  const isAnyFilterActive = useMemo(() => searchTerm.trim() !== '' || ratingFilter !== 'all' || typeFilter !== 'all' || aiSearchQuery !== '' || ownerFilter !== 'all', [searchTerm, ratingFilter, typeFilter, aiSearchQuery, ownerFilter]);
  const shoppingListFoodIds = useMemo(() => new Set(shoppingListItems.map(item => item.food_item_id)), [shoppingListItems]);

  const allItems = useMemo(() => {
      const uniqueMap = new Map<string, FoodItem>();
      familyFoodItems.forEach(item => uniqueMap.set(item.id, item));
      foodItems.forEach(item => uniqueMap.set(item.id, item));
      return Array.from(uniqueMap.values());
  }, [foodItems, familyFoodItems]);

  // Filter Logic
  const filteredAndSortedItems = useMemo(() => {
    let items = [...allItems];

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
  }, [allItems, searchTerm, ratingFilter, typeFilter, ownerFilter, sortBy, aiSearchResults.ids, user?.id]);

  const hydratedShoppingList = useMemo((): HydratedShoppingListItem[] => {
      const foodItemMap = new Map(allItems.map(item => [item.id, item]));
      const hydratedItems: HydratedShoppingListItem[] = [];
      for (const sli of shoppingListItems) {
        const foodItemDetails = foodItemMap.get(sli.food_item_id);
        if (foodItemDetails) {
          hydratedItems.push({
            ...foodItemDetails,
            shoppingListItemId: sli.id,
            checked: sli.checked,
            added_by_user_id: sli.added_by_user_id,
            checked_by_user_id: sli.checked_by_user_id,
            quantity: sli.quantity,
          });
        }
      }
      return hydratedItems;
  }, [allItems, shoppingListItems]);

  // --- Handlers ---

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

  const handleToggleFamilyStatus = useCallback(async (item: FoodItem) => {
      if (!user || item.user_id !== user.id) return;
      const newStatus = !item.isFamilyFavorite;
      const { id, user_id, created_at, ...dataToSave } = item;
      const success = await saveItem({ ...dataToSave, isFamilyFavorite: newStatus }, id);
      if (success) {
          triggerHaptic('medium');
          setToastMessage(newStatus ? t('toast.familyShared', { name: item.name }) : t('toast.private', { name: item.name }));
      }
  }, [user, saveItem, t]);

  const handleHouseholdCreateWrapper = useCallback(async (name: string) => {
      try {
          await createHousehold(name);
          setToastMessage(t('shoppingList.joinSuccess', { householdName: name }));
      } catch (e) {}
  }, [createHousehold, t]);

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

  const clearAllFilters = useCallback(() => {
    setSearchTerm(''); setRatingFilter('all'); setTypeFilter('all'); setOwnerFilter('all');
    setAiSearchQuery(''); setAiSearchResults({ ids: null, error: null, isLoading: false });
  }, []);

  const handleSmartQuickAdd = useCallback(async (input: string) => {
      if (!user) return;
      setIsSmartAddLoading(true);
      try {
          const parsedItems = await geminiService.parseShoppingList(input);
          let addedCount = 0;
          for (const parsedItem of parsedItems) {
              let match = allItems.find(i => i.name.toLowerCase() === parsedItem.name.toLowerCase());
              let foodItemId = match?.id;
              if (!foodItemId) {
                  // Auto create item if missing
                  const { createFoodItem } = await import('./services/foodItemService');
                  const newItem = await createFoodItem({ name: parsedItem.name, rating: 0, itemType: 'product', category: parsedItem.category, isFamilyFavorite: !!userProfile?.household_id }, user.id);
                  foodItemId = newItem.id;
                  refreshFoodData();
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
          setToastMessage("Could not process list.");
      } finally {
          setIsSmartAddLoading(false);
      }
  }, [user, allItems, userProfile, addItemToList, refreshFoodData, t]);

  // --- Receipt Handlers ---
  const handleReceiptCapture = async (imageDataUrl: string) => {
      setIsReceiptCameraOpen(false);
      setIsProcessingReceipt(true);
      try {
          const contextItems = hydratedShoppingList.filter(i => i.checked).map(i => ({ id: i.id, name: i.name }));
          const analyzed = await geminiService.analyzeReceiptImage(imageDataUrl, contextItems);
          setScannedReceiptData(analyzed);
      } catch (e) {
          setToastMessage("Could not scan receipt.");
      } finally {
          setIsProcessingReceipt(false);
      }
  };

  const handleSaveReceipt = async (data: Partial<Receipt> & { items: Partial<ReceiptItem>[] }) => {
      if (!user) return;
      try {
          const savedReceipt = await createReceipt(data, user.id, userProfile?.household_id || undefined);
          setScannedReceiptData(null);
          refreshReceipts(); 
          if (savedReceipt && savedReceipt.items && savedReceipt.items.length > 0) {
              setConfirmedReceiptForImport({ receipt: savedReceipt as Receipt, items: savedReceipt.items as ReceiptItem[] });
          } else {
              setToastMessage("Receipt Saved!");
          }
      } catch (e: any) {
          setToastMessage(`Failed to save: ${e.message}`);
      }
  };

  const handleImportReceiptItems = async (selectedItems: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>[]) => {
      if (selectedItems.length > 0) {
          const success = await saveItemsBulk(selectedItems);
          if (success) {
              triggerHaptic('success');
              setToastMessage(`Imported ${selectedItems.length} items.`);
          }
      }
      setConfirmedReceiptForImport(null);
  };

  // --- Early Returns ---
  if (!session) return <Auth />;

  const displayError = foodError || householdError || shoppingListError;

  return (
    <>
      <Routes>
        <Route element={
            <Layout 
                shoppingListCount={shoppingListItems.filter(i => !i.checked).length}
                isOnline={isOnline}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                isAnyFilterActive={isAnyFilterActive}
                toggleAllCategories={() => {
                    // Simple logic for categories toggle
                    const cats = new Set<string>();
                    filteredAndSortedItems.forEach(item => cats.add(item.category || 'other'));
                    const allCats = Array.from(cats);
                    if (collapsedCategories.size >= allCats.length) setCollapsedCategories(new Set());
                    else setCollapsedCategories(new Set(allCats));
                }}
                isAllCollapsed={filteredAndSortedItems.length > 0 && collapsedCategories.size > 0} // Approximate
                onOpenSettings={() => navigate('/settings')}
                onOpenFilter={() => setIsFilterPanelVisible(true)}
                ownerFilter={ownerFilter} setOwnerFilter={setOwnerFilter}
                aiSearchQuery={aiSearchQuery} clearAiSearch={() => { setAiSearchQuery(''); setAiSearchResults({ ids: null, error: null, isLoading: false }); }}
                typeFilter={typeFilter} setTypeFilter={setTypeFilter}
                ratingFilter={ratingFilter} setRatingFilter={setRatingFilter}
                clearAllFilters={clearAllFilters}
            />
        }>
            {/* INVENTORY (Dashboard) */}
            <Route path="/" element={
                <>
                    {displayError && isOnline && <div className="bg-red-100 text-red-700 px-4 py-3 rounded m-4">{displayError}</div>}
                    
                    {aiSearchResults.ids !== null && (
                        <div className="mb-6 p-4 bg-indigo-50 dark:bg-gray-800 rounded-lg flex items-center justify-between border border-indigo-100">
                            <div><h2 className="text-xl font-bold text-indigo-800 dark:text-indigo-200">{t('conversationalSearch.resultsTitle')}</h2><p className="text-sm italic">"{aiSearchQuery}"</p></div>
                            <button onClick={() => { setAiSearchQuery(''); setAiSearchResults({ ids: null, error: null, isLoading: false }); }} className="text-sm bg-indigo-200 px-3 py-1.5 rounded-full"><XMarkIcon className="w-4 h-4" /> Clear</button>
                        </div>
                    )}
                    {aiSearchResults.error && <p className="text-red-500 text-center">{aiSearchResults.error}</p>}

                    <Dashboard 
                        items={filteredAndSortedItems}
                        isLoading={isFoodLoading}
                        onAddNew={() => navigate('/add', { state: { startMode: 'camera' } })}
                        onEdit={(id) => navigate(`/edit/${id}`)}
                        onDelete={deleteItem}
                        onViewDetails={(item) => navigate(`/item/${item.id}`)}
                        onAddToShoppingList={handleToggleShoppingList}
                        onToggleFamilyStatus={handleToggleFamilyStatus}
                        shoppingListFoodIds={shoppingListFoodIds}
                        isFiltering={isAnyFilterActive}
                        collapsedCategories={collapsedCategories}
                        onToggleCategory={(category) => setCollapsedCategories(prev => { const n = new Set(prev); n.has(category) ? n.delete(category) : n.add(category); return n; })}
                    />
                    
                    {/* Floating Action Button for Inventory */}
                    <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] right-6 z-30">
                        <button onClick={() => navigate('/add', { state: { startMode: 'camera' } })} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-4 rounded-full shadow-xl transition-transform transform hover:scale-105 active:scale-95">
                            <CameraIcon className="w-8 h-8" />
                        </button>
                    </div>
                </>
            } />

            {/* SHOPPING LIST */}
            <Route path="/shopping" element={
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
            } />

            {/* FINANCE */}
            <Route path="/finance" element={
                <FinanceDashboard 
                    monthlyData={getMonthlySpending()}
                    categoryData={getCategoryBreakdown()}
                    totalSpend={0} // calculated inside
                    isLoading={isReceiptsLoading}
                    onScan={() => setIsReceiptCameraOpen(true)}
                />
            } />

            {/* SUB-PAGES */}
            <Route path="/add" element={<ItemFormPage items={allItems} onSave={(data) => saveItem(data)} householdId={userProfile?.household_id || null} />} />
            <Route path="/edit/:id" element={<ItemFormPage items={allItems} onSave={(data) => saveItem(data, data.id)} householdId={userProfile?.household_id || null} />} />
            <Route path="/item/:id" element={<ItemDetailPage items={allItems} currentUser={user} onImageClick={setSelectedImage} />} />
            <Route path="/settings" element={
                <SettingsPage 
                    household={household} 
                    householdMembers={householdMembers} 
                    onHouseholdCreate={handleHouseholdCreateWrapper}
                    onHouseholdLeave={leaveHousehold}
                    onHouseholdDelete={deleteHousehold}
                    error={householdError}
                />
            } />
        </Route>
      </Routes>

      {/* GLOBAL MODALS (Transient State) */}
      {toastMessage && (
         <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 text-sm font-semibold py-2 px-4 rounded-full shadow-lg z-50">
            {toastMessage}
        </div>
      )}

      {isFilterPanelVisible && (
        <FilterPanel 
            onClose={() => setIsFilterPanelVisible(false)}
            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            typeFilter={typeFilter} setTypeFilter={setTypeFilter}
            ratingFilter={ratingFilter} setRatingFilter={setRatingFilter}
            ownerFilter={ownerFilter} setOwnerFilter={setOwnerFilter}
            sortBy={sortBy} setSortBy={setSortBy}
            onReset={clearAllFilters}
            onAiSearch={handleConversationalSearch}
            isAiSearchLoading={aiSearchResults.isLoading}
        />
      )}

      {/* Image Modal (Global for zoom) */}
      {selectedImage && <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />}

      {/* Receipt Modals (Context-specific but global Z-index) */}
      {isReceiptCameraOpen && (
          <CameraCapture onCapture={handleReceiptCapture} onClose={() => setIsReceiptCameraOpen(false)} mode="receipt" />
      )}
      {isProcessingReceipt && (
          <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 text-white">
              <SpinnerIcon className="w-12 h-12 text-white mb-4" />
              <p className="text-lg font-bold">Analyzing...</p>
          </div>
      )}
      {scannedReceiptData && (
          <ReceiptReviewModal receiptData={scannedReceiptData} onSave={handleSaveReceipt} onClose={() => setScannedReceiptData(null)} />
      )}
      {confirmedReceiptForImport && (
          <ReceiptToInventoryModal receipt={confirmedReceiptForImport.receipt} items={confirmedReceiptForImport.items} onConfirm={handleImportReceiptItems} onClose={() => setConfirmedReceiptForImport(null)} />
      )}
    </>
  );
};
