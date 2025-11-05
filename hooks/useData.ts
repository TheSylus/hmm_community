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
            // Reverted to a direct select. The RLS policy is now fixed and robust.
            // This is cleaner than using an RPC for a simple select.
            const { data, error } = await supabase
                .from('shopping_lists')
                .select('*');
            if (error) {
                console.error("Error fetching shopping lists:", error);
                throw error;
            }
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
            const itemWithUser = { ...newItem, user_id: user.id };
            const { error } = await supabase.from('food_items').insert(itemWithUser);
            if (error) {
                console.error("Supabase insert 'food_items' error:", error);
                throw new Error("Could not add food item. Please check your RLS policies.");
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
                console.error("Supabase update 'food_items' error:", error);
                throw new Error("Could not update food item. Please check your RLS policies.");
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
            const { error } = await supabase.from('food_items').delete().eq('id', id);
            if (error) {
                 console.error("Supabase delete 'food_items' error:", error);
                throw new Error("Could not delete food item. Please check your RLS policies.");
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
            
            // Step 1: Create the list
            const { data, error: listError } = await supabase
                .from('shopping_lists')
                .insert({ name: name, owner_id: user.id })
                .select()
                .single();

            if (listError) {
                console.error("Supabase insert 'shopping_lists' error:", listError);
                throw new Error("Could not create the group. Please check your RLS policies for 'shopping_lists'.");
            }
            
            if (!data) {
                throw new Error("Failed to create group: No data returned after insert.");
            }

            // Step 2: Add the owner as a member. This is likely what the original RPC did.
            const { error: memberError } = await supabase
                .from('group_members')
                .insert({ list_id: data.id, user_id: user.id });

            if (memberError) {
                // In a production app, you might want to delete the created list for atomicity.
                console.error("Supabase insert 'group_members' error:", memberError);
                throw new Error("Group created, but failed to add owner as member. Check RLS policies for 'group_members'.");
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
            const itemWithUser = { ...item, added_by: user.id };
            const { error } = await supabase.from('shopping_list_items').insert(itemWithUser);
            if (error) {
                console.error("Supabase insert 'shopping_list_items' error:", error);
                throw new Error("Could not add item to list. Please check your RLS policies.");
            }
            return null;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping_list_items', user?.id] }),
    });
    
    const toggleShoppingListItemMutation = useMutation({
        mutationFn: async ({ itemId, checked }: { itemId: string, checked: boolean }) => {
            const { error } = await supabase.from('shopping_list_items').update({ checked }).eq('id', itemId);
             if (error) {
                console.error("Supabase update 'shopping_list_items' error:", error);
                throw new Error("Could not update item in list. Please check your RLS policies.");
            }
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