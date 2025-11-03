import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { FoodItem, ShoppingList, ShoppingListItem, ShoppingListMember, UserProfile, HydratedShoppingListItem, Like, CommentWithProfile } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useMemo, useState } from 'react';

// --- Query Keys Factory ---
const queryKeys = {
    all: ['allData'] as const,
    userData: (userId?: string) => [...queryKeys.all, 'userData', userId] as const,
    publicData: () => [...queryKeys.all, 'publicData'] as const,
    profiles: () => [...queryKeys.all, 'profiles'] as const,
};

// --- Data Shape Interfaces for TanStack Query Cache ---
interface AllUserData {
    foodItems: FoodItem[];
    shoppingLists: ShoppingList[];
    shoppingListItems: ShoppingListItem[];
    memberships: ShoppingListMember[];
}

interface PublicData {
    publicItems: FoodItem[];
    likes: Like[];
    comments: CommentWithProfile[];
}


// --- Custom Hook: useData ---
export const useData = (userId?: string) => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const [activeListId, setActiveListId] = useState<string | null>(null);

    // --- QUERIES (Data Fetching) ---

    const { data: allData, isLoading: isInitialLoading } = useQuery<AllUserData>({
        queryKey: queryKeys.userData(userId),
        queryFn: async () => {
            if (!userId) return { foodItems: [], shoppingLists: [], shoppingListItems: [], memberships: [] };
            
            const foodItemsPromise = supabase.from('food_items').select('*').eq('user_id', userId).order('created_at', { ascending: false });
            const shoppingListsPromise = supabase.rpc('get_user_shopping_lists');
            
            const [
                { data: foodItems, error: foodError },
                { data: shoppingLists, error: listError }
            ] = await Promise.all([foodItemsPromise, shoppingListsPromise]);

            if (foodError) throw foodError;
            if (listError) throw listError;
            
            const listIds = (shoppingLists || []).map(l => l.id);
            if (listIds.length === 0) return { foodItems: foodItems || [], shoppingLists: shoppingLists || [], shoppingListItems: [], memberships: [] };
            
            const listItemsPromise = supabase.from('shopping_list_items').select('*').in('list_id', listIds);
            const membershipsPromise = supabase.from('shopping_list_members').select('*').in('list_id', listIds);

            const [
                { data: shoppingListItems, error: listItemsError },
                { data: memberships, error: membersError }
            ] = await Promise.all([listItemsPromise, membershipsPromise]);

            if (listItemsError) throw listItemsError;
            if (membersError) throw membersError;

            return {
                foodItems: foodItems || [],
                shoppingLists: shoppingLists || [],
                shoppingListItems: shoppingListItems || [],
                memberships: memberships || []
            };
        },
        enabled: !!userId,
    });
    
    const { data: publicData, isLoading: isPublicLoading } = useQuery<PublicData>({
        queryKey: queryKeys.publicData(),
        queryFn: async () => {
             const { data: publicItems, error: itemsError } = await supabase.from('food_items').select('*').eq('isPublic', true).neq('user_id', userId || '').order('created_at', { ascending: false }).limit(50);
             if (itemsError) throw itemsError;
             if (!publicItems || publicItems.length === 0) {
                 return { publicItems: [], likes: [], comments: [] };
             }

             const itemIds = publicItems.map(item => item.id);
             
             // Optimization: If there are no items, no need to fetch likes/comments
             if (itemIds.length === 0) {
                return { publicItems: [], likes: [], comments: [] };
             }
             
             const likesPromise = supabase.from('likes').select('*').in('food_item_id', itemIds);
             const commentsPromise = supabase.from('comments').select(`*, profiles(display_name)`).in('food_item_id', itemIds).order('created_at', { ascending: true });
             
             const [
                 { data: likes, error: likesError },
                 { data: comments, error: commentsError },
             ] = await Promise.all([likesPromise, commentsPromise]);
             
             if (likesError) throw likesError;
             if (commentsError) throw commentsError;
             
             return { 
                publicItems: publicItems || [],
                likes: likes || [],
                comments: (comments as CommentWithProfile[]) || []
            };
        },
         enabled: !!userId,
    });
    
    const { data: allProfiles = {} } = useQuery({
        queryKey: queryKeys.profiles(),
        queryFn: async () => {
            const { data, error } = await supabase.from('profiles').select('id, display_name');
            if (error) throw error;
            return (data || []).reduce((acc, p) => {
                acc[p.id] = p;
                return acc;
            }, {} as Record<string, UserProfile>);
        },
    });

    // --- MEMOIZED SELECTORS (Derived Data) ---
    const { foodItems, shoppingLists, shoppingListItems, memberships } = allData || { foodItems: [], shoppingLists: [], shoppingListItems: [], memberships: [] };
    const { publicItems, likes, comments } = publicData || { publicItems: [], likes: [], comments: [] };

    const shoppingListMembers = useMemo(() => {
        if (!memberships.length || !Object.keys(allProfiles).length) return {};
        return memberships.reduce((acc, member) => {
            if (!acc[member.list_id]) acc[member.list_id] = [];
            if (allProfiles[member.user_id]) {
                acc[member.list_id].push(allProfiles[member.user_id]);
            }
            return acc;
        }, {} as Record<string, UserProfile[]>);
    }, [memberships, allProfiles]);

    const activeShoppingListData = useMemo(() => {
        if (!activeListId || !allData) {
            return { list: null, items: [], members: [], feed: [] };
        }
        const list = allData.shoppingLists.find(l => l.id === activeListId);
        const listItems = allData.shoppingListItems.filter(i => i.list_id === activeListId);
        const members = shoppingListMembers[activeListId] || [];

        const hydratedItems = listItems.map(listItem => {
            const foodItem = allData.foodItems.find(fi => fi.id === listItem.food_item_id);
            return {
                ...foodItem,
                shoppingListItemId: listItem.id,
                checked: listItem.checked,
                added_by_user_id: listItem.added_by_user_id,
                checked_by_user_id: listItem.checked_by_user_id,
            } as HydratedShoppingListItem;
        }).filter(item => item.id);
        
        const feed = allData.foodItems.filter(fi => fi.shared_with_list_id === activeListId);

        return { list, items: hydratedItems, members, feed };
    }, [activeListId, allData, shoppingListMembers]);

    // --- MUTATIONS (Data Modification) ---

    const addFoodItem = useMutation({
        mutationFn: async (newItemData: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>): Promise<FoodItem> => {
            if (!userId) throw new Error("User not authenticated");
            const { data, error } = await supabase.from('food_items').insert({ ...newItemData, user_id: userId }).select().single();
            if (error) throw error;
            return data;
        },
        onMutate: async (newItemData) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.userData(userId) });
            const previousData = queryClient.getQueryData<AllUserData>(queryKeys.userData(userId));
            const optimisticItemId = `optimistic-${Date.now()}`;

            if (previousData) {
                const optimisticItem: FoodItem = {
                    ...newItemData,
                    id: optimisticItemId,
                    user_id: userId!,
                    created_at: new Date().toISOString(),
                    rating: newItemData.rating || 0,
                    itemType: newItemData.itemType || 'product'
                };
                queryClient.setQueryData<AllUserData>(queryKeys.userData(userId), {
                    ...previousData,
                    foodItems: [optimisticItem, ...previousData.foodItems],
                });
            }
            return { previousData, optimisticItemId };
        },
        onSuccess: (newItemFromServer, _variables, context) => {
            addToast({ message: `'${newItemFromServer.name}' added!`, type: 'success' });
            queryClient.setQueryData<AllUserData>(queryKeys.userData(userId), (oldData) => {
                if (!oldData) return { foodItems: [newItemFromServer], shoppingLists: [], shoppingListItems: [], memberships: [] };
                const newFoodItems = oldData.foodItems.map(item => 
                    item.id === context?.optimisticItemId ? newItemFromServer : item
                );
                return { ...oldData, foodItems: newFoodItems };
            });
        },
        onError: (err, _variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(queryKeys.userData(userId), context.previousData);
            }
            addToast({ message: `Error adding item: ${err.message}`, type: 'error' });
        },
    });

    const updateFoodItem = useMutation({
        mutationFn: async (updatedItem: Partial<FoodItem> & { id: string }) => {
            const { data, error } = await supabase.from('food_items').update(updatedItem).eq('id', updatedItem.id).select().single();
            if (error) throw error;
            return data;
        },
        onMutate: async (updatedItem) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.userData(userId) });
            const previousData = queryClient.getQueryData<AllUserData>(queryKeys.userData(userId));
            if (previousData) {
                queryClient.setQueryData<AllUserData>(queryKeys.userData(userId), {
                    ...previousData,
                    foodItems: previousData.foodItems.map(item => item.id === updatedItem.id ? { ...item, ...updatedItem } : item)
                });
            }
            return { previousData };
        },
        onSuccess: (updatedItemFromServer) => {
            addToast({ message: 'Item updated!', type: 'success' });
             queryClient.setQueryData<AllUserData>(queryKeys.userData(userId), (oldData) => {
                if (!oldData) return;
                return {
                    ...oldData,
                    foodItems: oldData.foodItems.map(item => item.id === updatedItemFromServer.id ? updatedItemFromServer : item),
                };
            });
        },
        onError: (err, _variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(queryKeys.userData(userId), context.previousData);
            }
            addToast({ message: `Update failed: ${err.message}`, type: 'error' });
        },
    });
    
    const deleteFoodItem = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('food_items').delete().eq('id', id);
            if (error) throw error;
            return id;
        },
        onMutate: async (idToDelete) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.userData(userId) });
            const previousData = queryClient.getQueryData<AllUserData>(queryKeys.userData(userId));
            if (previousData) {
                 queryClient.setQueryData<AllUserData>(queryKeys.userData(userId), {
                    ...previousData,
                    foodItems: previousData.foodItems.filter(item => item.id !== idToDelete)
                });
            }
            return { previousData };
        },
        onSuccess: () => {
            addToast({ message: 'Item deleted.', type: 'info' });
        },
        onError: (err, _variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(queryKeys.userData(userId), context.previousData);
            }
            addToast({ message: `Delete failed: ${err.message}`, type: 'error' });
        },
    });

    const addShoppingList = useMutation({
        mutationFn: async (name: string): Promise<ShoppingList> => {
            if (!userId) throw new Error("User not authenticated");
            const { data: newList, error: listError } = await supabase.from('shopping_lists').insert({ name, owner_id: userId }).select().single();
            if (listError) throw listError;
            const { error: memberError } = await supabase.from('shopping_list_members').insert({ list_id: newList.id, user_id: userId });
            if (memberError) {
                await supabase.from('shopping_lists').delete().eq('id', newList.id);
                throw memberError;
            }
            return newList;
        },
        onSuccess: (newListFromServer) => {
            addToast({ message: 'New group created!', type: 'success' });
            queryClient.setQueryData<AllUserData>(queryKeys.userData(userId), (oldData) => {
                if (!oldData) return { 
                    foodItems: [], 
                    shoppingLists: [newListFromServer], 
                    shoppingListItems: [], 
                    memberships: [{ list_id: newListFromServer.id, user_id: userId!, created_at: new Date().toISOString() }] 
                };
                
                const newMembership: ShoppingListMember = {
                    list_id: newListFromServer.id,
                    user_id: userId!,
                    created_at: newListFromServer.created_at,
                };

                return {
                    ...oldData,
                    shoppingLists: [...oldData.shoppingLists, newListFromServer],
                    memberships: [...oldData.memberships, newMembership]
                };
            });
        },
        onError: (err) => addToast({ message: `Failed to create group: ${err.message}`, type: 'error' }),
    });
    
    const deleteShoppingList = useMutation({
        mutationFn: async (listId: string) => {
            const { error } = await supabase.rpc('delete_shopping_list', { list_id_param: listId });
            if (error) throw error;
            return listId;
        },
        onSuccess: (deletedListId) => {
            addToast({ message: 'Group deleted.', type: 'info' });
            queryClient.invalidateQueries({ queryKey: queryKeys.userData(userId) });
        },
        onError: (err) => addToast({ message: `Failed to delete group: ${err.message}`, type: 'error' }),
    });
    
    const leaveShoppingList = useMutation({
        mutationFn: async (listId: string) => {
            if (!userId) throw new Error("User not found");
            const { error } = await supabase.from('shopping_list_members').delete().eq('list_id', listId).eq('user_id', userId);
            if (error) throw error;
        },
        onSuccess: () => {
            addToast({ message: 'You have left the group.', type: 'info' });
            queryClient.invalidateQueries({ queryKey: queryKeys.userData(userId) });
        },
        onError: (err) => addToast({ message: `Failed to leave group: ${err.message}`, type: 'error' }),
    });

    const toggleListItemChecked = useMutation({
        mutationFn: async ({ id, isChecked, userId }: { id: string; isChecked: boolean; userId: string | null }) => {
            const { data, error } = await supabase.from('shopping_list_items').update({ checked: isChecked, checked_by_user_id: isChecked ? userId : null }).eq('id', id).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: (updatedItem) => {
            queryClient.setQueryData<AllUserData>(queryKeys.userData(userId), (oldData) => {
                if (!oldData) return;
                const newItems = oldData.shoppingListItems.map(item => item.id === updatedItem.id ? updatedItem : item);
                return { ...oldData, shoppingListItems: newItems };
            });
        },
        onError: (err) => addToast({ message: `Action failed: ${err.message}`, type: 'error' }),
    });

    const removeListItem = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('shopping_list_items').delete().eq('id', id);
            if (error) throw error;
            return id;
        },
        onSuccess: (removedItemId) => {
             queryClient.setQueryData<AllUserData>(queryKeys.userData(userId), (oldData) => {
                if (!oldData) return;
                return { ...oldData, shoppingListItems: oldData.shoppingListItems.filter(i => i.id !== removedItemId) };
            });
        },
        onError: (err) => addToast({ message: `Failed to remove item: ${err.message}`, type: 'error' }),
    });

    const clearCheckedListItems = useMutation({
        mutationFn: async (listId: string) => {
            const { error } = await supabase.from('shopping_list_items').delete().eq('list_id', listId).eq('checked', true);
            if (error) throw error;
            return listId;
        },
        onSuccess: (listId) => {
             queryClient.setQueryData<AllUserData>(queryKeys.userData(userId), (oldData) => {
                if (!oldData) return;
                return { ...oldData, shoppingListItems: oldData.shoppingListItems.filter(i => !(i.list_id === listId && i.checked)) };
            });
        },
        onError: (err) => addToast({ message: `Failed to clear items: ${err.message}`, type: 'error' }),
    });


    const toggleLike = useMutation({
        mutationFn: async ({ foodItemId, userId }: { foodItemId: string; userId: string }) => {
            const { data } = await supabase.from('likes').select('id').eq('food_item_id', foodItemId).eq('user_id', userId).single();
            if (data) {
                const { error: deleteError } = await supabase.from('likes').delete().eq('id', data.id);
                if (deleteError) throw deleteError;
                return { liked: false, likeId: data.id };
            } else {
                const { data: newLike, error: insertError } = await supabase.from('likes').insert({ food_item_id: foodItemId, user_id: userId }).select().single();
                if (insertError) throw insertError;
                return { liked: true, newLike };
            }
        },
        onMutate: async ({ foodItemId, userId }) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.publicData() });
            const previousData = queryClient.getQueryData<PublicData>(queryKeys.publicData());
            if (previousData) {
                const existingLike = previousData.likes.find(l => l.food_item_id === foodItemId && l.user_id === userId);
                const newLikes = existingLike
                    ? previousData.likes.filter(l => l.id !== existingLike.id)
                    : [...previousData.likes, { id: `optimistic-${Date.now()}`, food_item_id: foodItemId, user_id: userId, created_at: new Date().toISOString() }];
                queryClient.setQueryData<PublicData>(queryKeys.publicData(), { ...previousData, likes: newLikes });
            }
            return { previousData };
        },
        onSuccess: (result, variables) => {
             queryClient.invalidateQueries({ queryKey: queryKeys.publicData() });
        },
        onError: (err, _vars, context) => {
            if (context?.previousData) queryClient.setQueryData(queryKeys.publicData(), context.previousData);
            addToast({ message: `Action failed: ${err.message}`, type: 'error' });
        },
    });

    const addComment = useMutation({
        mutationFn: async ({ foodItemId, content, userId }: { foodItemId: string; content: string, userId: string }): Promise<CommentWithProfile> => {
            const { data, error } = await supabase.from('comments').insert({ food_item_id: foodItemId, content, user_id: userId }).select('*, profiles(display_name)').single();
            if (error) throw error;
            return data as CommentWithProfile;
        },
        onSuccess: (newComment) => {
             queryClient.setQueryData<PublicData>(queryKeys.publicData(), (oldData) => {
                if (!oldData) return;
                return { ...oldData, comments: [...oldData.comments, newComment] };
            });
        },
        onError: (err) => addToast({ message: `Failed to comment: ${err.message}`, type: 'error' }),
    });
    
    const deleteComment = useMutation({
        mutationFn: async (commentId: string) => {
            const { error } = await supabase.from('comments').delete().eq('id', commentId);
            if (error) throw error;
            return commentId;
        },
         onSuccess: (deletedCommentId) => {
             queryClient.setQueryData<PublicData>(queryKeys.publicData(), (oldData) => {
                if (!oldData) return;
                return { ...oldData, comments: oldData.comments.filter(c => c.id !== deletedCommentId) };
            });
        },
        onError: (err) => addToast({ message: `Failed to delete comment: ${err.message}`, type: 'error' }),
    });


    return {
        // Data
        foodItems, publicItems, likes, comments, shoppingLists,
        shoppingListMembers, allProfiles, activeShoppingListData,
        setActiveListId,
        // Loading States
        isInitialLoading, isPublicLoading,
        // Mutations
        addFoodItem, updateFoodItem, deleteFoodItem, addShoppingList,
        deleteShoppingList, leaveShoppingList, toggleListItemChecked,
        removeListItem, clearCheckedListItems, toggleLike, addComment,
        deleteComment,
    };
};