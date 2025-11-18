import { supabase } from './supabaseClient';
import { FoodItem } from '../types';

// --- Mappers ---

/**
 * Konvertiert ein Datenbank-Objekt (Snake Case) in das Frontend-Format (Camel Case).
 */
export const mapDbToFoodItem = (dbItem: any): FoodItem => {
  // Destructuring handles removing fields we don't map explicitly if needed,
  // though here we map explicitly to ensure type safety.
  return {
    id: dbItem.id,
    user_id: dbItem.user_id,
    created_at: dbItem.created_at,
    name: dbItem.name,
    rating: dbItem.rating,
    notes: dbItem.notes,
    image: dbItem.image_url, // DB: image_url -> Frontend: image
    tags: dbItem.tags,
    itemType: dbItem.item_type, // DB: item_type -> Frontend: itemType
    isFamilyFavorite: dbItem.is_family_favorite, // DB: is_family_favorite

    // Product specific
    nutriScore: dbItem.nutri_score, // FIX: Explicit mapping for the bug
    ingredients: dbItem.ingredients,
    allergens: dbItem.allergens,
    isLactoseFree: dbItem.is_lactose_free,
    isVegan: dbItem.is_vegan,
    isGlutenFree: dbItem.is_gluten_free,
    purchaseLocation: dbItem.purchase_location,

    // Dish specific
    restaurantName: dbItem.restaurant_name,
    cuisineType: dbItem.cuisine_type,
    price: dbItem.price,
  } as FoodItem;
};

/**
 * Konvertiert das Frontend-Objekt in das Datenbank-Format.
 * Hier wird sichergestellt, dass 'nutriScore' als 'nutri_score' gesendet wird.
 */
export const mapFoodItemToDbPayload = (item: Omit<FoodItem, 'id' | 'user_id' | 'created_at'> & { user_id: string, image_url?: string }) => {
  return {
    user_id: item.user_id,
    name: item.name,
    rating: item.rating,
    notes: item.notes,
    image_url: item.image_url || item.image, // Prioritize explict image_url if passed (e.g. after upload)
    tags: item.tags,
    item_type: item.itemType,
    is_family_favorite: item.isFamilyFavorite || false,

    // Product specific mappings
    nutri_score: item.nutriScore || null, // FIX: The core fix. Frontend 'nutriScore' -> DB 'nutri_score'
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

  if (error) throw error;
  return mapDbToFoodItem(data);
};

export const updateFoodItem = async (id: string, item: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>, userId: string, imageUrl?: string) => {
  const payload = mapFoodItemToDbPayload({ ...item, user_id: userId, image_url: imageUrl });
  
  const { data, error } = await supabase
    .from('food_items')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapDbToFoodItem(data);
};

export const deleteFoodItem = async (id: string) => {
  const { error } = await supabase
    .from('food_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
