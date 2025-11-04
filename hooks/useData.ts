import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { FoodItem, ShoppingList, ShoppingListItem, Like, CommentWithProfile, HydratedShoppingListItem, UserProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect, useMemo } from 'react';

const LAST_USED_LIST_ID_KEY = 'lastUsedShoppingListId';

export const useData = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    
    // --- Granular Data Fetching with react-query ---
    
    // Fetch user's own food items
    const { data: foodItems = [], isLoading: isLoadingItems } = useQuery<FoodItem[]>({
        queryKey: ['food_items', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase.from('food_items').select('*').eq('user_id', user.id);
            if (error) throw error;
            return data || [];
        },
        enabled: !!user,
    });

    // Fetch public food items
    const { data: publicFoodItems = [], isLoading: isLoadingPublicItems } = useQuery<FoodItem[]>({
        queryKey: ['public_food_items'],
        queryFn: async () => {
            const { data, error } = await supabase.from('food_items').select('*').eq('is_public', true).order('created_at', { ascending: false }).limit(50);
            if (error) throw error;
            return data || [];
        },
    });

    // Fetch shopping lists the user is a member of
    const { data: shoppingLists = [], isLoading: isLoadingShoppingLists } = useQuery<ShoppingList[]>({
        queryKey: ['shopping_lists', user?.id],
        queryFn: async () => {
            if (!user) return [];
            // First, get the list IDs the user is a member of
            const { data: memberEntries, error: memberError } = await supabase.from('group_members').select('list_id').eq('user_id', user.id);
            if (memberError) throw memberError;
            if (!memberEntries || memberEntries.length === 0) return [];
            
            const listIds = memberEntries.map(e => e.list_id);

            // Then, fetch the details of those lists
            const { data, error } = await supabase.from('shopping_lists').select('*').in('id', listIds);
            if (error) throw error;
            return data || [];
        },
        enabled: !!user,
    });

    // Fetch all items for all of the user's shopping lists
    const { data: allShoppingListItems = [] } = useQuery<(ShoppingListItem & { food_items: Partial<FoodItem> | null })[]>({
        queryKey: ['shopping_list_items', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data: memberEntries, error: memberError } = await supabase.from('group_members').select('list_id').eq('user_id', user.id);
            if (memberError) throw memberError;
            if (!memberEntries || memberEntries.length === 0) return [];

            const listIds = memberEntries.map(e => e.list_id);
            
            const { data, error } = await supabase
                .from('shopping_list_items')
                .select('*, food_items (*)')
                .in('list_id', listIds);

            if (error) throw error;
            return data || [];
        },
        enabled: !!user && shoppingLists.length > 0,
    });
    
    // Fetch group members using the new, safe RPC function
    const { data: groupMembersData = [] } = useQuery<{list_id: string, user_id: string, email: string}[]>({
        queryKey: ['group_members', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase.rpc('get_group_members_for_user_lists');
            if (error) throw error;
            return data || [];
        },
        enabled: !!user && shoppingLists.length > 0,
    });
    
    const groupMembers = useMemo(() => {
        return groupMembersData.reduce((acc, member) => {
            if (!acc[member.list_id]) {
                acc[member.list_id] = [];
            }
            acc[member.list_id].push({ id: member.user_id, email: member.email });
            return acc;
        }, {} as Record<string, UserProfile[]>);
    }, [groupMembersData]);

    // Fetch likes and comments (can be simplified as they are public)
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
            // This needs a join with user profiles (or just emails for simplicity)
             const { data, error } = await supabase.from('comments').select('*, profiles:user_id(id, email)');
             if (error) throw error;
             return data as CommentWithProfile[] || [];
        }
    });

    // --- Local state for last used list ---
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
    
    useEffect(() => {
        if (shoppingLists.length > 0 && !lastUsedShoppingListId) {
            setLastUsedShoppingListIdState(shoppingLists[0].id);
        }
    }, [shoppingLists, lastUsedShoppingListId]);

    // --- Mutations ---
    
    const addFoodItemMutation = useMutation({
        mutationFn: async (newItem: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) => {
            if (!user) throw new Error("User not authenticated");
            const { data, error } = await supabase.from('food_items').insert([{ ...newItem, user_id: user.id }]).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['food_items', user?.id] }),
    });

    const updateFoodItemMutation = useMutation({
        mutationFn: async (updatedItem: FoodItem) => {
            const { id, user_id, created_at, ...rest } = updatedItem;
            const { data, error } = await supabase.from('food_items').update(rest).eq('id', id).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['food_items', user?.id] }),
    });

    const deleteFoodItemMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('food_items').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['food_items', user?.id] }),
    });

    const createShoppingListMutation = useMutation({
        mutationFn: async (name: string) => {
            if(!user) throw new Error("User not authenticated");
            const { data, error } = await supabase.from('shopping_lists').insert({ name, owner_id: user.id }).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shopping_lists', user?.id] });
        },
    });

    const addShoppingListItemMutation = useMutation({
        mutationFn: async (item: Pick<ShoppingListItem, 'list_id' | 'food_item_id' | 'name' | 'quantity'>) => {
            if (!user) throw new Error("User not authenticated");
            const { data, error } = await supabase.from('shopping_list_items').insert([{ ...item, added_by: user.id }]).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping_list_items', user?.id] }),
    });
    
    const toggleShoppingListItemMutation = useMutation({
        mutationFn: async ({ itemId, checked }: { itemId: string, checked: boolean }) => {
            const { error } = await supabase.from('shopping_list_items').update({ checked }).eq('id', itemId);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping_list_items', user?.id] }),
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
        allShoppingListItems,
        isLoadingShoppingLists,
        groupMembers,
        createShoppingList: createShoppingListMutation.mutateAsync,
        lastUsedShoppingListId,
        setLastUsedShoppingListId: setLastUsedShoppingListIdState,
        
        addShoppingListItem: addShoppingListItemMutation.mutateAsync,
        toggleShoppingListItem: toggleShoppingListItemMutation.mutateAsync,
    };
};
