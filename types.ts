export type NutriScore = 'A' | 'B' | 'C' | 'D' | 'E';

export type FoodItemType = 'product' | 'dish';

export interface FoodItem {
  id: string;
  user_id: string;
  created_at: string;
  name: string;
  rating: number; // 0 for unrated, 1-5 for star rating
  itemType: FoodItemType;
  isPublic?: boolean; // For community sharing

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

// Represents a distinct shopping list, e.g., "Weekly Groceries" or "Party Supplies".
export interface ShoppingList {
  id: string;
  owner_id: string;
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

// Represents a user's membership to a shopping list.
export interface ShoppingListMember {
  list_id: string;
  user_id: string;
  created_at: string;
}

// Represents a user's public profile information.
export interface UserProfile {
  id: string; // Corresponds to auth.users.id
  display_name: string;
}