
export type NutriScore = 'A' | 'B' | 'C' | 'D' | 'E';

export type FoodItemType = 'product' | 'dish' | 'drugstore';

export type GroceryCategory = 
  | 'produce' 
  | 'bakery' 
  | 'meat_fish' 
  | 'dairy_eggs' 
  | 'pantry' 
  | 'frozen' 
  | 'snacks' 
  | 'beverages' 
  | 'household' 
  | 'personal_care' 
  | 'restaurant_food'
  | 'other';

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
  category?: GroceryCategory; // New field for supermarket sorting

  // Product-specific fields
  nutriScore?: NutriScore;
  calories?: number; // Energy in kcal per 100g/100ml or per serving
  ingredients?: string[];
  allergens?: string[];
  isLactoseFree?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  purchaseLocation?: string[]; // e.g., ["Lidl", "Whole Foods"]
  
  // Dish-specific fields
  restaurantName?: string;
  cuisineType?: string;
  price?: number; // Current/Latest known price
}

// Represents a household that users can join.
export interface Household {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  saved_shops?: string[]; // Stores the preferred shops for this household
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
  quantity: number; // The number of this item to buy
}

// Represents a user's public profile information.
export interface UserProfile {
  id: string; // Corresponds to auth.users.id
  display_name: string;
  household_id?: string | null;
}

// --- New Finance & Receipt Types ---

export interface Receipt {
  id: string;
  household_id?: string | null;
  uploader_id: string;
  merchant_name: string;
  date: string; // ISO Date string
  total_amount: number;
  currency: string;
  scanned_at: string;
  image_url?: string;
  items?: ReceiptItem[]; // Hydrated items
}

export interface ReceiptItem {
  id: string;
  receipt_id: string;
  food_item_id?: string | null; // Link to existing FoodItem if matched
  raw_name: string; // The name as it appears on the receipt
  category: GroceryCategory; // AI categorized
  price: number;
  quantity?: number;
  total_price?: number; // price * quantity
}
