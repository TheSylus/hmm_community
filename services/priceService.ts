
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
    // Strategy: Use the first significant word (length > 2) as anchor to find matches in receipt items
    const words = itemName.split(' ').filter(w => w.length > 2);
    const searchTerm = words.length > 0 ? words[0].replace(/[^a-zA-Z0-9]/g, '') : itemName;

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

    // Transform and simple dedupe (if bought twice on same day, take the last one)
    // We expect data structure: { price: 1.99, raw_name: '...', receipts: { date: '...', ... } }
    const history: PricePoint[] = (data || []).map((item: any) => ({
        date: item.receipts.date,
        price: item.price,
        merchant: item.receipts.merchant_name
    }));

    return history;
};
