export type NutriScore = 'A' | 'B' | 'C' | 'D' | 'E';

export type FoodItemType = 'product' | 'dish';

export interface FoodItem {
  id: string;
  user_id: string;
  created_at: string;
  name: string;
  rating: number; // 0 for unrated, 1-5 for star rating
  itemType: FoodItemType;
  isFamilyFavorite?: boolean; // Replaces isPublic for household sharing

  // Common fields
  notes?: string;
  image?: string; // URL to the image in cloud storage
  tags?: string[];

  // Product-specific fields
  nutriScore?: NutriScore;
  ingredients?: string[];
  allergens?: string[];
  isLactoseFree?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  purchaseLocation?: string; // e.g., "Lidl", "Whole Foods"
  
  // Dish-specific fields
  restaurantName?: string;
  cuisineType?: string;
  price?: number;
}

// Represents a household that users can join.
export interface Household {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

// Represents a distinct shopping list, belonging to a household.
export interface ShoppingList {
  id: string;
  household_id: string;
  name: string;
  created_at: string;
}

// Represents an item on a specific shopping list.
export interface ShoppingListItem {
  id: string;
  list_id: string; // Foreign key to the ShoppingList
  food_item_id: string; // Foreign key to the FoodItem
  added_by_user_id: string;
  checked: boolean;
  created_at: string;
  checked_by_user_id: string | null;
}

// Represents a user's public profile information.
export interface UserProfile {
  id: string; // Corresponds to auth.users.id
  display_name: string;
  household_id?: string | null;
}

// FIX: Add Like and Comment types for the Discover view.
// Represents a "like" on a food item by a user.
export interface Like {
  id: string;
  user_id: string;
  food_item_id: string;
  created_at: string;
}

// Represents a comment on a food item by a user.
export interface Comment {
  id: string;
  user_id: string;
  food_item_id: string;
  comment: string;
  created_at: string;
}
