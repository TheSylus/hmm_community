
import { supabase } from './supabaseClient';
import { Receipt, ReceiptItem } from '../types';

// Map AI Output to DB Payload
const mapReceiptToDbPayload = (receipt: Partial<Receipt>, userId: string, householdId?: string) => {
    return {
        uploader_id: userId,
        household_id: householdId || null,
        merchant_name: receipt.merchant_name,
        date: receipt.date || new Date().toISOString(),
        total_amount: receipt.total_amount,
        currency: receipt.currency || 'EUR',
        scanned_at: new Date().toISOString(),
        // image_url handled separately after upload
    };
};

export const createReceipt = async (
    receiptData: Partial<Receipt> & { items: Partial<ReceiptItem>[] }, 
    userId: string, 
    householdId?: string,
    imageUrl?: string
): Promise<Receipt | null> => {
    
    // 1. Create Receipt Record
    const receiptPayload = {
        ...mapReceiptToDbPayload(receiptData, userId, householdId),
        image_url: imageUrl
    };

    const { data: receipt, error: receiptError } = await supabase
        .from('receipts')
        .insert(receiptPayload)
        .select()
        .single();

    if (receiptError) {
        console.error("Error saving receipt header:", receiptError);
        throw receiptError;
    }

    if (!receipt) return null;

    // 2. Prepare Items
    const itemsPayload = receiptData.items.map(item => ({
        receipt_id: receipt.id,
        raw_name: item.raw_name,
        category: item.category || 'other',
        price: item.price,
        quantity: item.quantity || 1,
        total_price: (item.price || 0) * (item.quantity || 1)
    }));

    // 3. Save Items
    const { error: itemsError } = await supabase
        .from('receipt_items')
        .insert(itemsPayload);

    if (itemsError) {
        console.error("Error saving receipt items:", itemsError);
        // We generally don't delete the receipt header if items fail, 
        // but in a strict transaction we would. Supabase client doesn't support easy transactions yet.
        throw itemsError;
    }

    return { ...receipt, items: itemsPayload };
};

export const fetchReceiptsByHousehold = async (householdId: string) => {
    const { data, error } = await supabase
        .from('receipts')
        .select(`
            *,
            items:receipt_items(*)
        `)
        .eq('household_id', householdId)
        .order('date', { ascending: false });

    if (error) throw error;
    return data;
};

export const fetchReceiptsByUser = async (userId: string) => {
    const { data, error } = await supabase
        .from('receipts')
        .select(`
            *,
            items:receipt_items(*)
        `)
        .eq('uploader_id', userId)
        .order('date', { ascending: false });

    if (error) throw error;
    return data;
};
