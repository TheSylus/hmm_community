// FIX: Implemented the `useData` custom hook for fetching and mutating application data via Supabase and React Query, resolving module errors.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { FoodItem, ShoppingList, ShoppingListItem, Like, CommentWithProfile, HydratedShoppingListItem, UserProfile, GroupMember } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect, useCallback } from 'react';

const LAST_USED_LIST_ID_KEY = 'lastUsedShoppingListId';

export const useData = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [lastUsedShoppingListId, setLastUsedShoppingListIdState] = useState<string | null>(
      () => localStorage.getItem(LAST_USED_LIST_ID_KEY)
    );

    useEffect(() => {
        if (lastUsedShoppingListId) {
            localStorage.setItem(LAST_USED_LIST_ID_KEY, lastUsedShoppingListId);
        } else {
            localStorage.removeItem(LAST_USED_LIST_ID_KEY);
        }
    }, [lastUsedShoppingListId]);

    // --- Food Items ---
    const { data: foodItems = [], isLoading: isLoadingItems } = useQuery<FoodItem[]>({
        queryKey: ['food_items', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from('food_items')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        },
        enabled: !!user,
    });

    const addFoodItemMutation = useMutation({
        mutationFn: async (newItem: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) => {
            if (!user) throw new Error("User not authenticated");
            const { data, error } = await supabase
                .from('food_items')
                .insert([{ ...newItem, user_id: user.id }])
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['food_items', user?.id] });
        },
    });

    const updateFoodItemMutation = useMutation({
        mutationFn: async (updatedItem: FoodItem) => {
            const { id, user_id, created_at, ...rest } = updatedItem;
            const { data, error } = await supabase
                .from('food_items')
                .update(rest)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['food_items', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['public_food_items'] });
        }
    });

    const deleteFoodItemMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('food_items').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['food_items', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['public_food_items'] });
        }
    });


    // --- Public Food Items (Discover) ---
    const { data: publicFoodItems = [], isLoading: isLoadingPublicItems } = useQuery<FoodItem[]>({
        queryKey: ['public_food_items'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('food_items')
                .select('*')
                .eq('is_public', true)
                .order('created_at', { ascending: false })
                .limit(50);
            if (error) throw error;
            return data || [];
        }
    });

    const { data: likes = [] } = useQuery<Like[]>({
        queryKey: ['likes'],
        queryFn: async () => {
            const { data, error } = await supabase.from('likes').select('*');
            if (error) throw error;
            return data || [];
        }
    });

    const { data: comments = [] } = useQuery<CommentWithProfile[]>({
        queryKey: ['comments'],
        queryFn: async () => {
            const { data, error } = await supabase.from('comments').select('*, profiles(id, email)');
            if (error) throw error;
            return data as CommentWithProfile[] || [];
        }
    });

    // --- Shopping Lists (Groups) ---
     const { data: shoppingLists = [], isLoading: isLoadingShoppingLists } = useQuery<ShoppingList[]>({
        queryKey: ['shopping_lists', user?.id],
        queryFn: async () => {
            if(!user) return [];
            const { data, error } = await supabase.rpc('get_user_shopping_lists');
            if (error) throw error;
            return data || [];
        },
        enabled: !!user,
        // On initial load, if no last-used list is set, set it to the first one
        onSuccess: (data) => {
          if (data && data.length > 0 && !localStorage.getItem(LAST_USED_LIST_ID_KEY)) {
            setLastUsedShoppingListIdState(data[0].id);
          }
        }
    });

    const { data: groupMembers = {} } = useQuery<Record<string, UserProfile[]>>({
        queryKey: ['group_members', shoppingLists.map(l => l.id)],
        queryFn: async () => {
            if (!user || shoppingLists.length === 0) return {};
            const listIds = shoppingLists.map(l => l.id);
            const { data, error } = await supabase
                .from('group_members')
                .select('*, profiles(id, email)')
                .in('list_id', listIds);

            if (error) throw error;

            const membersByList: Record<string, UserProfile[]> = {};
            if (data) {
                (data as GroupMember[]).forEach(member => {
                    if (!membersByList[member.list_id]) {
                        membersByList[member.list_id] = [];
                    }
                    if (member.profiles) {
                        membersByList[member.list_id].push(member.profiles);
                    }
                });
            }
            return membersByList;
        },
        enabled: !!user && shoppingLists.length > 0,
    });

    const createShoppingListMutation = useMutation({
        mutationFn: async (name: string) => {
            if(!user) throw new Error("User not authenticated");
            const { data: list, error } = await supabase.from('shopping_lists').insert({ name, owner_id: user.id }).select().single();
            if (error) throw error;
            return list;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shopping_lists', user?.id] });
        }
    });
    
    // --- Shopping List Items ---
    const getShoppingListItems = (listId: string | undefined | null) => {
        return useQuery<HydratedShoppingListItem[]>({
            queryKey: ['shopping_list_items', listId],
            queryFn: async () => {
                if (!listId) return [];
                 const { data, error } = await supabase.rpc('get_shopping_list_items', { p_list_id: listId });
                if (error) throw error;
                return data || [];
            },
            enabled: !!listId,
        });
    };

    const addShoppingListItemMutation = useMutation({
        mutationFn: async (item: Pick<ShoppingListItem, 'list_id' | 'food_item_id' | 'name' | 'quantity'>) => {
            if (!user) throw new Error("User not authenticated");
            const { data, error } = await supabase
                .from('shopping_list_items')
                .insert([{ ...item, added_by: user.id }])
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['shopping_list_items', data.list_id] });
        }
    });
    
    const toggleShoppingListItemMutation = useMutation({
        mutationFn: async ({ listId, itemId, checked }: { listId: string; itemId: string, checked: boolean }) => {
            const { error } = await supabase
                .from('shopping_list_items')
                .update({ checked })
                .eq('id', itemId);
            if (error) throw error;
            return { listId, itemId, checked };
        },
        onSuccess: ({ listId }) => {
            queryClient.invalidateQueries({ queryKey: ['shopping_list_items', listId] });
        }
    });

    return {
        foodItems,
        isLoadingItems,
        addFoodItem: addFoodItemMutation.mutateAsync,
        updateFoodItem: updateFoodItemMutation.mutateAsync,
        deleteFoodItem: deleteFoodItemMutation.mutateAsync,
        
        publicFoodItems,
        isLoadingPublicItems,
        likes,
        comments,
        
        shoppingLists,
        isLoadingShoppingLists,
        groupMembers,
        createShoppingList: createShoppingListMutation.mutateAsync,
        lastUsedShoppingListId,
        setLastUsedShoppingListId: setLastUsedShoppingListIdState,
        
        getShoppingListItems,
        addShoppingListItem: addShoppingListItemMutation.mutateAsync,
        toggleShoppingListItem: toggleShoppingListItemMutation.mutateAsync,
    };
};