
import { useState, useEffect, useCallback, useRef } from 'react';
import { ShoppingList, ShoppingListItem, Household } from '../types';
import { supabase } from '../services/supabaseClient';
import { User } from '@supabase/supabase-js';
import { useTranslation } from '../i18n/index';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const KEYS = {
    lists: (householdId: string) => ['shoppingLists', householdId],
    items: (listId: string) => ['shoppingListItems', listId],
};

export const useShoppingList = (user: User | null, household: Household | null) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeShoppingListId, setActiveShoppingListId] = useState<string | null>(null);

  // 1. Fetch Lists
  const { data: shoppingLists = [], isLoading: isLoadingLists } = useQuery({
      queryKey: KEYS.lists(household?.id || ''),
      queryFn: async () => {
          if (!household) return [];
          const { data, error } = await supabase.from('shopping_lists').select('*').eq('household_id', household.id);
          if (error) throw error;
          
          // Auto-create default list logic moved to mutation or handled here if empty
          if (data.length === 0) {
               const { data: newList, error: createError } = await supabase
                 .from('shopping_lists')
                 .insert({ household_id: household.id, name: t('shoppingList.defaultListName') })
                 .select()
                 .single();
               if (createError) throw createError;
               return [newList];
          }
          return data;
      },
      enabled: !!household,
  });

  // Auto-select list
  useEffect(() => {
      if (shoppingLists.length > 0 && !activeShoppingListId) {
          const savedId = household ? localStorage.getItem(`activeShoppingListId_${household.id}`) : null;
          const exists = shoppingLists.find(l => l.id === savedId);
          setActiveShoppingListId(exists ? savedId : shoppingLists[0].id);
      }
  }, [shoppingLists, activeShoppingListId, household]);

  useEffect(() => {
      if (activeShoppingListId && household) {
          localStorage.setItem(`activeShoppingListId_${household.id}`, activeShoppingListId);
      }
  }, [activeShoppingListId, household]);

  // 2. Fetch Items
  const { data: shoppingListItems = [], isLoading: isLoadingItems } = useQuery({
      queryKey: KEYS.items(activeShoppingListId || ''),
      queryFn: async () => {
          if (!activeShoppingListId || activeShoppingListId.startsWith('temp_')) return [];
          const { data, error } = await supabase.from('shopping_list_items').select('*').eq('list_id', activeShoppingListId);
          if (error) throw error;
          return data;
      },
      enabled: !!activeShoppingListId && !activeShoppingListId.startsWith('temp_'),
  });

  // 3. Realtime Subscription (Syncs React Query Cache)
  useEffect(() => {
      if (!activeShoppingListId || activeShoppingListId.startsWith('temp_')) return;

      const channel = supabase.channel(`shopping_list:${activeShoppingListId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_list_items', filter: `list_id=eq.${activeShoppingListId}` }, (payload) => {
              const queryKey = KEYS.items(activeShoppingListId);
              
              queryClient.setQueryData<ShoppingListItem[]>(queryKey, (old) => {
                  if (!old) return [];
                  if (payload.eventType === 'INSERT') {
                      return [...old, payload.new as ShoppingListItem];
                  } else if (payload.eventType === 'UPDATE') {
                      return old.map(item => item.id === payload.new.id ? payload.new as ShoppingListItem : item);
                  } else if (payload.eventType === 'DELETE') {
                      return old.filter(item => item.id !== payload.old.id);
                  }
                  return old;
              });
          })
          .subscribe();

      return () => {
          supabase.removeChannel(channel);
      };
  }, [activeShoppingListId, queryClient]);

  // 4. Mutations
  const createListMutation = useMutation({
      mutationFn: async (name: string) => {
          if (!household) throw new Error("No household");
          const { data, error } = await supabase.from('shopping_lists').insert({ name, household_id: household.id }).select().single();
          if (error) throw error;
          return data;
      },
      onSuccess: (newList) => {
          queryClient.invalidateQueries({ queryKey: KEYS.lists(household?.id || '') });
          setActiveShoppingListId(newList.id);
      }
  });

  const addItemMutation = useMutation({
      mutationFn: async ({ foodItemId, quantity }: { foodItemId: string, quantity: number }) => {
          if (!user || !activeShoppingListId) throw new Error("No context");
          const { data, error } = await supabase.from('shopping_list_items').insert({
              food_item_id: foodItemId,
              list_id: activeShoppingListId,
              added_by_user_id: user.id,
              quantity
          }).select().single();
          if (error) throw error;
          return data;
      },
      // Realtime subscription handles updates, but we can do optimistic insert here if needed.
      // For simplicity, we rely on Supabase returning fast or Realtime triggering.
  });

  const updateItemMutation = useMutation({
      mutationFn: async ({ id, updates }: { id: string, updates: Partial<ShoppingListItem> }) => {
          const { error } = await supabase.from('shopping_list_items').update(updates).eq('id', id);
          if (error) throw error;
      },
      onMutate: async ({ id, updates }) => {
          if (!activeShoppingListId) return;
          await queryClient.cancelQueries({ queryKey: KEYS.items(activeShoppingListId) });
          const previous = queryClient.getQueryData(KEYS.items(activeShoppingListId));
          
          queryClient.setQueryData<ShoppingListItem[]>(KEYS.items(activeShoppingListId), old => 
              old ? old.map(item => item.id === id ? { ...item, ...updates } : item) : []
          );
          return { previous };
      },
      onError: (err, vars, context) => {
          if (activeShoppingListId && context?.previous) {
              queryClient.setQueryData(KEYS.items(activeShoppingListId), context.previous);
          }
      }
  });

  const deleteItemMutation = useMutation({
      mutationFn: async (id: string) => {
          const { error } = await supabase.from('shopping_list_items').delete().eq('id', id);
          if (error) throw error;
      },
      onMutate: async (id) => {
          if (!activeShoppingListId) return;
          await queryClient.cancelQueries({ queryKey: KEYS.items(activeShoppingListId) });
          const previous = queryClient.getQueryData(KEYS.items(activeShoppingListId));
          queryClient.setQueryData<ShoppingListItem[]>(KEYS.items(activeShoppingListId), old => 
              old ? old.filter(item => item.id !== id) : []
          );
          return { previous };
      },
      onError: (err, vars, context) => {
          if (activeShoppingListId && context?.previous) {
              queryClient.setQueryData(KEYS.items(activeShoppingListId), context.previous);
          }
      }
  });

  // --- API ---
  const addItemToList = useCallback((foodItemId: string, quantity = 1) => {
      // Check existing
      const existing = shoppingListItems.find(i => i.food_item_id === foodItemId);
      if (existing) {
          updateItemMutation.mutate({ id: existing.id, updates: { quantity: existing.quantity + quantity } });
      } else {
          addItemMutation.mutate({ foodItemId, quantity });
      }
  }, [shoppingListItems, addItemMutation, updateItemMutation]);

  return {
    shoppingLists,
    activeShoppingListId,
    shoppingListItems,
    loading: isLoadingLists || isLoadingItems,
    error: null,
    setActiveShoppingListId,
    createList: (name: string) => createListMutation.mutate(name),
    deleteList: async (id: string) => { await supabase.from('shopping_lists').delete().eq('id', id); queryClient.invalidateQueries({ queryKey: KEYS.lists(household?.id || '') }); }, // Simplified
    addItemToList,
    updateQuantity: (id: string, q: number) => q <= 0 ? deleteItemMutation.mutate(id) : updateItemMutation.mutate({ id, updates: { quantity: q } }),
    removeItem: (id: string) => deleteItemMutation.mutate(id),
    toggleChecked: (id: string, checked: boolean) => updateItemMutation.mutate({ id, updates: { checked, checked_by_user_id: checked ? user?.id : null } }),
    clearCompleted: async () => {
        const ids = shoppingListItems.filter(i => i.checked).map(i => i.id);
        if(ids.length > 0) await supabase.from('shopping_list_items').delete().in('id', ids); // Realtime will update UI
    }
  };
};
