
import { supabase } from './supabaseClient';

export interface PricePoint {
    date: string;
    price: number;
    merchant: string;
}

export const fetchPriceHistory = async (itemName: string, userId: string): Promise<PricePoint[]> => {
    if (!itemName) return [];

    // Normalize name for search (simple sanitization)
    // We look for receipt items where the raw name contains parts of the item name
    // This is a basic heuristics approach. Ideally, we would rely on linked IDs later.
    const searchTerm = itemName.split(' ')[0].replace(/[^a-zA-Z0-9]/g, ''); // Use first word as anchor

    if (searchTerm.length < 3) return [];

    const { data, error } = await supabase
        .from('receipt_items')
        .select(`
            price,
            raw_name,
            receipts!inner (
                date,
                merchant_name,
                uploader_id
            )
        `)
        .eq('receipts.uploader_id', userId)
        .ilike('raw_name', `%${searchTerm}%`)
        .order('receipts(date)', { ascending: true });

    if (error) {
        console.error("Error fetching price history:", error);
        return [];
    }

    // Transform and simple dedupe (if bought twice on same day, take average or last)
    const history: PricePoint[] = data.map((item: any) => ({
        date: item.receipts.date,
        price: item.price,
        merchant: item.receipts.merchant_name
    }));

    return history;
};
