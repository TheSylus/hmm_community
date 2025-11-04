import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { FoodItem, ShoppingList, ShoppingListItem, Like, CommentWithProfile, HydratedShoppingListItem, UserProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect, useMemo } from 'react';

const LAST_USED_LIST_ID_KEY = 'lastUsedShoppingListId';

// This interface defines the expected shape of the JSON object returned by our RPC function.
interface AllUserData {
    food_items: FoodItem[];
    public_food_items: FoodItem[];
    shopping_lists: ShoppingList[];
    shopping_list_items: (ShoppingListItem & { image?: string })[];
    group_members: { list_id: string; members: UserProfile[] }[];
    likes: Like[];
    comments: CommentWithProfile[];
}

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
    
    // --- Centralized Data Fetching ---
    const { data, isLoading: isLoadingItems } = useQuery<AllUserData | null>({
        queryKey: ['all_user_data', user?.id],
        queryFn: async () => {
            if (!user) return null;
            const { data, error } = await supabase.rpc('get_all_user_data');
            if (error) {
                console.error("Error fetching all user data:", error);
                throw error;
            }
            return data;
        },
        enabled: !!user,
        onSuccess: (data) => {
            if (data?.shopping_lists && data.shopping_lists.length > 0 && !localStorage.getItem(LAST_USED_LIST_ID_KEY)) {
                setLastUsedShoppingListIdState(data.shopping_lists[0].id);
            }
        }
    });

    // --- Memoized data selectors to avoid re-renders ---
    const foodItems = data?.food_items || [];
    const publicFoodItems = data?.public_food_items || [];
    const shoppingLists = data?.shopping_lists || [];
    const allShoppingListItems = data?.shopping_list_items || [];
    const likes = data?.likes || [];
    const comments = data?.comments || [];
    
    const groupMembers = useMemo(() => {
        const membersByList: Record<string, UserProfile[]> = {};
        if (data?.group_members) {
            for (const group of data.group_members) {
                // The RPC function returns members as a simple array of UserProfile-like objects
                membersByList[group.list_id] = group.members.map(m => ({ id: m.id, email: m.email }));
            }
        }
        return membersByList;
    }, [data?.group_members]);


    // --- Mutations ---
    const invalidateAllData = () => {
        queryClient.invalidateQueries({ queryKey: ['all_user_data', user?.id] });
    };

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
        onSuccess: invalidateAllData,
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
        onSuccess: invalidateAllData,
    });

    const deleteFoodItemMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('food_items').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: invalidateAllData,
    });

    const createShoppingListMutation = useMutation({
        mutationFn: async (name: string) => {
            if(!user) throw new Error("User not authenticated");
            const { data, error } = await supabase.from('shopping_lists').insert({ name, owner_id: user.id }).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: invalidateAllData,
    });

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
        onSuccess: invalidateAllData,
    });
    
    const toggleShoppingListItemMutation = useMutation({
        mutationFn: async ({ itemId, checked }: { itemId: string, checked: boolean }) => {
            const { error } = await supabase
                .from('shopping_list_items')
                .update({ checked })
                .eq('id', itemId);
            if (error) throw error;
        },
        onSuccess: invalidateAllData,
    });

    return {
        foodItems,
        isLoadingItems,
        addFoodItem: addFoodItemMutation.mutateAsync,
        updateFoodItem: updateFoodItemMutation.mutateAsync,
        deleteFoodItem: deleteFoodItemMutation.mutateAsync,
        
        publicFoodItems,
        isLoadingPublicItems: isLoadingItems, 
        likes,
        comments,
        
        shoppingLists,
        allShoppingListItems,
        isLoadingShoppingLists: isLoadingItems,
        groupMembers,
        createShoppingList: createShoppingListMutation.mutateAsync,
        lastUsedShoppingListId,
        setLastUsedShoppingListId: setLastUsedShoppingListIdState,
        
        addShoppingListItem: addShoppingListItemMutation.mutateAsync,
        toggleShoppingListItem: toggleShoppingListItemMutation.mutateAsync,
    };
};