import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { FoodItem, ShoppingList, ShoppingListItem, Like, CommentWithProfile, HydratedShoppingListItem, UserProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect, useMemo } from 'react';

const LAST_USED_LIST_ID_KEY = 'lastUsedShoppingListId';

export const useData = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    
    // --- Granular Data Fetching with react-query (Stable Pattern) ---
    
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

    const { data: publicFoodItems = [], isLoading: isLoadingPublicItems } = useQuery<FoodItem[]>({
        queryKey: ['public_food_items'],
        queryFn: async () => {
            const { data, error } = await supabase.from('food_items').select('*').eq('is_public', true).order('created_at', { ascending: false }).limit(50);
            if (error) throw error;
            return data || [];
        },
    });

    const { data: shoppingLists = [], isLoading: isLoadingShoppingLists } = useQuery<ShoppingList[]>({
        queryKey: ['shopping_lists', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data: memberEntries, error: memberError } = await supabase.from('group_members').select('list_id').eq('user_id', user.id);
            if (memberError) throw memberError;
            if (!memberEntries || memberEntries.length === 0) return [];
            
            const listIds = memberEntries.map(e => e.list_id);
            const { data, error } = await supabase.from('shopping_lists').select('*').in('id', listIds);
            if (error) throw error;
            return data || [];
        },
        enabled: !!user,
    });

    const { data: allShoppingListItems = [] } = useQuery<(ShoppingListItem & { food_items: Partial<FoodItem> | null })[]>({
        queryKey: ['shopping_list_items', user?.id],
        queryFn: async () => {
            if (!user || shoppingLists.length === 0) return [];
            const listIds = shoppingLists.map(l => l.id);
            const { data, error } = await supabase.from('shopping_list_items').select('*, food_items (*)').in('list_id', listIds);
            if (error) throw error;
            return data || [];
        },
        enabled: !!user && shoppingLists.length > 0,
    });
    
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
            const profile: UserProfile = { id: member.user_id, email: member.email };
            acc[member.list_id].push(profile);
            return acc;
        }, {} as Record<string, UserProfile[]>);
    }, [groupMembersData]);

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
             const { data, error } = await supabase.from('comments').select('*, profiles:user_id(id, email)');
             if (error) throw error;
             return data as CommentWithProfile[] || [];
        }
    });

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
        if (shoppingLists.length > 0 && (!lastUsedShoppingListId || !shoppingLists.find(l => l.id === lastUsedShoppingListId))) {
            setLastUsedShoppingListIdState(shoppingLists[0].id);
        }
    }, [shoppingLists, lastUsedShoppingListId]);

    // --- Mutations ---
    
    const addFoodItemMutation = useMutation({
        mutationFn: async (newItem: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) => {
            if (!user) throw new Error("User not authenticated");
            const { error } = await supabase.rpc('create_food_item', { new_item: newItem });
            if (error) {
                console.error("Supabase RPC 'create_food_item' error:", error);
                throw new Error("Could not add food item. Please check your database function and RLS policies.");
            }
            return null;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['food_items', user?.id] });
        },
    });

    const updateFoodItemMutation = useMutation({
        mutationFn: async (updatedItem: FoodItem) => {
            const { id, user_id, created_at, ...updatePayload } = updatedItem;
            const { error } = await supabase.rpc('update_food_item', { item_id: id, payload: updatePayload });
            if (error) {
                console.error("Supabase RPC 'update_food_item' error:", error);
                throw new Error("Could not update food item. Please check your database function and RLS policies.");
            }
            return null;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['food_items', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['public_food_items'] });
        },
    });

    const deleteFoodItemMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.rpc('delete_food_item', { item_id: id });
            if (error) {
                 console.error("Supabase RPC 'delete_food_item' error:", error);
                throw new Error("Could not delete food item. Please check your database function and RLS policies.");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['food_items', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['public_food_items'] });
        },
    });

    const createShoppingListMutation = useMutation({
        mutationFn: async (name: string) => {
            if (!user) throw new Error("User not authenticated");
            const { error } = await supabase.rpc('create_shopping_list_with_owner', { list_name: name });
            if (error) {
                console.error("Supabase RPC 'create_shopping_list_with_owner' error:", error);
                throw new Error("Could not create the group. The database operation failed. Please check your 'create_shopping_list_with_owner' function.");
            }
            return null;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shopping_lists', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['group_members', user?.id] });
        },
    });

    const addShoppingListItemMutation = useMutation({
       mutationFn: async (item: Pick<ShoppingListItem, 'list_id' | 'food_item_id' | 'name' | 'quantity'>) => {
            if (!user) throw new Error("User not authenticated");
            const { error } = await supabase.rpc('add_item_to_shopping_list', {
                p_list_id: item.list_id,
                p_food_item_id: item.food_item_id,
                p_name: item.name,
                p_quantity: item.quantity
            });
            if (error) throw error;
            return null;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping_list_items', user?.id] }),
    });
    
    const toggleShoppingListItemMutation = useMutation({
        mutationFn: async ({ itemId, checked }: { itemId: string, checked: boolean }) => {
            const { error } = await supabase.rpc('toggle_shopping_list_item', { item_id: itemId, is_checked: checked });
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