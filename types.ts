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

export interface ShoppingListItem {
  id: string; // The unique ID of the shopping list entry itself
  user_id: string;
  food_item_id: string; // Foreign key to the FoodItem
  checked: boolean;
  created_at: string;
}