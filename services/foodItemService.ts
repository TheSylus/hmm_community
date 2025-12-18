
import { supabase } from './supabaseClient';
import { FoodItem, NutriScore, FoodItemType, GroceryCategory } from '../types';

// Define the exact shape of the database table to ensure type safety
interface FoodItemDbPayload {
  user_id: string;
  name: string;
  rating: number;
  notes?: string;
  image_url?: string;
  tags?: string[];
  item_type: FoodItemType;
  category?: GroceryCategory;
  is_family_favorite: boolean;
  nutri_score?: NutriScore | null;
  calories?: number | null;
  ingredients?: string[];
  allergens?: string[];
  is_lactose_free: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  purchase_location?: string[];
  restaurant_name?: string;
  cuisine_type?: string;
  price?: number;
}

// --- Mappers ---

export const mapDbToFoodItem = (dbItem: any): FoodItem => {
  let locations: string[] = [];
  if (Array.isArray(dbItem.purchase_location)) {
    locations = dbItem.purchase_location;
  } else if (typeof dbItem.purchase_location === 'string' && dbItem.purchase_location.trim() !== '') {
    let raw = dbItem.purchase_location;
    if (raw.startsWith('[') && raw.endsWith(']')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) locations = parsed.map(String);
      } catch (e) {}
    }
    if (locations.length === 0) {
        if (raw.startsWith('{') && raw.endsWith('}')) raw = raw.slice(1, -1);
        locations = raw.split(',').map((l: string) => l.trim()).filter(Boolean);
    }
  }

  return {
    id: dbItem.id,
    user_id: dbItem.user_id,
    created_at: dbItem.created_at,
    name: dbItem.name,
    rating: dbItem.rating,
    notes: dbItem.notes,
    image: dbItem.image_url,
    tags: dbItem.tags,
    itemType: dbItem.item_type,
    category: dbItem.category || 'other',
    isFamilyFavorite: dbItem.is_family_favorite,
    nutriScore: dbItem.nutri_score,
    calories: dbItem.calories,
    ingredients: dbItem.ingredients,
    allergens: dbItem.allergens,
    isLactoseFree: dbItem.is_lactose_free,
    isVegan: dbItem.is_vegan,
    isGlutenFree: dbItem.is_gluten_free,
    purchaseLocation: locations,
    restaurantName: dbItem.restaurant_name,
    cuisineType: dbItem.cuisine_type,
    price: dbItem.price,
  } as FoodItem;
};

export const mapFoodItemToDbPayload = (item: Omit<FoodItem, 'id' | 'user_id' | 'created_at'> & { user_id: string, image_url?: string }): FoodItemDbPayload => {
  return {
    user_id: item.user_id,
    name: item.name,
    rating: item.rating,
    notes: item.notes,
    image_url: item.image_url || item.image,
    tags: item.tags,
    item_type: item.itemType,
    category: item.category || 'other',
    is_family_favorite: item.isFamilyFavorite || false,
    nutri_score: item.nutriScore || null,
    calories: item.calories || null,
    ingredients: item.ingredients,
    allergens: item.allergens,
    is_lactose_free: item.isLactoseFree || false,
    is_vegan: item.isVegan || false,
    is_gluten_free: item.isGlutenFree || false,
    purchase_location: item.purchaseLocation,
    restaurant_name: item.restaurantName,
    cuisine_type: item.cuisineType,
    price: item.price,
  };
};

// --- API Operations ---

export const fetchUserFoodItems = async (userId: string) => {
  const { data, error } = await supabase
    .from('food_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapDbToFoodItem);
};

export const fetchFamilyFavorites = async () => {
    const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .eq('is_family_favorite', true);
    
    if (error) throw error;
    return (data || []).map(mapDbToFoodItem);
};

export const createFoodItem = async (item: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>, userId: string, imageUrl?: string) => {
  const payload = mapFoodItemToDbPayload({ ...item, user_id: userId, image_url: imageUrl });
  
  const { data, error } = await supabase
    .from('food_items')
    .insert(payload)
    .select()
    .single();

  if (error) {
      console.warn("Cascade retry for single item:", error.message);
      const { calories, ...payloadNoCalories } = payload;
      const { data: r1, error: e1 } = await supabase.from('food_items').insert(payloadNoCalories).select().single();
      if (!e1) return mapDbToFoodItem(r1);

      const { category, ...payloadLegacy } = payloadNoCalories;
      const { data: r2, error: e2 } = await supabase.from('food_items').insert(payloadLegacy).select().single();
      if (!e2) return mapDbToFoodItem(r2);
      throw error;
  }
  return mapDbToFoodItem(data);
};

/**
 * Enhanced Bulk Import with Multi-Stage Recovery Strategy
 */
export const createFoodItemsBulk = async (items: (Omit<FoodItem, 'id' | 'user_id' | 'created_at'>)[], userId: string): Promise<FoodItem[]> => {
    if (items.length === 0) return [];

    const basePayloads = items.map(item => mapFoodItemToDbPayload({ ...item, user_id: userId }));

    // Helper for batch attempts
    const attemptBatch = async (payloads: any[]) => {
        const { data, error } = await supabase.from('food_items').insert(payloads).select();
        return { data, error };
    };

    // Stage 1: Full Batch
    let result = await attemptBatch(basePayloads);
    if (!result.error) return (result.data || []).map(mapDbToFoodItem);

    console.warn("Bulk import Stage 1 failed, trying without 'calories'...", result.error.message);

    // Stage 2: Remove 'calories'
    const payloadsNoCalories = basePayloads.map(({ calories, ...rest }) => rest);
    result = await attemptBatch(payloadsNoCalories);
    if (!result.error) return (result.data || []).map(mapDbToFoodItem);

    console.warn("Bulk import Stage 2 failed, trying without 'category'...", result.error.message);

    // Stage 3: Remove 'calories' AND 'category'
    const payloadsLegacy = payloadsNoCalories.map(({ category, ...rest }) => rest);
    result = await attemptBatch(payloadsLegacy);
    if (!result.error) return (result.data || []).map(mapDbToFoodItem);

    // Stage 4: Nuclear Option - Individual Inserts (Slow but guaranteed to save what's possible)
    console.warn("Bulk import Stage 3 failed. Switching to individual resilient inserts...");
    const savedItems: FoodItem[] = [];
    for (const item of items) {
        try {
            const saved = await createFoodItem(item, userId);
            savedItems.push(saved);
        } catch (e) {
            console.error("Failed to save individual item during bulk fallback:", item.name, e);
        }
    }

    if (savedItems.length === 0) throw new Error("Mass import failed completely. Check database connection and schema.");
    return savedItems;
};

export const updateFoodItem = async (id: string, item: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>, userId: string, imageUrl?: string) => {
  const payload = mapFoodItemToDbPayload({ ...item, user_id: userId, image_url: imageUrl });
  
  const { data, error } = await supabase.from('food_items').update(payload).eq('id', id).select().single();

  if (error) {
      console.warn("Cascade retry for update:", error.message);
      const { calories, ...p1 } = payload;
      const { data: r1, error: e1 } = await supabase.from('food_items').update(p1).eq('id', id).select().single();
      if (!e1) return mapDbToFoodItem(r1);

      const { category, ...p2 } = p1;
      const { data: r2, error: e2 } = await supabase.from('food_items').update(p2).eq('id', id).select().single();
      if (!e2) return mapDbToFoodItem(r2);
      throw error;
  }
  return mapDbToFoodItem(data);
};

export const deleteFoodItem = async (id: string) => {
  const { error } = await supabase.from('food_items').delete().eq('id', id);
  if (error) throw error;
};
