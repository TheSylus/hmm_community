
import { supabase } from './supabaseClient';

export interface PricePoint {
    date: string;
    price: number;
    merchant: string;
}

/**
 * Calculates a simple overlap score between two strings based on word matches.
 */
const calculateOverlapScore = (str1: string, str2: string): number => {
    const words1 = str1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const words2 = str2.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    if (words1.length === 0) return 0;
    
    const matches = words1.filter(word => words2.some(w2 => w2.includes(word) || word.includes(w2)));
    return matches.length / words1.length;
};

export const fetchPriceHistory = async (itemName: string, userId: string): Promise<PricePoint[]> => {
    if (!itemName) return [];

    // 1. Identify significant words and pick an anchor
    // We ignore very common or generic terms as anchors
    const ignoredAnchors = new Set(['bio', 'original', 'frisch', 'natur', 'aus', 'mit', 'ohne', 'ja!', 'rewe', 'edeka', 'lidl', 'aldi']);
    const words = itemName.split(/\s+/).filter(w => w.length > 2);
    
    // Sort by length (descending) to find the most specific word, but skip ignored anchors if possible
    const sortedWords = [...words].sort((a, b) => b.length - a.length);
    const anchor = sortedWords.find(w => !ignoredAnchors.has(w.toLowerCase())) || sortedWords[0];

    if (!anchor || anchor.length < 3) return [];

    // 2. Query database using the anchor word
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
        .ilike('raw_name', `%${anchor}%`)
        .order('receipts(date)', { ascending: true });

    if (error) {
        console.error("Error fetching price history:", error);
        return [];
    }

    if (!data) return [];

    // 3. Post-Process: Weighted Filtering
    // We filter the database results locally to ensure they actually match the product
    const history: PricePoint[] = data
        .filter((item: any) => {
            // Ignore items with zero price (likely discounts or errors)
            if (item.price <= 0) return false;
            
            // Calculate how well the receipt text matches our inventory item name
            const score = calculateOverlapScore(itemName, item.raw_name);
            
            // Threshold: At least 60% of significant words must match
            // or the receipt item must be very similar to the anchor
            return score >= 0.6;
        })
        .map((item: any) => ({
            date: item.receipts.date,
            price: item.price,
            merchant: item.receipts.merchant_name
        }));

    // Deduplicate: If multiple items match on the same day (e.g. bought 2 packs separately),
    // we take the average or the last one.
    const uniqueDays = new Map<string, PricePoint>();
    history.forEach(point => {
        const day = point.date.split('T')[0];
        uniqueDays.set(day, point); // Last one wins
    });

    return Array.from(uniqueDays.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );
};
