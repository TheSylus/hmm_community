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
  shared_with_list_id?: string | null; // For sharing with a specific group

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

// Represents a distinct group for sharing food items and shopping lists.
// FIX: Renamed FoodGroup to ShoppingList for consistency.
export interface ShoppingList {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
}

// Represents an item on a specific group's shopping list.
// FIX: Renamed GroupShoppingListItem to ShoppingListItem for consistency.
export interface ShoppingListItem {
  id: string;
  // FIX: Renamed group_id to list_id for consistency.
  list_id: string; // Foreign key to the ShoppingList
  food_item_id: string; // Foreign key to the FoodItem
  added_by_user_id: string;
  checked: boolean;
  created_at: string;
  checked_by_user_id: string | null;
}

// Represents a user's membership to a group.
// FIX: Renamed FoodGroupMember to ShoppingListMember for consistency.
export interface ShoppingListMember {
  // FIX: Renamed group_id to list_id for consistency.
  list_id: string; // Corresponds to ShoppingList ID
  user_id: string;
  created_at: string;
}

// Represents a user's public profile information.
export interface UserProfile {
  id: string; // Corresponds to auth.users.id
  display_name: string;
}

// Represents a "like" on a food item.
export interface Like {
  id: string;
  user_id: string;
  food_item_id: string;
  created_at: string;
}

// Represents a comment on a food item.
export interface Comment {
  id: string;
  user_id: string;
  food_item_id: string;
  content: string;
  created_at: string;
}

// Represents a comment joined with the author's profile.
export interface CommentWithProfile extends Comment {
  profiles: {
    display_name: string;
  } | null;
}

// Search and filter types, moved from App.tsx
export type SortKey = 'date_desc' | 'date_asc' | 'rating_desc' | 'rating_asc' | 'name_asc' | 'name_desc';
export type RatingFilter = 'all' | 'liked' | 'disliked';
export type TypeFilter = 'all' | 'product' | 'dish';

// A hydrated type for items on the shopping list, combining FoodItem and ShoppingListItem details.
export interface HydratedShoppingListItem extends FoodItem {
  shoppingListItemId: string;
  checked: boolean;
  added_by_user_id: string;
  checked_by_user_id: string | null;
}
