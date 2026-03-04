
import { supabase } from './supabaseClient';

export type MutationType = 
    | 'FOOD_ITEM_SAVE' 
    | 'FOOD_ITEM_DELETE' 
    | 'SHOPPING_LIST_ITEM_ADD' 
    | 'SHOPPING_LIST_ITEM_UPDATE' 
    | 'SHOPPING_LIST_ITEM_DELETE'
    | 'SHOPPING_LIST_CREATE'
    | 'SHOPPING_LIST_DELETE';

export interface PendingMutation {
    id: string;
    type: MutationType;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any;
    timestamp: number;
}

const QUEUE_KEY = 'offline_mutation_queue';

export const getQueue = (): PendingMutation[] => {
    const saved = localStorage.getItem(QUEUE_KEY);
    return saved ? JSON.parse(saved) : [];
};

export const saveQueue = (queue: PendingMutation[]) => {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const addMutation = (type: MutationType, payload: any) => {
    const queue = getQueue();
    const newMutation: PendingMutation = {
        id: Math.random().toString(36).substring(2, 9),
        type,
        payload,
        timestamp: Date.now(),
    };
    queue.push(newMutation);
    saveQueue(queue);
    console.log(`Offline mutation added: ${type}`, payload);
};

export const processQueue = async () => {
    const queue = getQueue();
    if (queue.length === 0) return;

    console.log(`Processing ${queue.length} offline mutations...`);
    
    // Process sequentially to maintain order
    for (const mutation of [...queue]) {
        try {
            await executeMutation(mutation);
            // Remove from queue if successful
            const currentQueue = getQueue();
            const updatedQueue = currentQueue.filter(m => m.id !== mutation.id);
            saveQueue(updatedQueue);
        } catch (error) {
            console.error(`Failed to process mutation ${mutation.id}:`, error);
            // If it's a permanent error (e.g. 404), we might want to remove it anyway
            // For now, we stop processing to avoid out-of-order execution issues
            break; 
        }
    }
};

const executeMutation = async (mutation: PendingMutation) => {
    const { type, payload } = mutation;

    switch (type) {
        case 'FOOD_ITEM_SAVE': {
            const { existingId, itemData, userId, imageUrl } = payload;
            if (existingId) {
                const { error } = await supabase.from('food_items').update({ ...itemData, image: imageUrl }).eq('id', existingId).eq('user_id', userId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('food_items').insert({ ...itemData, user_id: userId, image: imageUrl });
                if (error) throw error;
            }
            break;
        }
        case 'FOOD_ITEM_DELETE': {
            const { id } = payload;
            const { error } = await supabase.from('food_items').delete().eq('id', id);
            if (error) throw error;
            break;
        }
        case 'SHOPPING_LIST_ITEM_ADD': {
            const { foodItemId, listId, userId, quantity } = payload;
            const { error } = await supabase.from('shopping_list_items').insert({
                food_item_id: foodItemId,
                list_id: listId,
                added_by_user_id: userId,
                quantity
            });
            if (error) throw error;
            break;
        }
        case 'SHOPPING_LIST_ITEM_UPDATE': {
            const { id, updates } = payload;
            const { error } = await supabase.from('shopping_list_items').update(updates).eq('id', id);
            if (error) throw error;
            break;
        }
        case 'SHOPPING_LIST_ITEM_DELETE': {
            const { id } = payload;
            const { error } = await supabase.from('shopping_list_items').delete().eq('id', id);
            if (error) throw error;
            break;
        }
        case 'SHOPPING_LIST_CREATE': {
            const { name, householdId } = payload;
            const { error } = await supabase.from('shopping_lists').insert({ name, household_id: householdId });
            if (error) throw error;
            break;
        }
        case 'SHOPPING_LIST_DELETE': {
            const { id } = payload;
            const { error } = await supabase.from('shopping_lists').delete().eq('id', id);
            if (error) throw error;
            break;
        }
        default:
            console.warn(`Unknown mutation type: ${type}`);
    }
};
