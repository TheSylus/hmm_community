
import { z } from 'zod';

// Basic Types
export const NutriScoreSchema = z.enum(['A', 'B', 'C', 'D', 'E']);
export const FoodItemTypeSchema = z.enum(['product', 'dish', 'drugstore']);
export const GroceryCategorySchema = z.enum([
    'produce', 'bakery', 'meat_fish', 'dairy_eggs', 'pantry', 
    'frozen', 'snacks', 'beverages', 'household', 'personal_care', 
    'restaurant_food', 'other'
]);

// Bounding Box Schema (from Gemini)
export const BoundingBoxSchema = z.object({
    ymin: z.number(),
    xmin: z.number(),
    ymax: z.number(),
    xmax: z.number(),
});

// AI Analysis Response Schema
export const AiFoodAnalysisSchema = z.object({
    name: z.string().optional(),
    itemType: FoodItemTypeSchema.optional(),
    category: GroceryCategorySchema.optional(),
    tags: z.array(z.string()).optional(),
    nutriScore: z.string().optional(), // String to handle loose matching, refined later
    boundingBox: BoundingBoxSchema.optional(),
});

// AI Ingredients Response Schema
export const AiIngredientsAnalysisSchema = z.object({
    ingredients: z.array(z.string()).optional(),
    allergens: z.array(z.string()).optional(),
    isLactoseFree: z.boolean().optional(),
    isVegan: z.boolean().optional(),
    isGlutenFree: z.boolean().optional(),
});

// Receipt AI Schema
export const AiReceiptItemSchema = z.object({
    raw_name: z.string(),
    price: z.number().optional(),
    quantity: z.number().optional(),
    category: GroceryCategorySchema.optional().or(z.string().transform(() => 'other')), // Fallback
    food_item_id: z.string().optional()
});

export const AiReceiptSchema = z.object({
    merchant_name: z.string().optional(),
    date: z.string().optional(),
    total_amount: z.number().optional(),
    currency: z.string().optional(),
    items: z.array(AiReceiptItemSchema).optional()
});
