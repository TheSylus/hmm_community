// FIX: Implemented the `useData` custom hook for fetching and mutating application data via Supabase and React Query, resolving module errors.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { FoodItem, ShoppingList, ShoppingListItem, Like, CommentWithProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useData = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

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

     const { data: shoppingLists = [], isLoading: isLoadingShoppingLists } = useQuery<ShoppingList[]>({
        queryKey: ['shopping_lists', user?.id],
        queryFn: async () => {
            if(!user) return [];
            const { data: listIds, error: listIdError } = await supabase
                .from('group_members')
                .select('list_id')
                .eq('user_id', user.id);
            
            if (listIdError) throw listIdError;

            if(!listIds || listIds.length === 0) return [];
            
            const { data, error } = await supabase
                .from('shopping_lists')
                .select('*')
                .in('id', listIds.map(l => l.list_id));
            
            if (error) throw error;
            return data || [];
        },
        enabled: !!user
    });

    const createShoppingListMutation = useMutation({
        mutationFn: async (name: string) => {
            if(!user) throw new Error("User not authenticated");
            const { data: list, error } = await supabase.from('shopping_lists').insert({ name, owner_id: user.id }).select().single();
            if (error) throw error;
            // The handle_new_shopping_list trigger now handles adding the owner as a member
            return list;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shopping_lists', user?.id] });
        }
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
        onSuccess: (data) => {
            // A more specific invalidation would be better, but for now this is ok
            // queryClient.invalidateQueries(['shopping_list_items', data.list_id]);
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
        createShoppingList: createShoppingListMutation.mutateAsync,
        addShoppingListItem: addShoppingListItemMutation.mutateAsync,
    };
};