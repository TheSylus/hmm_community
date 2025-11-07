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
import * as geminiService from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { useTranslation } from './i18n/index';
import { PlusCircleIcon, SettingsIcon, ShoppingBagIcon, FunnelIcon, XMarkIcon, BuildingStorefrontIcon, MagnifyingGlassIcon, SpinnerIcon, UserCircleIcon, GlobeAltIcon } from './components/Icons';
import { RealtimeChannel } from '@supabase/supabase-js';

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

// Helper function to convert a base64 string to a Blob for uploading
const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) { byteNumbers[i] = slice.charCodeAt(i); }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: mimeType });
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
};


const ActiveFilterPill: React.FC<{onDismiss: () => void, children: React.ReactNode}> = ({onDismiss, children}) => (
  <div className="flex items-center gap-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-600/50 dark:text-indigo-200 text-xs font-semibold px-2 py-1 rounded-full">
      <span>{children}</span>
      <button onClick={onDismiss} className="p-0.5 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-500/50">
          <XMarkIcon className="w-3 h-3"/>
      </button>
  </div>
);

// --- Data Mapping Layer ---
// Converts DB snake_case to frontend camelCase
const mapDbToFoodItem = (dbItem: any): FoodItem => {
  const {
    image_url,
    item_type,
    is_family_favorite,
    is_lactose_free,
    is_vegan,
    is_gluten_free,
    ...rest
  } = dbItem;

  return {
    ...rest,
    itemType: item_type,
    image: image_url || undefined,
    isFamilyFavorite: is_family_favorite,
    isLactoseFree: is_lactose_free,
    isVegan: is_vegan,
    isGlutenFree: is_gluten_free,
  } as FoodItem;
};

// Converts frontend camelCase to DB snake_case for saving
const mapFoodItemToDbPayload = (itemData: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) => {
    const {
        image, // Handled separately as it involves upload
        itemType,
        isFamilyFavorite,
        isLactoseFree,
        isVegan,
        isGlutenFree,
        ...restOfItemData
    } = itemData;

    return {
        ...restOfItemData,
        item_type: itemType,
        is_family_favorite: isFamilyFavorite || false,
        is_lactose_free: isLactoseFree || false,
        is_vegan: isVegan || false,
        is_gluten_free: isGlutenFree || false,
    };
};
// --- End Data Mapping Layer ---


const App: React.FC = () => {
  const { t } = useTranslation();
  const { session, user } = useAuth();
  const realtimeChannelRef = React.useRef<RealtimeChannel | null>(null);

  // Main Data State
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [familyFoodItems, setFamilyFoodItems] = useState<FoodItem[]>([]);
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [activeShoppingListId, setActiveShoppingListId] = useState<string | null>(null);
  const [shoppingListItems, setShoppingListItems] = useState<ShoppingListItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [householdMembers, setHouseholdMembers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFamilyItemsLoading, setIsFamilyItemsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

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
  
  const fetchPersonalData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setDbError(null);
    try {
        const { data: foodItemsData, error: foodItemsError } = await supabase
            .from('food_items').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (foodItemsError) throw foodItemsError;
        if (foodItemsData) {
            setFoodItems(foodItemsData.map(mapDbToFoodItem));
        }
    } catch (error: any) {
        if (isOnline) setDbError(`Error loading personal data: ${error.message}.`);
        console.error("Personal data fetch error:", error);
    } finally {
        setIsLoading(false);
    }
  }, [user, isOnline]);

  const fetchHouseholdData = useCallback(async (householdId: string) => {
    if (!user || !householdId) {
        setHousehold(null);
        setHouseholdMembers([]);
        setFamilyFoodItems([]);
        setShoppingLists([]);
        setActiveShoppingListId(null);
        return;
    }
    setIsFamilyItemsLoading(true);
    try {
        // Fetch household details
        const { data: householdData, error: householdError } = await supabase.from('households').select('*').eq('id', householdId).single();
        if (householdError) throw householdError;
        setHousehold(householdData);

        // Fetch household members
        const { data: membersData, error: membersError } = await supabase.from('profiles').select('*').eq('household_id', householdId);
        if (membersError) throw membersError;
        setHouseholdMembers(membersData || []);

        // Fetch family favorite items
        const { data: familyItemsData, error: familyItemsError } = await supabase.from('food_items').select('*').eq('is_family_favorite', true);

        if (familyItemsError) throw familyItemsError;
        setFamilyFoodItems(familyItemsData?.map(mapDbToFoodItem) || []);


        // Fetch shopping lists for the household
        const { data: listsData, error: listsError } = await supabase.from('shopping_lists').select('*').eq('household_id', householdId);
        if (listsError) throw listsError;
        
        if (listsData && listsData.length === 0) {
            const { data: newList, error: newListError } = await supabase
                .from('shopping_lists')
                .insert({ household_id: householdId, name: t('shoppingList.defaultListName') })
                .select().single();
            if (newListError) throw newListError;
            if (newList) {
                setShoppingLists([newList]);
                setActiveShoppingListId(newList.id);
            }
        } else if (listsData) {
            setShoppingLists(listsData);
            const lastUsedListId = localStorage.getItem(`activeShoppingListId_${householdId}`);
            const listExists = listsData.some(l => l.id === lastUsedListId);
            setActiveShoppingListId(listExists ? lastUsedListId : listsData[0]?.id || null);
        }
    } catch (error: any) {
        if (isOnline) setDbError(`Error loading household data: ${error.message}.`);
        console.error("Household data fetch error:", error);
    } finally {
      setIsFamilyItemsLoading(false);
    }
  }, [user, isOnline, t]);


  useEffect(() => {
    if (user) {
        const fetchProfile = async () => {
            setIsLoading(true);
            const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (error) console.error("Error fetching profile:", error);
            setUserProfile(data);
            fetchPersonalData();
            if (data?.household_id) {
                fetchHouseholdData(data.household_id);
            } else {
                fetchHouseholdData(''); // Clear household data
                setIsFamilyItemsLoading(false);
            }
        };
        fetchProfile();
    } else {
        // Clear all data on logout
        setFoodItems([]);
        setFamilyFoodItems([]);
        setShoppingLists([]);
        setShoppingListItems([]);
        setActiveShoppingListId(null);
        setUserProfile(null);
        setHousehold(null);
        setHouseholdMembers([]);
        setIsLoading(false);
        setIsFamilyItemsLoading(false);
    }
  }, [user, fetchPersonalData, fetchHouseholdData]);

  const handleJoinHousehold = useCallback(async (householdId: string) => {
    if (!user || !userProfile) return;
    try {
        // Update profile
        const { data, error } = await supabase.from('profiles').update({ household_id: householdId }).eq('id', user.id).select().single();
        if (error) throw error;
        
        setUserProfile(data); // Refresh profile state
        fetchHouseholdData(householdId); // Fetch new household data

        setToastMessage(t('shoppingList.joinSuccess', { householdName: data?.name || '' }));
    } catch (error: any) {
        console.error("Error joining household:", error);
        setDbError(`Error joining household: ${error.message}`);
    }
  }, [user, userProfile, fetchHouseholdData, t]);


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const householdInvite = params.get('join_household');
    if (householdInvite && userProfile) { // Check for profile to avoid race condition on startup
        handleJoinHousehold(householdInvite);
        window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [userProfile, handleJoinHousehold]);


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

  // Listen for messages from the service worker (e.g., after a sync)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'SYNC_COMPLETE') {
            console.log('Sync complete! Re-fetching data.');
            setToastMessage(t('offline.syncComplete'));
            if(user) {
              fetchPersonalData();
              if(userProfile?.household_id) fetchHouseholdData(userProfile.household_id);
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
  }, [fetchPersonalData, fetchHouseholdData, user, userProfile, t]);


  // Fetch shopping list items when active list changes
  useEffect(() => {
    if (!activeShoppingListId || !user || activeShoppingListId.startsWith('temp_') || !household) {
      setShoppingListItems([]);
      return;
    }
    localStorage.setItem(`activeShoppingListId_${household.id}`, activeShoppingListId);

    const fetchListItems = async () => {
      try {
        const { data, error } = await supabase.from('shopping_list_items').select('*').eq('list_id', activeShoppingListId);
        if (error) throw error;
        setShoppingListItems(data || []);
      } catch(error: any) {
          if(isOnline) setDbError(`Error loading list data: ${error.message}.`);
          console.error("List fetch error:", error);
      }
    };
    fetchListItems();

    if (realtimeChannelRef.current) realtimeChannelRef.current.unsubscribe();
    
    const channel = supabase.channel(`shopping_list:${activeShoppingListId}`);
    channel
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shopping_list_items', filter: `list_id=eq.${activeShoppingListId}` }, (payload) => setShoppingListItems(prev => [...prev, payload.new as ShoppingListItem]))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'shopping_list_items', filter: `list_id=eq.${activeShoppingListId}` }, (payload) => setShoppingListItems(prev => prev.map(item => item.id === payload.new.id ? payload.new as ShoppingListItem : item)))
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'shopping_list_items', filter: `list_id=eq.${activeShoppingListId}` }, (payload) => setShoppingListItems(prev => prev.filter(item => item.id !== (payload.old as any).id)))
        .subscribe();

    realtimeChannelRef.current = channel;
    
    return () => {
        if (realtimeChannelRef.current) realtimeChannelRef.current.unsubscribe();
    };
  }, [activeShoppingListId, user, isOnline, household]);


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
                restaurantName: minified.rn, cuisineType: minified.ct, price: minified.p,
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

  // Handlers
  const handleSaveItem = useCallback(async (itemData: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>): Promise<void> => {
    if (!user) {
        setDbError("You must be logged in to save items.");
        return;
    }
    
    setDbError(null);
    let imageUrl = itemData.image;
    const originalItems = [...foodItems];

    const tempId = `temp_${Date.now()}`;
    const optimisticItem: FoodItem = {
        ...itemData, id: editingItem ? editingItem.id : tempId, user_id: user.id, created_at: new Date().toISOString(), image: imageUrl || undefined, tags: itemData.tags || [],
    };
    if (editingItem) {
        setFoodItems(prev => prev.map(item => item.id === editingItem.id ? optimisticItem : item));
    } else {
        setFoodItems(prev => [optimisticItem, ...prev]);
    }
    handleCancelForm();
    
    if (imageUrl && imageUrl.startsWith('data:image')) {
        if (!isOnline) {
            setToastMessage("Offline: Image will be uploaded later. Saving text data now.");
            imageUrl = undefined;
        } else {
            const mimeType = imageUrl.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/jpeg';
            const blob = base64ToBlob(imageUrl, mimeType);
            const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
            const { error: uploadError } = await supabase.storage.from('food-images').upload(fileName, blob, { contentType: mimeType });
            if (uploadError) {
                setDbError(`Failed to upload image: ${uploadError.message}`);
                setFoodItems(originalItems);
                return;
            }
            const { data: urlData } = supabase.storage.from('food-images').getPublicUrl(fileName);
            imageUrl = urlData.publicUrl;
        }
    }

    const dbPayload = {
        ...mapFoodItemToDbPayload(itemData),
        image_url: imageUrl || null,
        user_id: user.id,
    };
    
    if (editingItem) {
        const { data, error } = await supabase.from('food_items').update(dbPayload).eq('id', editingItem.id).select().single();
        if (error && isOnline) {
            setDbError(`Failed to update item: ${error.message}`);
            setFoodItems(originalItems);
        } else if(data) {
            const finalItem = mapDbToFoodItem(data);
            setFoodItems(prev => prev.map(item => item.id === finalItem.id ? finalItem : item));
        }
    } else {
        const duplicates = foodItems.filter(item => item.name.trim().toLowerCase() === itemData.name.trim().toLowerCase() && item.id !== tempId);
        if (duplicates.length > 0 && !editingItem) {
            setPotentialDuplicates(duplicates);
            setItemToAdd(itemData);
            setFoodItems(prev => prev.filter(item => item.id !== tempId));
            return;
        }
        const { data, error } = await supabase.from('food_items').insert(dbPayload).select().single();
        if (error && isOnline) {
            setDbError(`Failed to save item: ${error.message}`);
            setFoodItems(originalItems);
        } else if(data) {
            const finalItem = mapDbToFoodItem(data);
            setFoodItems(prev => prev.map(item => item.id === tempId ? finalItem : item));
        }
    }
    if (itemData.isFamilyFavorite && userProfile?.household_id) fetchHouseholdData(userProfile.household_id);
  }, [editingItem, foodItems, handleCancelForm, user, isOnline, userProfile, fetchHouseholdData, setToastMessage]);

  const handleConfirmDuplicateAdd = useCallback(async () => {
    if (itemToAdd) {
        await handleSaveItem(itemToAdd);
    }
    setItemToAdd(null);
    setPotentialDuplicates([]);
  }, [itemToAdd, handleSaveItem]);

  const handleDeleteItem = useCallback(async (id: string) => {
    setDbError(null);
    const originalItems = foodItems;
    setFoodItems(prevItems => prevItems.filter(item => item.id !== id));
    
    const { error } = await supabase.from('food_items').delete().eq('id', id);

    if (error && isOnline) {
        setDbError(`Failed to delete item: ${error.message}`);
        setFoodItems(originalItems);
    }
  }, [foodItems, isOnline]);
  
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
  
  const handleAddToShoppingList = useCallback(async (item: FoodItem) => {
      if (!user || !activeShoppingListId) return;
      if (shoppingListItems.some(sli => sli.food_item_id === item.id && sli.list_id === activeShoppingListId)) return;
      
      const originalItems = shoppingListItems;
      const tempItem: ShoppingListItem = {
        id: `temp_${Date.now()}`, list_id: activeShoppingListId, food_item_id: item.id, added_by_user_id: user.id,
        checked: false, created_at: new Date().toISOString(), checked_by_user_id: null
      };
      setShoppingListItems(prev => [...prev, tempItem]);
      setToastMessage(t('shoppingList.addedToast', { name: item.name }));

      const { error } = await supabase
          .from('shopping_list_items')
          .insert({ food_item_id: item.id, list_id: activeShoppingListId, added_by_user_id: user.id });
      
      if (error && isOnline) {
          setDbError(`Error adding to shopping list: ${error.message}`);
          setShoppingListItems(originalItems);
      }
  }, [user, shoppingListItems, activeShoppingListId, t, isOnline]);

  const handleRemoveFromShoppingList = useCallback(async (shoppingListItemId: string) => {
      const originalItems = shoppingListItems;
      setShoppingListItems(prev => prev.filter(i => i.id !== shoppingListItemId));
      
      const { error } = await supabase.from('shopping_list_items').delete().eq('id', shoppingListItemId);
      if (error && isOnline) {
          setDbError(`Error removing item: ${error.message}`);
          setShoppingListItems(originalItems);
      }
  }, [shoppingListItems, isOnline]);
  
  const handleToggleCheckedItem = useCallback(async (shoppingListItemId: string, isChecked: boolean) => {
    if (!user) return;
    const originalItems = shoppingListItems;
    setShoppingListItems(prev => prev.map(i => i.id === shoppingListItemId ? {...i, checked: isChecked, checked_by_user_id: isChecked ? user.id : null} : i));

    const { error } = await supabase
        .from('shopping_list_items')
        .update({ checked: isChecked, checked_by_user_id: isChecked ? user.id : null })
        .eq('id', shoppingListItemId);
    
    if (error && isOnline) {
        setDbError(`Error updating item: ${error.message}`);
        setShoppingListItems(originalItems);
    }
  }, [user, shoppingListItems, isOnline]);

  const handleClearCompletedShoppingList = useCallback(async () => {
    if (!activeShoppingListId) return;
    const checkedIds = shoppingListItems.filter(item => item.checked).map(item => item.id);
    if (checkedIds.length === 0) return;
    
    const originalItems = shoppingListItems;
    setShoppingListItems(prev => prev.filter(i => !i.checked));

    const { error } = await supabase.from('shopping_list_items').delete().in('id', checkedIds);
    if (error && isOnline) {
        setDbError(`Error clearing completed items: ${error.message}`);
        setShoppingListItems(originalItems);
    }
  }, [shoppingListItems, activeShoppingListId, isOnline]);

  const handleCreateNewList = useCallback(async (name: string) => {
    if (!user || !household || !name.trim()) return;
    const originalLists = shoppingLists;
    const tempList: ShoppingList = {
        id: `temp_${Date.now()}`, name: name.trim(), household_id: household.id, created_at: new Date().toISOString()
    };
    setShoppingLists(prev => [...prev, tempList]);
    setActiveShoppingListId(tempList.id);

    const { error } = await supabase.from('shopping_lists').insert({ name: name.trim(), household_id: household.id }).select().single();
    if (error && isOnline) {
        setDbError("Error creating new list:" + error.message);
        setShoppingLists(originalLists);
    } else {
        fetchHouseholdData(household.id);
    }
  }, [user, isOnline, shoppingLists, household, fetchHouseholdData]);

  const handleDeleteList = useCallback(async (listId: string) => {
      const originalLists = [...shoppingLists];
      const newLists = shoppingLists.filter(l => l.id !== listId);
      setShoppingLists(newLists);
      if (activeShoppingListId === listId) {
        const newActiveId = newLists[0]?.id || null;
        setActiveShoppingListId(newActiveId);
        if (newActiveId && household) localStorage.setItem(`activeShoppingListId_${household.id}`, newActiveId);
        else if(household) localStorage.removeItem(`activeShoppingListId_${household.id}`);
      }

      const { error } = await supabase.from('shopping_lists').delete().eq('id', listId);
      if (error && isOnline) {
          setDbError(`Error deleting list: ${error.message}`);
          setShoppingLists(originalLists);
      }
  }, [shoppingLists, activeShoppingListId, isOnline, household]);

  const handleHouseholdCreate = useCallback(async (name: string) => {
    if (!user) return;
    setDbError(null);
    try {
      // Call the database function to handle household creation and owner linking atomically.
      const { data: newHouseholdId, error } = await supabase.rpc('create_household_and_link_owner', {
        household_name: name
      });

      if (error) throw error;

      // The RPC returns the new household ID. We can now refetch all profile and household data
      // to ensure the client state is perfectly in sync with the database.
      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;
        
      setUserProfile(updatedProfile);
      await fetchHouseholdData(newHouseholdId);
      
      setToastMessage(t('shoppingList.joinSuccess', { householdName: name }));

    } catch (error: any) {
        const errorMessage = t('household.error.create', { message: error.message });
        setDbError(errorMessage);
        console.error("Error in household creation RPC:", error);
    }
  }, [user, t, fetchHouseholdData]);


  const handleHouseholdLeave = useCallback(async () => {
    if (!user || !userProfile || !window.confirm(t('settings.household.manage.leaveConfirm'))) return;
    try {
        const { data, error } = await supabase.from('profiles').update({ household_id: null }).eq('id', user.id).select().single();
        if (error) throw error;
        setUserProfile(data);
        fetchHouseholdData(''); // Clear household data
    } catch (error: any) {
        setDbError("Error leaving household: " + error.message);
    }
  }, [user, userProfile, fetchHouseholdData, t]);

  const handleHouseholdDelete = useCallback(async () => {
    if (!user || !household || household.owner_id !== user.id || !window.confirm(t('settings.household.manage.deleteConfirm'))) return;
    try {
        // This should be a cascading delete in the DB or handled via an RPC function for security.
        // For simplicity here, we'll just delete the household record.
        const { error } = await supabase.from('households').delete().eq('id', household.id);
        if (error) throw error;
        // The profiles would need to be updated, ideally via a DB trigger. We'll refetch to clear state.
        const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if(profileError) throw profileError;
        setUserProfile(profileData);
        fetchHouseholdData('');
    } catch (error: any) {
        setDbError("Error deleting household: " + error.message);
    }
  }, [user, household, fetchHouseholdData, t]);


  const handleAddSharedItem = useCallback(() => {
    if (sharedItemToShow) {
      handleSaveItem(sharedItemToShow);
      setSharedItemToShow(null);
    }
  }, [sharedItemToShow, handleSaveItem]);

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
// FIX: Corrected a truncated line of code that was causing a TypeScript error.
        case 'date_asc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'date_desc': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'rating_asc': return a.rating - b.rating;
        case 'rating_desc': return b.rating - a.rating;
        case 'name_asc': return a.name.localeCompare(b.name);
        case 'name_desc': return b.name.localeCompare(a.name);
        default: return 0;
      }
    });
  }, [foodItems, familyFoodItems, activeView, searchTerm, ratingFilter, typeFilter, sortBy, aiSearchResults.ids]);
  
  if (!session) {
    return <Auth />;
  }
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
      <OfflineIndicator isOnline={isOnline} />
      {/* Main Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('header.title')}</h1>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <nav className="p-1 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center gap-1">
                <button onClick={() => setActiveView('dashboard')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${activeView === 'dashboard' ? 'bg-white dark:bg-gray-900/50 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-900/30'}`}>{t('nav.myItems')}</button>
                <button onClick={() => setActiveView('family')} disabled={!household} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${activeView === 'family' ? 'bg-white dark:bg-gray-900/50 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-900/30'} disabled:opacity-50 disabled:cursor-not-allowed`}>{t('nav.family')}</button>
              </nav>
              <button onClick={() => setIsShoppingListOpen(true)} disabled={!household} className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50" aria-label={t('header.shoppingListAria')}>
                <ShoppingBagIcon className="w-6 h-6"/>
              </button>
               <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" aria-label={t('settings.title')}>
                  <SettingsIcon className="w-6 h-6"/>
              </button>
            </div>
          </div>
           {activeView !== 'dashboard' && (
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="search"
                    placeholder={t('header.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-200 dark:bg-gray-700 border-transparent focus:border-indigo-500 focus:ring-indigo-500 rounded-lg pl-10 pr-4 py-2 text-sm"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <MagnifyingGlassIcon className="w-5 h-5 text-gray-400"/>
                  </div>
                </div>
                <button onClick={() => setIsFilterPanelVisible(true)} className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                    <FunnelIcon className="w-6 h-6"/>
                </button>
              </div>
              {isAnyFilterActive && (
                  <div className="mt-2 flex flex-wrap gap-2 items-center">
                      {aiSearchQuery && <ActiveFilterPill onDismiss={clearAiSearch}>{t('header.filter.active.aiSearch', { term: aiSearchQuery })}</ActiveFilterPill>}
                      {searchTerm.trim() && <ActiveFilterPill onDismiss={() => setSearchTerm('')}>{t('header.filter.active.search', { term: searchTerm })}</ActiveFilterPill>}
                      {typeFilter === 'product' && <ActiveFilterPill onDismiss={() => setTypeFilter('all')}>{t('header.filter.active.type.product')}</ActiveFilterPill>}
                      {typeFilter === 'dish' && <ActiveFilterPill onDismiss={() => setTypeFilter('all')}>{t('header.filter.active.type.dish')}</ActiveFilterPill>}
                      {ratingFilter === 'liked' && <ActiveFilterPill onDismiss={() => setRatingFilter('all')}>{t('header.filter.active.rating.liked')}</ActiveFilterPill>}
                      {ratingFilter === 'disliked' && <ActiveFilterPill onDismiss={() => setRatingFilter('all')}>{t('header.filter.active.rating.disliked')}</ActiveFilterPill>}
                      <button onClick={clearAllFilters} className="text-xs text-gray-500 dark:text-gray-400 hover:underline">{t('header.filter.clearAll')}</button>
                  </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {dbError && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{dbError}</p>}
        {isFormVisible && (
            <FoodItemForm
                onSaveItem={handleSaveItem}
                onCancel={handleCancelForm}
                initialData={editingItem}
                itemType={editingItem?.itemType || newItemType}
                householdId={userProfile?.household_id || null}
            />
        )}
        
        {activeView === 'dashboard' && (
          <Dashboard 
            items={foodItems}
            onViewAll={() => setActiveView('list')}
            onAddNew={handleAddNewClick}
            onDelete={handleDeleteItem}
            onEdit={handleStartEdit}
            onViewDetails={handleViewDetails}
            onAddToShoppingList={handleAddToShoppingList}
          />
        )}

        {activeView === 'list' && (
          isLoading ? <div className="text-center"><SpinnerIcon className="w-8 h-8 text-indigo-500 mx-auto" /></div> : 
          <FoodItemList 
            items={filteredAndSortedItems}
            onDelete={handleDeleteItem}
            onEdit={handleStartEdit}
            onViewDetails={handleViewDetails}
            onAddToShoppingList={handleAddToShoppingList}
          />
        )}

        {activeView === 'family' && (
          isFamilyItemsLoading ? <div className="text-center"><SpinnerIcon className="w-8 h-8 text-indigo-500 mx-auto" /></div> :
          !household ? (
            <div className="text-center py-10 px-4">
              <UserCircleIcon className="w-16 h-16 mx-auto text-indigo-400" />
              <h2 className="mt-4 text-2xl font-semibold text-gray-600 dark:text-gray-400">{t('family.noHousehold.title')}</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">{t('family.noHousehold.description')}</p>
          </div>
          ) :
          familyFoodItems.length === 0 ? (
            <div className="text-center py-10 px-4">
              <GlobeAltIcon className="w-16 h-16 mx-auto text-indigo-400" />
              <h2 className="mt-4 text-2xl font-semibold text-gray-600 dark:text-gray-400">{t('family.empty.title')}</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">{t('family.empty.description')}</p>
          </div>
          ) :
          <FoodItemList 
            items={filteredAndSortedItems}
            onDelete={handleDeleteItem}
            onEdit={handleStartEdit}
            onViewDetails={handleViewDetails}
            onAddToShoppingList={handleAddToShoppingList}
          />
        )}
      </main>

      <footer className="bg-gray-200 dark:bg-gray-800 text-center p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('footer.text')}</p>
      </footer>

      {/* Modals and Floating Components */}
      {!isFormVisible && activeView !== 'dashboard' && (
        <button
            onClick={handleAddNewClick}
            className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-4 rounded-full shadow-lg transition-transform transform hover:scale-110 z-10"
            aria-label={t('form.addNewButton')}
        >
            <PlusCircleIcon className="w-8 h-8"/>
        </button>
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
      {selectedImage && <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />}
      {detailItem && <FoodItemDetailModal item={detailItem} currentUser={user} onClose={() => setDetailItem(null)} onEdit={handleStartEdit} onImageClick={setSelectedImage} />}
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} household={household} onHouseholdCreate={handleHouseholdCreate} onHouseholdLeave={handleHouseholdLeave} onHouseholdDelete={handleHouseholdDelete} />}
      {isShoppingListOpen && household && user && (
          <ShoppingListModal 
              allLists={shoppingLists}
              activeListId={activeShoppingListId}
              listData={
                  shoppingListItems
                      .map(sli => ({
                          ...[...foodItems, ...familyFoodItems].find(fi => fi.id === sli.food_item_id),
                          shoppingListItemId: sli.id,
                          checked: sli.checked,
                          added_by_user_id: sli.added_by_user_id,
                          checked_by_user_id: sli.checked_by_user_id,
                      }))
                      .filter(item => item.id) as HydratedShoppingListItem[]
              }
              household={household}
              householdMembers={householdMembers}
              currentUser={user}
              onClose={() => setIsShoppingListOpen(false)}
              onRemove={handleRemoveFromShoppingList}
              onClear={handleClearCompletedShoppingList}
              onToggleChecked={handleToggleCheckedItem}
              onSelectList={setActiveShoppingListId}
              onCreateList={handleCreateNewList}
              onDeleteList={handleDeleteList}
          />
      )}
      {sharedItemToShow && (
          <FoodItemDetailModal 
              item={{...sharedItemToShow, id: 'shared', user_id: 'shared', created_at: new Date().toISOString()}}
              currentUser={user}
              onClose={() => setSharedItemToShow(null)}
              onEdit={() => {}} 
              onImageClick={setSelectedImage} 
          />
      )}
      {isItemTypeModalVisible && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={() => setIsItemTypeModalVisible(false)}>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">{t('modal.itemType.title')}</h2>
                  <div className="space-y-3">
                      <button onClick={() => handleSelectType('product')} className="w-full flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors text-left">
                          <ShoppingBagIcon className="w-8 h-8 text-indigo-500"/>
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{t('modal.itemType.product')}</p>
                          </div>
                      </button>
                       <button onClick={() => handleSelectType('dish')} className="w-full flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors text-left">
                          <BuildingStorefrontIcon className="w-8 h-8 text-indigo-500"/>
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{t('modal.itemType.dish')}</p>
                          </div>
                      </button>
                  </div>
              </div>
          </div>
      )}
      {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-md shadow-lg z-50 animate-fade-in">
              {toastMessage}
          </div>
      )}

    </div>
  );
};

// FIX: Added the missing default export for the App component.
export default App;
