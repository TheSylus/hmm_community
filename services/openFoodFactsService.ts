
import { FoodItem } from '../types';

const FOOD_API_URL = 'https://world.openfoodfacts.org/api/v2';
const BEAUTY_API_URL = 'https://world.openbeautyfacts.org/api/v2';

export interface OpenFoodFactsResult extends Partial<FoodItem> {
    ingredientsImage?: string;
}

// Helper to fetch an image and convert it to Base64
const imageUrlToBase64 = async (url: string): Promise<string> => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error converting image URL to Base64:", error);
        throw new Error("Could not load product image.");
    }
};

const fetchFromApi = async (baseUrl: string, barcode: string): Promise<any> => {
    const url = `${baseUrl}/product/${barcode}.json`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Product not found in database.`);
    }
    const data = await response.json();
    if (data.status === 0 || !data.product) {
        throw new Error(data.status_verbose || 'Product not found.');
    }
    return data.product;
};

const cleanIngredient = (text: string): string => {
    return text
        .replace(/_/g, '')
        .replace(/\*/g, '')
        .replace(/^[-\s]+/, '') // Remove leading dashes
        .trim();
};

const isGarbageText = (text: string): boolean => {
    if (!text) return true;
    const t = text.trim();
    // Common OCR garbage headers starting with OBD or similar patterns
    if (/^OBD/i.test(t)) return true;
    // Mostly numbers (e.g. "999 999 123" or "266963207")
    if (/^[\d\s]+$/.test(t)) return true;
    // Contains "mb" at the end often with numbers (from user example)
    if (/^\d+.*mb$/i.test(t)) return true;
    // Single "word" that is too long and alphanumeric (likely a misread barcode or ID), unless it contains spaces
    if (t.indexOf(' ') === -1 && t.length > 15 && /\d/.test(t)) return true;
    // Very short garbage
    if (t.length < 2) return true;
    
    return false;
};

const parseIngredients = (product: any): string[] => {
    let ingredients: string[] = [];

    // 1. Priority: Structured ingredients array. 
    // This is pre-parsed by OpenFoodFacts and usually free of OCR errors, BUT sometimes OCR errors sneak in here too.
    if (product.ingredients && Array.isArray(product.ingredients) && product.ingredients.length > 0) {
        ingredients = product.ingredients.map((ing: any) => {
            let text = '';
            if (ing.text) {
                text = cleanIngredient(ing.text);
            } else if (ing.id) {
                // Fallback to ID if text is missing (e.g. "en:sugar" -> "sugar")
                text = ing.id.substring(ing.id.indexOf(':') + 1).replace(/-/g, ' ');
            }
            return text;
        }).filter((i: string) => !isGarbageText(i));
    }

    // 2. Fallback: Localized text (if structured array was empty or filtered out as garbage)
    if (ingredients.length === 0) {
        // Try languages in order of preference
        const rawText = product.ingredients_text_de || product.ingredients_text_en || product.ingredients_text;

        if (rawText) {
            // Remove common prefixes like "Ingredients:" or "Zutaten:" case insensitive to get to the real content
            // Also handles "Zutaten: OBD..." scenario
            let cleanText = rawText.replace(/^(ingredients|zutaten|inhaltsstoffe)(\s*:\s*)?/i, '').trim();
            
            // Check the *entire* remaining block. If it looks like one giant error code, reject it.
            if (!isGarbageText(cleanText)) {
                // Split by common separators if it's a list
                ingredients = cleanText.split(/,\s*|\s-\s/).map(cleanIngredient).filter((i: string) => !isGarbageText(i));
            }
        }
    }

    return ingredients;
};

export const fetchProductFromOpenFoodFacts = async (barcode: string): Promise<OpenFoodFactsResult> => {
    try {
        // Try Food Facts first
        let product;
        let isFood = true;
        try {
            product = await fetchFromApi(FOOD_API_URL, barcode);
        } catch (e) {
            // If not found, try Beauty Facts
            try {
                product = await fetchFromApi(BEAUTY_API_URL, barcode);
                isFood = false;
            } catch (beautyError) {
                throw new Error('Product not found in Food or Beauty database.');
            }
        }

        const foodItem: OpenFoodFactsResult = {};
        foodItem.itemType = isFood ? 'product' : 'drugstore';

        if (product.product_name) {
            foodItem.name = product.product_name;
        }

        if (product.image_front_url) {
            foodItem.image = await imageUrlToBase64(product.image_front_url);
        }

        if (isFood && product.nutriscore_grade) {
            const score = product.nutriscore_grade.toUpperCase();
            if (['A', 'B', 'C', 'D', 'E'].includes(score)) {
                foodItem.nutriScore = score as FoodItem['nutriScore'];
            }
        }
        
        // Parse Ingredients
        foodItem.ingredients = parseIngredients(product);

        // Fetch Ingredients Image for AI Fallback if text parsing failed
        if (product.image_ingredients_url) {
            try {
                foodItem.ingredientsImage = await imageUrlToBase64(product.image_ingredients_url);
            } catch (e) {
                console.warn("Failed to load ingredients image for fallback", e);
            }
        }

        if (product.allergens_tags && Array.isArray(product.allergens_tags)) {
            foodItem.allergens = product.allergens_tags.map((tag: string) => tag.substring(tag.indexOf(':') + 1).replace(/-/g, ' '));
        }
        
        if (product.categories_tags && Array.isArray(product.categories_tags)) {
             foodItem.tags = product.categories_tags.map((tag: string) => tag.substring(tag.indexOf(':') + 1).replace(/-/g, ' '));
        }

        if (product.stores) {
            foodItem.purchaseLocation = product.stores.split(',').map((s: string) => s.trim()).filter(Boolean);
        }

        // Check labels
        if (product.labels_tags && Array.isArray(product.labels_tags)) {
            const labels = product.labels_tags.join(' ').toLowerCase();
            foodItem.isVegan = labels.includes('vegan');
            foodItem.isGlutenFree = labels.includes('gluten-free');
            
            if (isFood) {
                if (labels.includes('lactose-free')) {
                    foodItem.isLactoseFree = true;
                } else if (foodItem.allergens) {
                    const dairyAllergens = ['milk', 'lactose', 'dairy'];
                    foodItem.isLactoseFree = !foodItem.allergens.some(allergen => 
                        dairyAllergens.some(dairy => allergen.toLowerCase().includes(dairy))
                    );
                }
            }
        }

        return foodItem;

    } catch (error) {
        console.error("Error fetching from Open Facts API:", error);
        throw error;
    }
};

export const searchProductByNameFromOpenFoodFacts = async (productName: string): Promise<OpenFoodFactsResult> => {
    // Search usually defaults to Food Facts for broad searches, as Beauty search is less reliable via simple text
    // Added localized ingredient text fields and image_ingredients_url to request
    const searchUrl = `${FOOD_API_URL}/search?search_terms=${encodeURIComponent(productName)}&fields=product_name,nutriscore_grade,ingredients_text,ingredients_text_de,ingredients_text_en,ingredients,allergens_tags,categories_tags,labels_tags,stores,image_ingredients_url&page_size=1&sort_by=popularity_key`;
    
    try {
        const response = await fetch(searchUrl);
        if (!response.ok) throw new Error('Failed to search Open Food Facts.');
        
        const data = await response.json();
        
        // If no food found, try beauty
        if (data.count === 0 || !data.products || data.products.length === 0) {
             const beautySearchUrl = `${BEAUTY_API_URL}/search?search_terms=${encodeURIComponent(productName)}&fields=product_name,ingredients_text,ingredients_text_de,ingredients_text_en,ingredients,categories_tags,labels_tags,stores,image_ingredients_url&page_size=1`;
             const beautyResponse = await fetch(beautySearchUrl);
             if(beautyResponse.ok) {
                 const beautyData = await beautyResponse.json();
                 if (beautyData.count > 0 && beautyData.products.length > 0) {
                     const product = beautyData.products[0];
                     
                     const beautyItem: OpenFoodFactsResult = {
                         name: product.product_name,
                         itemType: 'drugstore',
                         ingredients: parseIngredients(product),
                         tags: product.categories_tags ? product.categories_tags.map((tag: string) => tag.substring(tag.indexOf(':') + 1).replace(/-/g, ' ')) : [],
                         purchaseLocation: product.stores ? product.stores.split(',') : [],
                         isVegan: product.labels_tags ? product.labels_tags.join(' ').toLowerCase().includes('vegan') : false
                     };

                     if (product.image_ingredients_url) {
                        try {
                            beautyItem.ingredientsImage = await imageUrlToBase64(product.image_ingredients_url);
                        } catch (e) { console.warn("Failed to load beauty ingredients image", e); }
                     }
                     return beautyItem;
                 }
             }
             throw new Error(`Product "${productName}" not found.`);
        }

        const product = data.products[0];
        const foodItem: OpenFoodFactsResult = { itemType: 'product' };

        if (product.nutriscore_grade) {
            const score = product.nutriscore_grade.toUpperCase();
            if (['A', 'B', 'C', 'D', 'E'].includes(score)) {
                foodItem.nutriScore = score as FoodItem['nutriScore'];
            }
        }
        
        foodItem.ingredients = parseIngredients(product);

        if (product.image_ingredients_url) {
            try {
                foodItem.ingredientsImage = await imageUrlToBase64(product.image_ingredients_url);
            } catch (e) { console.warn("Failed to load ingredients image", e); }
        }

        if (product.allergens_tags && Array.isArray(product.allergens_tags)) {
            foodItem.allergens = product.allergens_tags.map((tag: string) => tag.substring(tag.indexOf(':') + 1).replace(/-/g, ' '));
        }
        
        if (product.categories_tags && Array.isArray(product.categories_tags)) {
             foodItem.tags = product.categories_tags.map((tag: string) => tag.substring(tag.indexOf(':') + 1).replace(/-/g, ' '));
        }
        
        if (product.stores) {
             foodItem.purchaseLocation = product.stores.split(',').map((s: string) => s.trim()).filter(Boolean);
        }

        if (product.labels_tags && Array.isArray(product.labels_tags)) {
            const labels = product.labels_tags.join(' ').toLowerCase();
            foodItem.isVegan = labels.includes('vegan');
            foodItem.isGlutenFree = labels.includes('gluten-free');
            if (labels.includes('lactose-free')) {
                foodItem.isLactoseFree = true;
            } else if (foodItem.allergens) {
                const dairyAllergens = ['milk', 'lactose', 'dairy'];
                foodItem.isLactoseFree = !foodItem.allergens.some(allergen => 
                    dairyAllergens.some(dairy => allergen.toLowerCase().includes(dairy))
                );
            } else {
                foodItem.isLactoseFree = false;
            }
        }
        
        return foodItem;

    } catch (error) {
        console.error("Error searching Open Facts by name:", error);
        throw error;
    }
};
