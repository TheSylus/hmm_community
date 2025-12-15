
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

/**
 * Konvertiert ein Datenbank-Objekt (Snake Case) in das Frontend-Format (Camel Case).
 */
export const mapDbToFoodItem = (dbItem: any): FoodItem => {
  // Handle legacy data where purchase_location might be a string
  let locations: string[] = [];
  if (Array.isArray(dbItem.purchase_location)) {
    locations = dbItem.purchase_location;
  } else if (typeof dbItem.purchase_location === 'string' && dbItem.purchase_location.trim() !== '') {
    let raw = dbItem.purchase_location;
    
    // Try to detect JSON array format (e.g. '["Lidl", "Aldi"]')
    if (raw.startsWith('[') && raw.endsWith(']')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          locations = parsed.map(String);
        }
      } catch (e) {
        // Fallback to simple split if JSON parse fails
      }
    }
    
    // Handle Postgres array string format "{A,B}" or simple comma-separated string "A,B"
    if (locations.length === 0) {
        if (raw.startsWith('{') && raw.endsWith('}')) {
            raw = raw.slice(1, -1);
        }
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
    // Provide a safe fallback if category is null in DB
    category: dbItem.category || 'other',
    isFamilyFavorite: dbItem.is_family_favorite,

    // Product specific
    nutriScore: dbItem.nutri_score,
    calories: dbItem.calories,
    ingredients: dbItem.ingredients,
    allergens: dbItem.allergens,
    isLactoseFree: dbItem.is_lactose_free,
    isVegan: dbItem.is_vegan,
    isGlutenFree: dbItem.is_gluten_free,
    purchaseLocation: locations,

    // Dish specific
    restaurantName: dbItem.restaurant_name,
    cuisineType: dbItem.cuisine_type,
    price: dbItem.price,
  } as FoodItem;
};

/**
 * Konvertiert das Frontend-Objekt in das Datenbank-Format.
 */
export const mapFoodItemToDbPayload = (item: Omit<FoodItem, 'id' | 'user_id' | 'created_at'> & { user_id: string, image_url?: string }): FoodItemDbPayload => {
  return {
    user_id: item.user_id,
    name: item.name,
    rating: item.rating,
    notes: item.notes,
    image_url: item.image_url || item.image,
    tags: item.tags,
    item_type: item.itemType,
    // Explicitly pass category, ensuring it defaults to 'other' if somehow undefined to ensure DB column is hit
    category: item.category || 'other',
    is_family_favorite: item.isFamilyFavorite || false,

    // Product specific mappings
    nutri_score: item.nutriScore || null,
    calories: item.calories || null,
    ingredients: item.ingredients,
    allergens: item.allergens,
    is_lactose_free: item.isLactoseFree || false,
    is_vegan: item.isVegan || false,
    is_gluten_free: item.isGlutenFree || false,
    purchase_location: item.purchaseLocation,

    // Dish specific mappings
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
      console.warn("Initial create failed, attempting cascade retry strategy for missing columns.", error.message);

      // RETRY STRATEGY: Cascade downwards from newest features to oldest
      
      // 1. Try removing 'calories' (Newest field)
      const { calories, ...payloadNoCalories } = payload;
      const { data: retry1Data, error: retry1Error } = await supabase
        .from('food_items')
        .insert(payloadNoCalories)
        .select()
        .single();
      
      if (!retry1Error) {
          console.log("Recovered by omitting 'calories' column.");
          return mapDbToFoodItem(retry1Data);
      }

      // 2. Try removing 'calories' AND 'category' (Oldest stable schema)
      const { category, ...payloadLegacy } = payloadNoCalories;
      const { data: retry2Data, error: retry2Error } = await supabase
        .from('food_items')
        .insert(payloadLegacy)
        .select()
        .single();

      if (!retry2Error) {
          console.log("Recovered by omitting 'calories' and 'category' columns.");
          return mapDbToFoodItem(retry2Data);
      }

      // If all fail, throw original error
      throw error;
  }
  return mapDbToFoodItem(data);
};

export const createFoodItemsBulk = async (items: (Omit<FoodItem, 'id' | 'user_id' | 'created_at'>)[], userId: string) => {
    if (items.length === 0) return [];

    const payloads = items.map(item => mapFoodItemToDbPayload({ ...item, user_id: userId }));

    const { data, error } = await supabase
        .from('food_items')
        .insert(payloads)
        .select();

    if (error) {
        console.error("Bulk create failed:", error);
        throw error;
    }
    return (data || []).map(mapDbToFoodItem);
};

export const updateFoodItem = async (id: string, item: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>, userId: string, imageUrl?: string) => {
  const payload = mapFoodItemToDbPayload({ ...item, user_id: userId, image_url: imageUrl });
  
  const { data, error } = await supabase
    .from('food_items')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
      console.warn("Initial update failed, attempting cascade retry strategy.", error.message);

      // RETRY STRATEGY: Cascade downwards
      
      // 1. Try removing 'calories' but KEEP 'category'
      const { calories, ...payloadNoCalories } = payload;
      const { data: retry1Data, error: retry1Error } = await supabase
        .from('food_items')
        .update(payloadNoCalories)
        .eq('id', id)
        .select()
        .single();
      
      if (!retry1Error) {
          console.log("Update recovered by omitting 'calories'.");
          return mapDbToFoodItem(retry1Data);
      }

      // 2. Try removing 'category' too (fallback to legacy)
      const { category, ...payloadLegacy } = payloadNoCalories;
      const { data: retry2Data, error: retry2Error } = await supabase
        .from('food_items')
        .update(payloadLegacy)
        .eq('id', id)
        .select()
        .single();

      if (!retry2Error) {
          console.log("Update recovered by omitting 'calories' and 'category'.");
          return mapDbToFoodItem(retry2Data);
      }

      throw error;
  }
  return mapDbToFoodItem(data);
};

export const deleteFoodItem = async (id: string) => {
  const { error } = await supabase
    .from('food_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
