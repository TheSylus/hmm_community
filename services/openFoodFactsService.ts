
import { FoodItem } from '../types';

const FOOD_API_URL = 'https://world.openfoodfacts.org/api/v2';
const BEAUTY_API_URL = 'https://world.openbeautyfacts.org/api/v2';

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

const parseIngredients = (product: any): string[] => {
    // 1. Try localized text (German > English > Generic)
    const rawText = product.ingredients_text_de || product.ingredients_text_en || product.ingredients_text;

    if (rawText) {
        // Remove common prefixes like "Ingredients:" or "Zutaten:" case insensitive
        const cleanText = rawText.replace(/^(ingredients|zutaten|inhaltsstoffe):\s*/i, '');
        return cleanText.split(/,\s*|\s-\s/).map(cleanIngredient).filter(Boolean);
    }

    // 2. Fallback to structured ingredients array
    if (product.ingredients && Array.isArray(product.ingredients)) {
        return product.ingredients.map((ing: any) => {
            if (ing.text) return cleanIngredient(ing.text);
            // Fallback to ID if text is missing (e.g. "en:sugar" -> "sugar")
            if (ing.id) {
                return ing.id.substring(ing.id.indexOf(':') + 1).replace(/-/g, ' ');
            }
            return '';
        }).filter((i: string) => i && i.length > 1); // Filter empty or single chars
    }

    return [];
};

export const fetchProductFromOpenFoodFacts = async (barcode: string): Promise<Partial<FoodItem>> => {
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

        const foodItem: Partial<FoodItem> = {};
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

export const searchProductByNameFromOpenFoodFacts = async (productName: string): Promise<Partial<FoodItem>> => {
    // Search usually defaults to Food Facts for broad searches, as Beauty search is less reliable via simple text
    // Added localized ingredient text fields to request
    const searchUrl = `${FOOD_API_URL}/search?search_terms=${encodeURIComponent(productName)}&fields=product_name,nutriscore_grade,ingredients_text,ingredients_text_de,ingredients_text_en,ingredients,allergens_tags,categories_tags,labels_tags,stores&page_size=1&sort_by=popularity_key`;
    
    try {
        const response = await fetch(searchUrl);
        if (!response.ok) throw new Error('Failed to search Open Food Facts.');
        
        const data = await response.json();
        
        // If no food found, try beauty
        if (data.count === 0 || !data.products || data.products.length === 0) {
             const beautySearchUrl = `${BEAUTY_API_URL}/search?search_terms=${encodeURIComponent(productName)}&fields=product_name,ingredients_text,ingredients_text_de,ingredients_text_en,ingredients,categories_tags,labels_tags,stores&page_size=1`;
             const beautyResponse = await fetch(beautySearchUrl);
             if(beautyResponse.ok) {
                 const beautyData = await beautyResponse.json();
                 if (beautyData.count > 0 && beautyData.products.length > 0) {
                     const product = beautyData.products[0];
                     // Map Beauty Product similar to main fetch
                     return {
                         name: product.product_name,
                         itemType: 'drugstore',
                         ingredients: parseIngredients(product),
                         tags: product.categories_tags ? product.categories_tags.map((tag: string) => tag.substring(tag.indexOf(':') + 1).replace(/-/g, ' ')) : [],
                         purchaseLocation: product.stores ? product.stores.split(',') : [],
                         isVegan: product.labels_tags ? product.labels_tags.join(' ').toLowerCase().includes('vegan') : false
                     };
                 }
             }
             throw new Error(`Product "${productName}" not found.`);
        }

        const product = data.products[0];
        const foodItem: Partial<FoodItem> = { itemType: 'product' };

        if (product.nutriscore_grade) {
            const score = product.nutriscore_grade.toUpperCase();
            if (['A', 'B', 'C', 'D', 'E'].includes(score)) {
                foodItem.nutriScore = score as FoodItem['nutriScore'];
            }
        }
        
        foodItem.ingredients = parseIngredients(product);

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
