// FIX: Implemented full type definitions for the application to resolve module and type errors across components.

export type FoodItemType = 'product' | 'dish';

export type NutriScore = 'A' | 'B' | 'C' | 'D' | 'E';

export interface FoodItem {
  id: string;
  user_id: string;
  created_at: string;
  name: string;
  rating: number;
  notes?: string;
  image?: string;
  tags?: string[];
  itemType: FoodItemType;
  isPublic: boolean;
  shared_with_list_id?: string | null;

  // Product-specific
  nutriScore?: NutriScore;
  purchaseLocation?: string;
  ingredients?: string[];
  allergens?: string[];
  isLactoseFree?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;

  // Dish-specific
  restaurantName?: string;
  cuisineType?: string;
  price?: number;
}

export interface ShoppingList {
  id: string;
  name:string;
  owner_id: string;
  created_at: string;
}

export interface ShoppingListItem {
    id: string;
    list_id: string;
    food_item_id: string | null; // Can be a custom item
    name: string; // Custom name if food_item_id is null
    quantity: number;
    checked: boolean;
    created_at: string;
    added_by: string;
}

// For joining shopping list items with food items
export interface HydratedShoppingListItem extends FoodItem {
    shoppingListItemId: string;
    quantity: number;
    checked: boolean;
    added_by: string;
}

export type SortKey = 'date_desc' | 'date_asc' | 'rating_desc' | 'rating_asc' | 'name_asc' | 'name_desc';
export type TypeFilter = 'all' | 'product' | 'dish';
export type RatingFilter = 'all' | 'liked' | 'disliked';

export interface UserProfile {
    id: string;
    email?: string;
}

export interface Like {
  id: number;
  food_item_id: string;
  user_id: string;
}

export interface Comment {
  id: number;
  food_item_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface CommentWithProfile extends Comment {
  profiles: UserProfile | null;
}

export interface GroupMember {
    list_id: string;
    user_id: string;
    profiles: UserProfile | null;
}
