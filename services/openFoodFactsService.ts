
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
        // Return empty string instead of throwing to allow partial data load
        return ""; 
    }
};

/**
 * Extracts and cleans ingredients text with language fallback logic.
 * Prioritizes the user's language, then English, then generic.
 * Handles "kryptic" characters like underscores used for allergens.
 */
const extractCleanIngredients = (product: any, lang: string = 'en'): string[] => {
    // 1. Determine the best source field
    let rawText = '';
    const langKey = `ingredients_text_${lang}`; // e.g., ingredients_text_de
    
    if (product[langKey]) {
        rawText = product[langKey];
    } else if (product.ingredients_text_en) {
        rawText = product.ingredients_text_en;
    } else if (product.ingredients_text) {
        rawText = product.ingredients_text;
    }

    if (!rawText) return [];

    // 2. Clean the raw text
    // Remove underscores used for allergens (e.g. _Milk_) and asterisks
    const cleanedText = rawText.replace(/_/g, '').replace(/\*/g, '');

    // 3. Smart Split
    // Split by comma, BUT ignore commas inside parentheses to keep compound ingredients together.
    // e.g. "Sauce (Tomato, Basil), Pasta" -> ["Sauce (Tomato, Basil)", "Pasta"]
    // Regex explanation: Match comma followed by whitespace, NOT followed by non-parenthesis chars and a closing parenthesis
    const parts = cleanedText.split(/,\s*(?![^()]*\))/);

    // 4. Post-process each ingredient
    return parts.map(p => {
        let s = p.trim();
        // Capitalize first letter only to fix ALL CAPS ingredients often found in OCR
        if (s.length > 2 && s === s.toUpperCase()) {
            s = s.charAt(0) + s.slice(1).toLowerCase();
        }
        return s;
    }).filter(s => s.length > 1); // Remove empty or single char artifacts
};

/**
 * Cleans cryptic tags like "en:plant-based-foods" -> "plant based foods"
 */
const cleanTag = (tag: string): string => {
    if (!tag) return '';
    // Remove language prefix (e.g. "en:", "de:", "fr:")
    const withoutPrefix = tag.replace(/^[a-z]{2}:/, '');
    // Replace hyphens with spaces
    return withoutPrefix.replace(/-/g, ' ');
};

// Helper to calculate a quality score for a product record
// Used to pick the best match from search results
const calculateProductQualityScore = (p: any, lang: string) => {
    let score = 0;
    if (p.nutriscore_grade) score += 5; // High value for NutriScore
    // Bonus if ingredients exist in the target language
    if (p[`ingredients_text_${lang}`]) score += 10;
    else if (p.ingredients_text) score += 3;
    
    if (p.image_front_url) score += 2;
    // Prefer items with a reasonably long name (avoid stubs like "Cola")
    if (p.product_name && p.product_name.length > 3) score += 1;
    return score;
};

const fetchFromApi = async (baseUrl: string, barcode: string): Promise<any> => {
    // We explicitly request language specific fields to avoid empty ingredient lists
    const fields = 'product_name,image_front_url,nutriscore_grade,ingredients_text,ingredients_text_de,ingredients_text_en,allergens_tags,categories_tags,labels_tags,stores';
    const url = `${baseUrl}/product/${barcode}.json?fields=${fields}`;
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

export const fetchProductFromOpenFoodFacts = async (barcode: string): Promise<Partial<FoodItem>> => {
    // Detect browser language for preference
    const lang = navigator.language.split('-')[0] || 'en';

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
            const base64 = await imageUrlToBase64(product.image_front_url);
            if (base64) foodItem.image = base64;
        }

        if (isFood && product.nutriscore_grade) {
            const score = product.nutriscore_grade.toUpperCase();
            if (['A', 'B', 'C', 'D', 'E'].includes(score)) {
                foodItem.nutriScore = score as FoodItem['nutriScore'];
            }
        }
        
        // Use robust extraction
        foodItem.ingredients = extractCleanIngredients(product, lang);

        if (product.allergens_tags && Array.isArray(product.allergens_tags)) {
            foodItem.allergens = product.allergens_tags.map(cleanTag);
        }
        
        if (product.categories_tags && Array.isArray(product.categories_tags)) {
             foodItem.tags = product.categories_tags.map(cleanTag).slice(0, 5); // Limit to 5 relevant tags
        }

        if (product.stores) {
            foodItem.purchaseLocation = product.stores.split(',').map((s: string) => s.trim()).filter(Boolean);
        }

        // Check labels
        if (product.labels_tags && Array.isArray(product.labels_tags)) {
            const labels = product.labels_tags.join(' ').toLowerCase();
            foodItem.isVegan = labels.includes('vegan');
            foodItem.isGlutenFree = labels.includes('gluten-free') || labels.includes('glutenfree');
            
            if (isFood) {
                if (labels.includes('lactose-free') || labels.includes('lactosefree')) {
                    foodItem.isLactoseFree = true;
                } else if (foodItem.allergens) {
                    // Heuristic: If allergens are listed but NO dairy is found, it MIGHT be lactose free, 
                    // but safer to rely on explicit labels or user input.
                    // However, we can check if Milk is explicitly NOT in allergens if list exists.
                    const dairyAllergens = ['milk', 'lactose', 'dairy', 'milch', 'laktose'];
                    const hasDairy = foodItem.allergens.some(allergen => 
                        dairyAllergens.some(dairy => allergen.toLowerCase().includes(dairy))
                    );
                    // Only assume lactose free if we have a detailed allergen list and no dairy found
                    if (!hasDairy && foodItem.allergens.length > 0) {
                        // foodItem.isLactoseFree = true; // Use with caution
                    }
                }
            }
        }

        return foodItem;

    } catch (error) {
        console.error("Error fetching from Open Facts API:", error);
        throw error;
    }
};

export const searchProductByNameFromOpenFoodFacts = async (productName: string, language: string = 'en'): Promise<Partial<FoodItem>> => {
    // 1. Prioritize user's country/language
    const country = language === 'de' ? 'de' : 'us'; 
    
    // Explicitly ask for language specific ingredient fields
    const fields = 'product_name,nutriscore_grade,ingredients_text,ingredients_text_en,ingredients_text_de,allergens_tags,categories_tags,labels_tags,stores,image_front_url,unique_scans_n';
    
    // 2. Fetch Top 5 results sorted by 'unique_scans_n' (scanned popularity) to avoid obscure duplicates
    const searchUrl = `${FOOD_API_URL}/search?search_terms=${encodeURIComponent(productName)}&fields=${fields}&page_size=5&sort_by=unique_scans_n&cc=${country}&lc=${language}`;
    
    try {
        const response = await fetch(searchUrl);
        if (!response.ok) throw new Error('Failed to search Open Food Facts.');
        
        const data = await response.json();
        let products = data.products || [];
        
        // If no food found, try beauty
        if (products.length === 0) {
             const beautySearchUrl = `${BEAUTY_API_URL}/search?search_terms=${encodeURIComponent(productName)}&fields=${fields}&page_size=1&lc=${language}`;
             const beautyResponse = await fetch(beautySearchUrl);
             if(beautyResponse.ok) {
                 const beautyData = await beautyResponse.json();
                 if (beautyData.count > 0 && beautyData.products.length > 0) {
                     const product = beautyData.products[0];
                     return {
                         name: product.product_name,
                         itemType: 'drugstore',
                         ingredients: extractCleanIngredients(product, language),
                         tags: product.categories_tags ? product.categories_tags.map(cleanTag) : [],
                         purchaseLocation: product.stores ? product.stores.split(',') : [],
                         isVegan: product.labels_tags ? product.labels_tags.join(' ').toLowerCase().includes('vegan') : false
                     };
                 }
             }
             throw new Error(`Product "${productName}" not found.`);
        }

        // 3. Quality Filter: Sort results by completeness AND language match
        products.sort((a: any, b: any) => calculateProductQualityScore(b, language) - calculateProductQualityScore(a, language));
        const product = products[0];

        const foodItem: Partial<FoodItem> = { itemType: 'product' };

        if (product.nutriscore_grade) {
            const score = product.nutriscore_grade.toUpperCase();
            if (['A', 'B', 'C', 'D', 'E'].includes(score)) {
                foodItem.nutriScore = score as FoodItem['nutriScore'];
            }
        }
        
        foodItem.ingredients = extractCleanIngredients(product, language);

        if (product.allergens_tags && Array.isArray(product.allergens_tags)) {
            foodItem.allergens = product.allergens_tags.map(cleanTag);
        }
        
        if (product.categories_tags && Array.isArray(product.categories_tags)) {
             foodItem.tags = product.categories_tags.map(cleanTag).slice(0, 5);
        }
        
        if (product.stores) {
             foodItem.purchaseLocation = product.stores.split(',').map((s: string) => s.trim()).filter(Boolean);
        }

        if (product.labels_tags && Array.isArray(product.labels_tags)) {
            const labels = product.labels_tags.join(' ').toLowerCase();
            foodItem.isVegan = labels.includes('vegan');
            foodItem.isGlutenFree = labels.includes('gluten-free') || labels.includes('glutenfree');
            
            if (labels.includes('lactose-free') || labels.includes('lactosefree')) {
                foodItem.isLactoseFree = true;
            } else if (foodItem.allergens) {
                const dairyAllergens = ['milk', 'lactose', 'dairy', 'milch', 'laktose'];
                const hasDairy = foodItem.allergens.some(allergen => 
                    dairyAllergens.some(dairy => allergen.toLowerCase().includes(dairy))
                );
                if (!hasDairy && foodItem.allergens.length > 0) {
                    // foodItem.isLactoseFree = true;
                }
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
