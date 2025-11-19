import { FoodItem } from '../types';

const API_URL = 'https://world.openfoodfacts.org/api/v2';

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


export const fetchProductFromOpenFoodFacts = async (barcode: string): Promise<Partial<FoodItem>> => {
    const url = `${API_URL}/product/${barcode}.json`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Product not found in Open Food Facts database.');
        }

        const data = await response.json();
        
        if (data.status === 0 || !data.product) {
            throw new Error(data.status_verbose || 'Product not found.');
        }

        const product = data.product;
        const foodItem: Partial<FoodItem> = {};

        if (product.product_name) {
            foodItem.name = product.product_name;
        }

        if (product.image_front_url) {
            foodItem.image = await imageUrlToBase64(product.image_front_url);
        }

        if (product.nutriscore_grade) {
            const score = product.nutriscore_grade.toUpperCase();
            if (['A', 'B', 'C', 'D', 'E'].includes(score)) {
                foodItem.nutriScore = score as FoodItem['nutriScore'];
            }
        }
        
        if (product.ingredients_text) {
             foodItem.ingredients = product.ingredients_text.split(/,\s*|\s-\s/).map((i: string) => i.trim().replace(/_|\*/g, '')).filter(Boolean);
        }

        if (product.allergens_tags && Array.isArray(product.allergens_tags)) {
            // Allergens are often prefixed with 'en:', 'de:', etc. We remove the prefix.
            foodItem.allergens = product.allergens_tags.map((tag: string) => tag.substring(tag.indexOf(':') + 1).replace(/-/g, ' '));
        }
        
        if (product.categories_tags && Array.isArray(product.categories_tags)) {
             foodItem.tags = product.categories_tags.map((tag: string) => tag.substring(tag.indexOf(':') + 1).replace(/-/g, ' '));
        }

        // Note: OFF often returns stores as a comma-separated string in 'stores'.
        if (product.stores) {
            foodItem.purchaseLocation = product.stores.split(',').map((s: string) => s.trim()).filter(Boolean);
        }

        // Check labels for dietary information
        if (product.labels_tags && Array.isArray(product.labels_tags)) {
            const labels = product.labels_tags.join(' ').toLowerCase();
            foodItem.isVegan = labels.includes('vegan');
            foodItem.isGlutenFree = labels.includes('gluten-free');
            // 'lactose-free' can be tricky, also check allergens
            if (labels.includes('lactose-free')) {
                foodItem.isLactoseFree = true;
            } else if (foodItem.allergens) {
                // Double-check allergens for milk/lactose if not explicitly labeled
                const dairyAllergens = ['milk', 'lactose', 'dairy'];
                foodItem.isLactoseFree = !foodItem.allergens.some(allergen => 
                    dairyAllergens.some(dairy => allergen.toLowerCase().includes(dairy))
                );
            }
        }

        return foodItem;

    } catch (error) {
        console.error("Error fetching from Open Food Facts API:", error);
        throw error;
    }
};

export const searchProductByNameFromOpenFoodFacts = async (productName: string): Promise<Partial<FoodItem>> => {
    const searchUrl = `${API_URL}/search?search_terms=${encodeURIComponent(productName)}&fields=product_name,nutriscore_grade,ingredients_text,allergens_tags,categories_tags,labels_tags,stores&page_size=1&sort_by=popularity_key`;
    
    try {
        const response = await fetch(searchUrl);
        if (!response.ok) {
            throw new Error('Failed to search Open Food Facts.');
        }
        
        const data = await response.json();
        
        if (data.count === 0 || !data.products || data.products.length === 0) {
            throw new Error(`Product "${productName}" not found in Open Food Facts.`);
        }

        const product = data.products[0];
        const foodItem: Partial<FoodItem> = {};

        if (product.nutriscore_grade) {
            const score = product.nutriscore_grade.toUpperCase();
            if (['A', 'B', 'C', 'D', 'E'].includes(score)) {
                foodItem.nutriScore = score as FoodItem['nutriScore'];
            }
        }
        
        if (product.ingredients_text) {
             foodItem.ingredients = product.ingredients_text.split(/,\s*|\s-\s/).map((i: string) => i.trim().replace(/_|\*/g, '')).filter(Boolean);
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
        console.error("Error searching Open Food Facts by name:", error);
        throw error;
    }
};