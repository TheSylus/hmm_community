import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { FoodItem, ShoppingList, ShoppingListItem, Like, CommentWithProfile, UserProfile, GroupMember } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect, useMemo } from 'react';

const LAST_USED_LIST_ID_KEY = 'lastUsedShoppingListId';

export const useData = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    
    // --- Data Fetching Queries ---
    
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
            const { data, error } = await supabase.from('food_items').select('*').eq('isPublic', true).order('created_at', { ascending: false }).limit(50);
            if (error) throw error;
            return data || [];
        },
    });

    const { data: shoppingLists = [], isLoading: isLoadingShoppingLists } = useQuery<ShoppingList[]>({
        queryKey: ['shopping_lists', user?.id],
        queryFn: async () => {
            if (!user) return [];
            // This query now relies on a standard Row Level Security (RLS) policy on the `shopping_lists` table.
            // The RLS policy should ensure users can only SELECT lists they are a member of.
            // Example RLS Policy (for SELECT): EXISTS (SELECT 1 FROM group_members WHERE group_members.list_id = shopping_lists.id AND group_members.user_id = auth.uid())
            const { data, error } = await supabase
                .from('shopping_lists')
                .select('*')
                .order('created_at', { ascending: false });
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
    
    const { data: groupMembersData = [] } = useQuery<GroupMember[]>({
        queryKey: ['group_members', shoppingLists.map(l => l.id)],
        queryFn: async () => {
            if (!user || shoppingLists.length === 0) return [];
            const listIds = shoppingLists.map(l => l.id);
            const { data, error } = await supabase
                .from('group_members')
                .select('list_id, user_id, profiles(id, email)')
                .in('list_id', listIds);

            if (error) throw error;
            return data as GroupMember[] || [];
        },
        enabled: !!user && shoppingLists.length > 0,
    });
    
    const groupMembers = useMemo(() => {
        return groupMembersData.reduce((acc, member) => {
            if (!acc[member.list_id]) {
                acc[member.list_id] = [];
            }
            if (member.profiles) {
                 acc[member.list_id].push({ id: member.user_id, email: member.profiles.email });
            }
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

    // --- Local State for UI ---
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
    const invalidateAllGroupData = () => {
        queryClient.invalidateQueries({ queryKey: ['shopping_lists', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['group_members'] });
        queryClient.invalidateQueries({ queryKey: ['shopping_list_items', user?.id] });
    }

    const addFoodItemMutation = useMutation({
        mutationFn: async (newItem: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) => {
            if (!user) throw new Error("User not authenticated");
            const payload = { ...newItem, user_id: user.id };
            const { error } = await supabase.from('food_items').insert(payload);
            if (error) {
                console.error('Supabase insert error:', error);
                throw error;
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
            const { error } = await supabase.from('food_items').update(updatePayload).eq('id', id);
            if (error) {
                console.error('Supabase update error:', error);
                throw error;
            }
            return null;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['food_items', user?.id] });
            if (variables.isPublic) {
                queryClient.invalidateQueries({ queryKey: ['public_food_items'] });
            }
        },
    });

    const deleteFoodItemMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('food_items').delete().eq('id', id);
            if (error) {
                console.error('Supabase delete error:', error);
                throw error;
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
            
            const { data, error } = await supabase.rpc('create_new_shopping_list', { list_name: name });
    
            if (error) {
                console.error('Error calling create_new_shopping_list RPC:', error);
                if (error.message.includes('function public.create_new_shopping_list(list_name=>text) does not exist')) {
                    throw new Error("Group creation failed. The required database function 'create_new_shopping_list' is missing. Please create it in the Supabase SQL Editor.");
                }
                throw new Error(`Could not create group. DB error: ${error.message}`);
            }
            return data;
        },
        onSuccess: invalidateAllGroupData,
    });
    
    const updateShoppingListMutation = useMutation({
        mutationFn: async ({ listId, name }: { listId: string, name: string }) => {
            const { error } = await supabase.from('shopping_lists').update({ name }).eq('id', listId);
            if (error) {
                console.error('Supabase update list error:', error);
                throw error;
            }
        },
        onSuccess: invalidateAllGroupData,
    });

    const deleteShoppingListMutation = useMutation({
        mutationFn: async (listId: string) => {
            const { error } = await supabase.from('shopping_lists').delete().eq('id', listId);
            if (error) {
                console.error('Supabase delete list error:', error);
                throw error;
            }
        },
        onSuccess: invalidateAllGroupData,
    });

    const removeMemberFromListMutation = useMutation({
        mutationFn: async ({ listId, memberId }: { listId: string, memberId: string }) => {
            const { error } = await supabase.from('group_members').delete().match({ list_id: listId, user_id: memberId });
            if (error) {
                console.error('Supabase remove member error:', error);
                throw error;
            }
        },
        onSuccess: invalidateAllGroupData,
    });

    const addShoppingListItemMutation = useMutation({
       mutationFn: async (item: Pick<ShoppingListItem, 'list_id' | 'food_item_id' | 'name' | 'quantity'>) => {
            if (!user) throw new Error("User not authenticated");
            const { error } = await supabase.from('shopping_list_items').insert({ ...item, added_by: user.id });
            if (error) {
                console.error('Supabase add shopping item error:', error);
                throw error;
            }
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping_list_items', user?.id] }),
    });
    
    const toggleShoppingListItemMutation = useMutation({
        mutationFn: async ({ itemId, checked }: { itemId: string, checked: boolean }) => {
            const { error } = await supabase.from('shopping_list_items').update({ checked }).eq('id', itemId);
            if (error) {
                console.error('Supabase toggle shopping item error:', error);
                throw error;
            }
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping_list_items', user?.id] }),
    });

    return {
        foodItems, isLoadingItems,
        addFoodItem: addFoodItemMutation.mutateAsync,
        updateFoodItem: updateFoodItemMutation.mutateAsync,
        deleteFoodItem: deleteFoodItemMutation.mutateAsync,
        
        publicFoodItems, isLoadingPublicItems, 
        likes, comments,
        
        shoppingLists, isLoadingShoppingLists,
        groupMembers,
        createShoppingList: createShoppingListMutation.mutateAsync,
        updateShoppingList: updateShoppingListMutation.mutateAsync,
        deleteShoppingList: deleteShoppingListMutation.mutateAsync,
        removeMemberFromList: removeMemberFromListMutation.mutateAsync,
        
        lastUsedShoppingListId, setLastUsedShoppingListId: setLastUsedShoppingListIdState,
        
        allShoppingListItems,
        addShoppingListItem: addShoppingListItemMutation.mutateAsync,
        toggleShoppingListItem: toggleShoppingListItemMutation.mutateAsync,
    };
};