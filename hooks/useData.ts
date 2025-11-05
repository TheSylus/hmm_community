import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { FoodItem, ShoppingList, HydratedShoppingListItem, UserProfile, Like, CommentWithProfile } from '../types';

export const useData = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // --- Food Items ---
    const { data: foodItems, isLoading: isLoadingFoodItems } = useQuery<FoodItem[]>({
        queryKey: ['foodItems', user?.id],
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
            if (!user) throw new Error("User not logged in");
            const { data, error } = await supabase
                .from('food_items')
                .insert([{ ...newItem, user_id: user.id }])
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['foodItems', user?.id] });
        },
    });

    const updateFoodItemMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<FoodItem> }) => {
            const { data, error } = await supabase
                .from('food_items')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['foodItems', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['publicFoodItems'] });
        },
    });

    const deleteFoodItemMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('food_items').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['foodItems', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['publicFoodItems'] });
        },
    });

    // --- Shopping Lists & Members ---
    const { data: shoppingLists, isLoading: isLoadingShoppingLists } = useQuery<ShoppingList[]>({
        queryKey: ['shoppingLists', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase.rpc('get_user_shopping_lists');
            if (error) throw error;
            return data || [];
        },
        enabled: !!user,
    });
    
    const { data: groupMembers, isLoading: isLoadingMembers } = useQuery<Record<string, UserProfile[]>>({
        queryKey: ['groupMembers', shoppingLists?.map(l => l.id)],
        queryFn: async () => {
            if (!shoppingLists || shoppingLists.length === 0) return {};
            const listIds = shoppingLists.map(l => l.id);
            const { data, error } = await supabase
                .from('shopping_list_members')
                .select('list_id, profiles!inner(id, email)')
                .in('list_id', listIds);
            
            if (error) throw error;

            const membersByList: Record<string, UserProfile[]> = {};
            for (const member of (data as any[])) {
                if (!membersByList[member.list_id]) {
                    membersByList[member.list_id] = [];
                }
                if (member.profiles) {
                    membersByList[member.list_id].push(member.profiles as UserProfile);
                }
            }
            return membersByList;
        },
        enabled: !!shoppingLists && shoppingLists.length > 0
    });

    const createListMutation = useMutation({
        mutationFn: (name: string) => supabase.rpc('create_shopping_list', { list_name: name }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shoppingLists', user?.id] }),
    });

    const renameListMutation = useMutation({
        mutationFn: ({ listId, name }: { listId: string, name: string }) => supabase.from('shopping_lists').update({ name }).eq('id', listId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shoppingLists', user?.id] }),
    });

    const deleteListMutation = useMutation({
        mutationFn: (listId: string) => supabase.from('shopping_lists').delete().eq('id', listId),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['shoppingLists', user?.id] });
          queryClient.invalidateQueries({ queryKey: ['groupMembers'] });
        }
    });
    
    const addMemberMutation = useMutation({
        mutationFn: ({ listId, email }: { listId: string; email: string; }) => supabase.rpc('add_member_to_shopping_list', { list_id_param: listId, user_email_param: email }),
        onSuccess: (_data, variables) => {
            const listIds = shoppingLists?.map(l => l.id);
            queryClient.invalidateQueries({ queryKey: ['groupMembers', listIds]});
        }
    });

    const removeMemberMutation = useMutation({
        mutationFn: ({ listId, memberId }: { listId: string; memberId: string; }) => supabase.from('shopping_list_members').delete().match({ list_id: listId, user_id: memberId }),
        onSuccess: () => {
            const listIds = shoppingLists?.map(l => l.id);
            queryClient.invalidateQueries({ queryKey: ['groupMembers', listIds]});
        }
    });

    const leaveListMutation = useMutation({
        mutationFn: (listId: string) => supabase.from('shopping_list_members').delete().match({ list_id: listId, user_id: user?.id }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shoppingLists', user?.id] })
    });
    
    // --- Shopping List Items ---
    const getShoppingListItems = (listId: string | null) => useQuery<HydratedShoppingListItem[]>({
        queryKey: ['shoppingListItems', listId],
        queryFn: async () => {
            if (!listId) return [];
            const { data, error } = await supabase.rpc('get_hydrated_shopping_list_items', { p_list_id: listId });
            if (error) throw error;
            return data || [];
        },
        enabled: !!listId,
    });

    const addShoppingListItemMutation = useMutation({
        mutationFn: async ({ listId, foodItemId, name, quantity }: { listId: string; foodItemId: string | null; name: string; quantity: number }) => {
            if (!user) throw new Error("User not authenticated");
            return supabase.from('shopping_list_items').insert({
                list_id: listId,
                food_item_id: foodItemId,
                name,
                quantity,
                added_by: user.id
            });
        },
        onSuccess: (_data, variables) => queryClient.invalidateQueries({ queryKey: ['shoppingListItems', variables.listId] }),
    });

    const toggleShoppingListItemMutation = useMutation({
        mutationFn: ({ itemId, checked, listId }: { itemId: string; checked: boolean; listId: string; }) => supabase.from('shopping_list_items').update({ checked }).eq('id', itemId),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['shoppingListItems', variables.listId] });
        },
    });


    // --- Public Items (Discover) ---
    const { data: publicFoodItems, isLoading: isLoadingPublicItems } = useQuery<FoodItem[]>({
        queryKey: ['publicFoodItems'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('food_items')
                .select('*')
                .eq('is_public', true)
                .order('created_at', { ascending: false })
                .limit(50);
            if (error) throw error;
            return data || [];
        },
    });

    const { data: likes, isLoading: isLoadingLikes } = useQuery<Like[]>({
        queryKey: ['likes'],
        queryFn: async () => {
            const { data, error } = await supabase.from('likes').select('*');
            if (error) throw error;
            return data || [];
        },
    });

    const { data: comments, isLoading: isLoadingComments } = useQuery<CommentWithProfile[]>({
        queryKey: ['comments'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('comments')
                .select('*, profiles(id, email)')
                .order('created_at', { ascending: true });
            if (error) throw error;
            return (data as any) || [];
        },
    });
    
    return {
        foodItems: foodItems || [],
        isLoadingFoodItems,
        addFoodItem: addFoodItemMutation.mutateAsync,
        updateFoodItem: updateFoodItemMutation.mutateAsync,
        deleteFoodItem: deleteFoodItemMutation.mutateAsync,
        shoppingLists: shoppingLists || [],
        isLoadingShoppingLists,
        groupMembers: groupMembers || {},
        isLoadingMembers,
        createShoppingList: createListMutation.mutateAsync,
        renameShoppingList: renameListMutation.mutateAsync,
        deleteShoppingList: deleteListMutation.mutateAsync,
        addMemberToShoppingList: addMemberMutation.mutateAsync,
        removeMemberFromShoppingList: removeMemberMutation.mutateAsync,
        leaveShoppingList: leaveListMutation.mutateAsync,
        getShoppingListItems,
        addShoppingListItem: addShoppingListItemMutation.mutateAsync,
        toggleShoppingListItem: toggleShoppingListItemMutation.mutateAsync,
        publicFoodItems: publicFoodItems || [],
        isLoadingPublicItems,
        likes: likes || [],
        comments: comments || [],
    };
};
