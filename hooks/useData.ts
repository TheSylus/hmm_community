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
    memberships: Pick<ShoppingListMember, 'list_id' | 'user_id'>[];
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

    // --- QUERIES (Data Fetching) ---

    const { data: allData, isLoading: isInitialLoading } = useQuery<AllUserData>({
        queryKey: queryKeys.userData(userId),
        queryFn: async () => {
            if (!userId) return { foodItems: [], shoppingLists: [], shoppingListItems: [], memberships: [] };
            
            const foodItemsPromise = supabase.from('food_items').select('*').order('created_at', { ascending: false });
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
            const membershipsPromise = supabase.from('shopping_list_members').select('list_id, user_id').in('list_id', listIds);

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
             const publicItemsPromise = supabase.from('food_items').select('*').eq('isPublic', true).neq('user_id', userId || '').order('created_at', { ascending: false }).limit(50);
             const likesPromise = supabase.from('likes').select('*');
             const commentsPromise = supabase.from('comments').select(`*, profiles(display_name)`).order('created_at', { ascending: true });
             
             const [
                 { data: publicItems, error: itemsError },
                 { data: likes, error: likesError },
                 { data: comments, error: commentsError },
             ] = await Promise.all([publicItemsPromise, likesPromise, commentsPromise]);
             
             if (itemsError) throw itemsError;
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
        }
    });
    
    const shoppingListMembers = useMemo(() => {
        if (!allData?.memberships || !allProfiles) return {};
        return allData.memberships.reduce((acc, member) => {
            if (!acc[member.list_id]) acc[member.list_id] = [];
            const profile = allProfiles[member.user_id];
            if(profile) acc[member.list_id].push(profile);
            return acc;
        }, {} as Record<string, UserProfile[]>);

    }, [allData?.memberships, allProfiles]);

    // --- MUTATIONS (Data Modification) ---

    const addFoodItem = useMutation({
        mutationFn: (newItem: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) =>
            supabase.from('food_items').insert({ ...newItem, user_id: userId! }).select().single().then(res => {
                if (res.error) throw res.error;
                return res.data as FoodItem;
            }),
        onMutate: async (newItem) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.userData(userId) });
            const previousData = queryClient.getQueryData<AllUserData>(queryKeys.userData(userId));
            queryClient.setQueryData<AllUserData>(queryKeys.userData(userId), (oldData) => {
                if (!oldData) return undefined;
                const optimisticItem: FoodItem = { ...newItem, id: `temp-${Date.now()}`, user_id: userId!, created_at: new Date().toISOString(), rating: newItem.rating || 0, itemType: newItem.itemType || 'product' };
                return { ...oldData, foodItems: [optimisticItem, ...oldData.foodItems] };
            });
            return { previousData };
        },
        onSuccess: (data) => {
            addToast({ message: "Item added successfully!", type: 'success' });
            queryClient.setQueryData<AllUserData>(queryKeys.userData(userId), (oldData) => {
                if (!oldData) return oldData;
                const newItems = oldData.foodItems.filter(item => !item.id.toString().startsWith('temp-'));
                newItems.unshift(data);
                return { ...oldData, foodItems: newItems };
            });
        },
        onError: (err, newItem, context) => {
            addToast({ message: `Error: ${(err as Error).message}`, type: 'error' });
            if (context?.previousData) {
                queryClient.setQueryData(queryKeys.userData(userId), context.previousData);
            }
        },
    });

    const updateFoodItem = useMutation({
        mutationFn: (updatedItem: {id: string} & Partial<FoodItem>) => 
            supabase.from('food_items').update(updatedItem).eq('id', updatedItem.id).select().single().then(res => {
                if (res.error) throw res.error; return res.data as FoodItem;
            }),
        onMutate: async (updatedItem) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.userData(userId) });
            const previousData = queryClient.getQueryData<AllUserData>(queryKeys.userData(userId));
            queryClient.setQueryData<AllUserData>(queryKeys.userData(userId), (oldData) =>
                oldData ? { ...oldData, foodItems: oldData.foodItems.map(item => item.id === updatedItem.id ? { ...item, ...updatedItem } : item) } : oldData
            );
            return { previousData };
        },
        onSuccess: (data) => {
            addToast({ message: "Item updated successfully!", type: 'success' });
             queryClient.setQueryData<AllUserData>(queryKeys.userData(userId), (oldData) => {
                if (!oldData) return oldData;
                return { ...oldData, foodItems: oldData.foodItems.map(item => item.id === data.id ? data : item) };
            });
        },
        onError: (err, updatedItem, context) => {
            addToast({ message: `Error: ${(err as Error).message}`, type: 'error' });
            if (context?.previousData) {
                queryClient.setQueryData(queryKeys.userData(userId), context.previousData);
            }
        },
    });

    const deleteFoodItem = useMutation({
        mutationFn: (id: string) => supabase.from('food_items').delete().eq('id', id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.userData(userId) });
            const previousData = queryClient.getQueryData<AllUserData>(queryKeys.userData(userId));
            queryClient.setQueryData<AllUserData>(queryKeys.userData(userId), (oldData) =>
                oldData ? { ...oldData, foodItems: oldData.foodItems.filter(item => item.id !== id) } : oldData
            );
            return { previousData };
        },
        onSuccess: () => addToast({ message: "Item deleted.", type: 'success' }),
        onError: (err, id, context) => {
            addToast({ message: `Error: ${(err as Error).message}`, type: 'error' });
            if (context?.previousData) {
                queryClient.setQueryData(queryKeys.userData(userId), context.previousData);
            }
        },
    });
    
    const addShoppingList = useMutation({
       mutationFn: (name: string) => supabase.from('shopping_lists').insert({ name, owner_id: userId! }).select().single().then(async (res) => {
            if (res.error) throw res.error;
            const newList = res.data;
            const { error: memberError } = await supabase.from('shopping_list_members').insert({ list_id: newList.id, user_id: userId! });
            if (memberError) {
                await supabase.from('shopping_lists').delete().eq('id', newList.id);
                throw memberError;
            }
            return newList;
        }),
        onSuccess: () => {
            addToast({ message: "Group created successfully!", type: 'success' });
            queryClient.invalidateQueries({ queryKey: queryKeys.userData(userId) });
        },
        onError: (err) => addToast({ message: `Error: ${(err as Error).message}`, type: 'error' }),
    });

    const deleteShoppingList = useMutation({
        mutationFn: (id: string) => supabase.from('shopping_lists').delete().eq('id', id),
        onSuccess: () => {
            addToast({ message: "Group deleted.", type: 'success' });
            queryClient.invalidateQueries({ queryKey: queryKeys.userData(userId) });
        },
        onError: (err) => addToast({ message: `Error: ${(err as Error).message}`, type: 'error' }),
    });
    
    const leaveShoppingList = useMutation({
        mutationFn: (id: string) => supabase.from('shopping_list_members').delete().eq('list_id', id).eq('user_id', userId!),
        onSuccess: () => {
            addToast({ message: "You have left the group.", type: 'success' });
            queryClient.invalidateQueries({ queryKey: queryKeys.userData(userId) });
        },
        onError: (err) => addToast({ message: `Error: ${(err as Error).message}`, type: 'error' }),
    });

    const toggleListItemChecked = useMutation({
        mutationFn: ({id, isChecked, userId}: {id: string, isChecked: boolean, userId: string | null}) => 
            supabase.from('shopping_list_items').update({ checked: isChecked, checked_by_user_id: isChecked ? userId : null }).eq('id', id),
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.userData(userId) });
            const previousData = queryClient.getQueryData<AllUserData>(queryKeys.userData(userId));
            queryClient.setQueryData<AllUserData>(queryKeys.userData(userId), (oldData) => 
                oldData ? { ...oldData, shoppingListItems: oldData.shoppingListItems.map(item => item.id === variables.id ? {...item, checked: variables.isChecked, checked_by_user_id: variables.isChecked ? variables.userId : null} : item) } : oldData
            );
            return { previousData };
        },
        onSuccess: () => addToast({ message: "List updated.", type: 'success' }),
        onError: (err, variables, context) => {
            addToast({ message: `Error: ${(err as Error).message}`, type: 'error' });
            if (context?.previousData) {
                queryClient.setQueryData(queryKeys.userData(userId), context.previousData);
            }
        },
    });

    const removeListItem = useMutation({
        mutationFn: (id: string) => supabase.from('shopping_list_items').delete().eq('id', id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.userData(userId) });
            const previousData = queryClient.getQueryData<AllUserData>(queryKeys.userData(userId));
            queryClient.setQueryData<AllUserData>(queryKeys.userData(userId), (oldData) => 
                oldData ? { ...oldData, shoppingListItems: oldData.shoppingListItems.filter(item => item.id !== id)} : oldData
            );
            return { previousData };
        },
        onSuccess: () => addToast({ message: "Item removed from list.", type: 'success' }),
        onError: (err, id, context) => {
            addToast({ message: `Error: ${(err as Error).message}`, type: 'error' });
            if (context?.previousData) {
                queryClient.setQueryData(queryKeys.userData(userId), context.previousData);
            }
        },
    });
    
    const clearCheckedListItems = useMutation({
        mutationFn: (listId: string) => supabase.from('shopping_list_items').delete().eq('list_id', listId).eq('checked', true),
        onMutate: async (listId) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.userData(userId) });
            const previousData = queryClient.getQueryData<AllUserData>(queryKeys.userData(userId));
            queryClient.setQueryData<AllUserData>(queryKeys.userData(userId), (oldData) => 
                oldData ? { ...oldData, shoppingListItems: oldData.shoppingListItems.filter(item => !(item.list_id === listId && item.checked)) } : oldData
            );
            return { previousData };
        },
        onSuccess: () => addToast({ message: "Checked items cleared.", type: 'success' }),
        onError: (err, listId, context) => {
            addToast({ message: `Error: ${(err as Error).message}`, type: 'error' });
            if (context?.previousData) {
                queryClient.setQueryData(queryKeys.userData(userId), context.previousData);
            }
        },
    });

    const toggleLike = useMutation({
        mutationFn: async ({ foodItemId, userId }: {foodItemId: string, userId: string}) => {
            const existingLike = (publicData?.likes || []).find(l => l.food_item_id === foodItemId && l.user_id === userId);
            if (existingLike) {
                return supabase.from('likes').delete().eq('id', existingLike.id);
            } else {
                return supabase.from('likes').insert({ food_item_id: foodItemId, user_id: userId });
            }
        },
        onMutate: async ({foodItemId, userId}) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.publicData() });
            const previousData = queryClient.getQueryData<PublicData>(queryKeys.publicData());
            queryClient.setQueryData<PublicData>(queryKeys.publicData(), (oldData) => {
                if (!oldData) return oldData;
                const existingLike = oldData.likes.find(l => l.food_item_id === foodItemId && l.user_id === userId);
                const newLikes = existingLike
                    ? oldData.likes.filter(l => l.id !== existingLike.id)
                    : [...oldData.likes, { id: `temp-${Date.now()}`, food_item_id: foodItemId, user_id: userId, created_at: new Date().toISOString() }];
                return { ...oldData, likes: newLikes };
            });
            return { previousData };
        },
        onError: (err, variables, context) => {
            addToast({ message: `Error: ${(err as Error).message}`, type: 'error' });
            if (context?.previousData) {
                queryClient.setQueryData(queryKeys.publicData(), context.previousData);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.publicData() });
        }
    });

    const addComment = useMutation({
        mutationFn: ({ foodItemId, content, userId }: {foodItemId: string, content: string, userId: string}) => 
            supabase.from('comments').insert({ food_item_id: foodItemId, content, user_id: userId }).select(`*, profiles(display_name)`).single().then(res => {
                if (res.error) throw res.error;
                return res.data as CommentWithProfile;
            }),
        onMutate: async ({ foodItemId, content, userId }) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.publicData() });
            const previousData = queryClient.getQueryData<PublicData>(queryKeys.publicData());
            queryClient.setQueryData<PublicData>(queryKeys.publicData(), (oldData) => {
                if (!oldData) return oldData;
                const optimisticComment: CommentWithProfile = { 
                    id: `temp-${Date.now()}`, 
                    food_item_id: foodItemId, 
                    content, 
                    user_id: userId, 
                    created_at: new Date().toISOString(), 
                    profiles: { display_name: allProfiles[userId]?.display_name || 'You' } 
                };
                return { ...oldData, comments: [...oldData.comments, optimisticComment] };
            });
            return { previousData };
        },
        onSuccess: (data) => {
            addToast({ message: "Comment posted.", type: 'success' });
            queryClient.setQueryData<PublicData>(queryKeys.publicData(), (oldData) => {
                if (!oldData) return oldData;
                 const newComments = oldData.comments.filter(c => !c.id.toString().startsWith('temp-'));
                 newComments.push(data);
                return { ...oldData, comments: newComments };
            });
        },
        onError: (err, variables, context) => {
             addToast({ message: `Error: ${(err as Error).message}`, type: 'error' });
            if (context?.previousData) {
                queryClient.setQueryData(queryKeys.publicData(), context.previousData);
            }
        }
    });
    
    const deleteComment = useMutation({
        mutationFn: (id: string) => supabase.from('comments').delete().eq('id', id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.publicData() });
            const previousData = queryClient.getQueryData<PublicData>(queryKeys.publicData());
            queryClient.setQueryData<PublicData>(queryKeys.publicData(), (oldData) => 
                oldData ? { ...oldData, comments: oldData.comments.filter(c => c.id !== id) } : oldData
            );
            return { previousData };
        },
        onSuccess: () => addToast({ message: "Comment deleted.", type: 'success' }),
        onError: (err, id, context) => {
            addToast({ message: `Error: ${(err as Error).message}`, type: 'error' });
            if (context?.previousData) {
                queryClient.setQueryData(queryKeys.publicData(), context.previousData);
            }
        },
    });
    
     // --- Active Shopping List Data Hydration ---
    const [activeListId, setActiveListId] = useState<string | null>(null);

    const activeShoppingListData = useMemo(() => {
        if (!activeListId || !allData) return { list: null, members: [], items: [], feed: [] };

        const list = allData.shoppingLists.find(l => l.id === activeListId) || null;
        const members = shoppingListMembers[activeListId] || [];
        const itemsForList = allData.shoppingListItems.filter(i => i.list_id === activeListId);

        const hydratedItems: HydratedShoppingListItem[] = itemsForList.map(listItem => {
            const foodItemDetails = allData.foodItems.find(fi => fi.id === listItem.food_item_id);
            if (!foodItemDetails) return null;
            return {
                ...foodItemDetails,
                shoppingListItemId: listItem.id,
                checked: listItem.checked,
                added_by_user_id: listItem.added_by_user_id,
                checked_by_user_id: listItem.checked_by_user_id,
            };
        }).filter((i): i is HydratedShoppingListItem => i !== null);

        const feed = allData.foodItems.filter(fi => fi.shared_with_list_id === activeListId);

        return { list, members, items: hydratedItems, feed };
    }, [activeListId, allData, shoppingListMembers]);



    return {
        foodItems: allData?.foodItems || [],
        publicItems: publicData?.publicItems || [],
        likes: publicData?.likes || [],
        comments: publicData?.comments || [],
        shoppingLists: allData?.shoppingLists || [],
        shoppingListMembers,
        allProfiles,
        activeShoppingListData,
        setActiveListId,
        isInitialLoading,
        isPublicLoading,
        addFoodItem,
        updateFoodItem,
        deleteFoodItem,
        addShoppingList,
        deleteShoppingList,
        leaveShoppingList,
        toggleListItemChecked,
        removeListItem,
        clearCheckedListItems,
        toggleLike,
        addComment,
        deleteComment,
    };
};