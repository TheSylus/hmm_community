import { useState, useEffect, useCallback, useRef } from 'react';
import { ShoppingList, ShoppingListItem, Household } from '../types';
import { supabase } from '../services/supabaseClient';
import { User, RealtimeChannel } from '@supabase/supabase-js';
import { useTranslation } from '../i18n/index';

export const useShoppingList = (user: User | null, household: Household | null) => {
  const { t } = useTranslation();
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [activeShoppingListId, setActiveShoppingListId] = useState<string | null>(null);
  const [shoppingListItems, setShoppingListItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

  // Fetch Lists when household changes
  useEffect(() => {
    if (!household) {
      setShoppingLists([]);
      setShoppingListItems([]);
      setActiveShoppingListId(null);
      return;
    }

    const fetchLists = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('shopping_lists')
          .select('*')
          .eq('household_id', household.id);
        
        if (error) throw error;

        if (data && data.length === 0) {
          // Auto-create default list if none exists
          const { data: newList, error: createError } = await supabase
             .from('shopping_lists')
             .insert({ household_id: household.id, name: t('shoppingList.defaultListName') })
             .select()
             .single();
          
          if (createError) throw createError;
          if (newList) {
              setShoppingLists([newList]);
              setActiveShoppingListId(newList.id);
          }
        } else {
            setShoppingLists(data || []);
            // Restore active list from local storage or default to first
            const savedId = localStorage.getItem(`activeShoppingListId_${household.id}`);
            const exists = data?.some(l => l.id === savedId);
            setActiveShoppingListId(exists ? savedId : data?.[0]?.id || null);
        }
      } catch (err: any) {
        console.error("Error fetching lists:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLists();
  }, [household, t]);

  // Fetch Items and Subscribe to Realtime when active list changes
  useEffect(() => {
    if (!activeShoppingListId || !user || activeShoppingListId.startsWith('temp_')) {
      setShoppingListItems([]);
      return;
    }
    
    if (household) {
        localStorage.setItem(`activeShoppingListId_${household.id}`, activeShoppingListId);
    }

    const fetchItems = async () => {
      try {
        const { data, error } = await supabase
          .from('shopping_list_items')
          .select('*')
          .eq('list_id', activeShoppingListId);
        
        if (error) throw error;
        setShoppingListItems(data || []);
      } catch (err: any) {
        console.error("Error fetching list items:", err);
        setError(err.message);
      }
    };

    fetchItems();

    // Realtime Subscription
    if (realtimeChannelRef.current) realtimeChannelRef.current.unsubscribe();

    const channel = supabase.channel(`shopping_list:${activeShoppingListId}`);
    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shopping_list_items', filter: `list_id=eq.${activeShoppingListId}` }, (payload) => {
          setShoppingListItems(prev => [...prev, payload.new as ShoppingListItem]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'shopping_list_items', filter: `list_id=eq.${activeShoppingListId}` }, (payload) => {
          setShoppingListItems(prev => prev.map(item => item.id === payload.new.id ? payload.new as ShoppingListItem : item));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'shopping_list_items', filter: `list_id=eq.${activeShoppingListId}` }, (payload) => {
          setShoppingListItems(prev => prev.filter(item => item.id !== (payload.old as any).id));
      })
      .subscribe();
    
    realtimeChannelRef.current = channel;

    return () => {
      if (realtimeChannelRef.current) realtimeChannelRef.current.unsubscribe();
    };

  }, [activeShoppingListId, user, household]);


  // --- Actions ---

  const createList = useCallback(async (name: string) => {
    if (!household) return;
    setError(null);
    // Optimistic
    const tempList: ShoppingList = {
        id: `temp_${Date.now()}`, name: name, household_id: household.id, created_at: new Date().toISOString()
    };
    setShoppingLists(prev => [...prev, tempList]);
    setActiveShoppingListId(tempList.id);

    try {
        const { data, error } = await supabase
            .from('shopping_lists')
            .insert({ name: name, household_id: household.id })
            .select()
            .single();
        
        if (error) throw error;
        
        // Replace temp with real
        setShoppingLists(prev => prev.map(l => l.id === tempList.id ? data : l));
        setActiveShoppingListId(data.id);
    } catch (err: any) {
        setError(err.message);
        // Revert
        setShoppingLists(prev => prev.filter(l => l.id !== tempList.id));
    }
  }, [household]);

  const deleteList = useCallback(async (listId: string) => {
      setError(null);
      const previousLists = [...shoppingLists];
      
      // Optimistic update
      const newLists = shoppingLists.filter(l => l.id !== listId);
      setShoppingLists(newLists);
      if (activeShoppingListId === listId) {
          setActiveShoppingListId(newLists[0]?.id || null);
      }

      try {
          const { error } = await supabase.from('shopping_lists').delete().eq('id', listId);
          if (error) throw error;
      } catch (err: any) {
          setError(err.message);
          setShoppingLists(previousLists); // Revert
      }
  }, [shoppingLists, activeShoppingListId]);

  const addItemToList = useCallback(async (foodItemId: string, quantity: number = 1) => {
      if (!user || !activeShoppingListId) return;
      setError(null);

      const existingItem = shoppingListItems.find(sli => sli.food_item_id === foodItemId && sli.list_id === activeShoppingListId);
      
      // Optimistic update handled below separately for create vs update
      if (existingItem) {
          await updateQuantity(existingItem.id, existingItem.quantity + quantity);
      } else {
          const tempId = `temp_${Date.now()}`;
          const newItem: ShoppingListItem = {
              id: tempId, list_id: activeShoppingListId, food_item_id: foodItemId, added_by_user_id: user.id,
              checked: false, created_at: new Date().toISOString(), checked_by_user_id: null, quantity
          };
          setShoppingListItems(prev => [...prev, newItem]);

          try {
              const { data, error } = await supabase
                  .from('shopping_list_items')
                  .insert({ food_item_id: foodItemId, list_id: activeShoppingListId, added_by_user_id: user.id, quantity })
                  .select()
                  .single();
              if (error) throw error;
              // Realtime will handle the update usually, but we can replace temp
              setShoppingListItems(prev => prev.map(i => i.id === tempId ? data : i));
          } catch (err: any) {
              setError(err.message);
              setShoppingListItems(prev => prev.filter(i => i.id !== tempId));
          }
      }
  }, [user, activeShoppingListId, shoppingListItems]); // Note: updateQuantity is defined below, used here via closure/hoisting logic but cleaner to define before or use ref if strict. 
  // To avoid dependency cycle in `addItemToList` needing `updateQuantity`, we define generic DB helpers or just standard logic.

  const updateQuantity = useCallback(async (itemId: string, newQuantity: number) => {
      if (newQuantity <= 0) {
          await removeItem(itemId);
          return;
      }
      
      const previousItems = [...shoppingListItems];
      setShoppingListItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i));
      
      try {
          const { error } = await supabase
              .from('shopping_list_items')
              .update({ quantity: newQuantity })
              .eq('id', itemId);
          if (error) throw error;
      } catch (err: any) {
          setError(err.message);
          setShoppingListItems(previousItems);
      }
  }, [shoppingListItems]); // removeItem defined below

  const removeItem = useCallback(async (itemId: string) => {
      const previousItems = [...shoppingListItems];
      setShoppingListItems(prev => prev.filter(i => i.id !== itemId));
      
      try {
          const { error } = await supabase.from('shopping_list_items').delete().eq('id', itemId);
          if (error) throw error;
      } catch (err: any) {
          setError(err.message);
          setShoppingListItems(previousItems);
      }
  }, [shoppingListItems]);

  const toggleChecked = useCallback(async (itemId: string, isChecked: boolean) => {
      if (!user) return;
      const previousItems = [...shoppingListItems];
      setShoppingListItems(prev => prev.map(i => i.id === itemId ? { ...i, checked: isChecked, checked_by_user_id: isChecked ? user.id : null } : i));

      try {
           const { error } = await supabase
              .from('shopping_list_items')
              .update({ checked: isChecked, checked_by_user_id: isChecked ? user.id : null })
              .eq('id', itemId);
           if (error) throw error;
      } catch (err: any) {
          setError(err.message);
          setShoppingListItems(previousItems);
      }
  }, [shoppingListItems, user]);

  const clearCompleted = useCallback(async () => {
      if (!activeShoppingListId) return;
      const completedIds = shoppingListItems.filter(i => i.checked).map(i => i.id);
      if (completedIds.length === 0) return;

      const previousItems = [...shoppingListItems];
      setShoppingListItems(prev => prev.filter(i => !i.checked));

      try {
          const { error } = await supabase.from('shopping_list_items').delete().in('id', completedIds);
          if (error) throw error;
      } catch (err: any) {
          setError(err.message);
          setShoppingListItems(previousItems);
      }
  }, [shoppingListItems, activeShoppingListId]);

  return {
    shoppingLists,
    activeShoppingListId,
    shoppingListItems,
    loading,
    error,
    setActiveShoppingListId,
    createList,
    deleteList,
    addItemToList,
    updateQuantity,
    removeItem,
    toggleChecked,
    clearCompleted
  };
};
