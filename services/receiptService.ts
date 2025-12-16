
import { supabase } from './supabaseClient';
import { Receipt, ReceiptItem } from '../types';

// Map AI Output to DB Payload
const mapReceiptToDbPayload = (receipt: Partial<Receipt>, userId: string, householdId?: string) => {
    return {
        uploader_id: userId,
        household_id: householdId || null,
        merchant_name: receipt.merchant_name || 'Unknown Store', // Fallback
        date: receipt.date || new Date().toISOString(),
        total_amount: typeof receipt.total_amount === 'number' ? receipt.total_amount : 0, // Ensure number
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
        throw new Error(`Receipt Header Save Failed: ${receiptError.message}`);
    }

    if (!receipt) return null;

    // 2. Prepare Items with strict sanitization
    // Database strictly expects numbers for price/qty, usually NOT NULL.
    const itemsPayload = receiptData.items.map(item => {
        const safePrice = typeof item.price === 'number' ? item.price : 0;
        const safeQty = typeof item.quantity === 'number' ? item.quantity : 1;
        
        return {
            receipt_id: receipt.id,
            raw_name: item.raw_name || 'Unknown Item',
            category: item.category || 'other',
            price: safePrice,
            quantity: safeQty,
            total_price: safePrice * safeQty
        };
    });

    // 3. Save Items
    if (itemsPayload.length > 0) {
        const { error: itemsError } = await supabase
            .from('receipt_items')
            .insert(itemsPayload);

        if (itemsError) {
            console.error("Error saving receipt items:", itemsError);
            // We generally don't delete the receipt header if items fail, 
            // but in a strict transaction we would. Supabase client doesn't support easy transactions yet.
            throw new Error(`Receipt Items Save Failed: ${itemsError.message}`);
        }
    }

    return { ...receipt, items: itemsPayload };
};

export const updateReceipt = async (
    receiptId: string, 
    updates: Partial<Receipt>
): Promise<Receipt> => {
    // Only allow updating specific header fields to maintain data integrity
    const safeUpdates = {
        merchant_name: updates.merchant_name,
        date: updates.date,
        total_amount: updates.total_amount,
        currency: updates.currency
    };

    const { data, error } = await supabase
        .from('receipts')
        .update(safeUpdates)
        .eq('id', receiptId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteReceipt = async (receiptId: string): Promise<void> => {
    const { error } = await supabase
        .from('receipts')
        .delete()
        .eq('id', receiptId);

    if (error) throw error;
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
