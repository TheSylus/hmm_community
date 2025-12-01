
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

    // 2. Pre-Clean the raw text
    // Remove "Ingredients:" or "Zutaten:" prefixes (common OCR artifact)
    let cleanedText = rawText.replace(/^(ingredients|zutaten|inhaltsstoffe):\s*/i, '');
    
    // Remove underscores/asterisks used for bolding allergens (e.g. _Milk_, *Soy*)
    cleanedText = cleanedText.replace(/[_*{}]/g, '');
    
    // Remove percentage values if they are detached or confusing (optional, keeping for now but cleaning format)
    // Replace HTML entities if any (basic check)
    cleanedText = cleanedText.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');

    // 3. Smart Split
    // Split by comma, BUT ignore commas inside parentheses to keep compound ingredients together.
    // e.g. "Sauce (Tomato, Basil), Pasta" -> ["Sauce (Tomato, Basil)", "Pasta"]
    const parts = cleanedText.split(/,\s*(?![^()]*\))/);

    // 4. Post-process each ingredient
    return parts.map(p => {
        let s = p.trim();
        
        // Remove trailing periods
        if (s.endsWith('.')) s = s.slice(0, -1);
        
        // Remove percentages at the end like "Tomato 50%" -> "Tomato" if preferred, 
        // but often percentages are useful. We'll just ensure spacing.
        
        // Capitalize first letter only to fix ALL CAPS ingredients often found in OCR
        if (s.length > 2 && s === s.toUpperCase()) {
            s = s.charAt(0) + s.slice(1).toLowerCase();
        }
        
        // Remove list bullets
        s = s.replace(/^[-•]\s*/, '');

        return s;
    }).filter(s => s.length > 1); // Remove empty or single char artifacts
};

/**
 * Cleans cryptic tags like "en:plant-based-foods" -> "plant based foods"
 * Filters out structural tags that are not useful for the user.
 */
const cleanTags = (tags: string[]): string[] => {
    if (!Array.isArray(tags)) return [];
    
    const ignoredTags = [
        'beverages', 'food', 'drinks', 'groceries', 'products', 
        'non-alcoholic beverages', 'unsweetened beverages', 
        'cocoa and its products', 'snacks', 'sweet snacks' // Usually too generic, but keep if very relevant? No, usually spammy.
    ];

    return tags
        .map(tag => {
            // Remove language prefix (e.g. "en:", "de:", "fr:")
            let cleaned = tag.replace(/^[a-z]{2}:/, '').replace(/-/g, ' ');
            return cleaned.trim().toLowerCase();
        })
        .filter(tag => tag.length > 2 && !ignoredTags.includes(tag))
        .slice(0, 5); // Limit to top 5 cleaned tags
};

// Calculates a relevance score to ensure the found product matches the search term.
// Prevents getting "Chocolate" when searching for "Cola".
const calculateRelevanceScore = (product: any, searchTerms: string[], lang: string) => {
    let score = 0;
    const pName = (product.product_name || '').toLowerCase();
    
    // 1. Name Match Score
    let matchedTerms = 0;
    searchTerms.forEach(term => {
        if (pName.includes(term)) {
            score += 10;
            matchedTerms++;
        }
    });

    // Penalize if the product name is WAY longer than the search term (indicates a specific variant or wrong item)
    // e.g. Search: "Cola", Result: "Cola flavored Gummy Bears extreme"
    const nameLengthRatio = pName.length / (searchTerms.join(' ').length || 1);
    if (nameLengthRatio > 3) score -= 5;

    // 2. Data Quality Score
    if (product.nutriscore_grade) score += 5;
    if (product[`ingredients_text_${lang}`]) score += 10;
    else if (product.ingredients_text) score += 3;
    if (product.image_front_url) score += 2;

    return { score, matchedRatio: matchedTerms / searchTerms.length };
};

// Extract calories (kcal) from nutriments
const extractCalories = (product: any): number | undefined => {
    if (!product.nutriments) return undefined;
    
    // OFF provides 'energy-kcal', 'energy-kcal_100g', 'energy-kcal_serving'
    // We prioritize the standard 100g value or general value
    let kcal = product.nutriments['energy-kcal_100g'];
    
    // Fallback keys if 100g is missing
    if (kcal === undefined || kcal === null) {
        kcal = product.nutriments['energy-kcal'];
    }
    if (kcal === undefined || kcal === null) {
        kcal = product.nutriments['energy-kcal_value'];
    }
    
    if (typeof kcal === 'number') return Math.round(kcal);
    if (typeof kcal === 'string') return Math.round(parseFloat(kcal));
    
    return undefined;
};

const fetchFromApi = async (baseUrl: string, barcode: string): Promise<any> => {
    // We explicitly request language specific fields to avoid empty ingredient lists AND nutriments
    const fields = 'product_name,image_front_url,nutriscore_grade,ingredients_text,ingredients_text_de,ingredients_text_en,allergens_tags,categories_tags,labels_tags,stores,nutriments';
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

        if (isFood) {
            if (product.nutriscore_grade) {
                const score = product.nutriscore_grade.toUpperCase();
                if (['A', 'B', 'C', 'D', 'E'].includes(score)) {
                    foodItem.nutriScore = score as FoodItem['nutriScore'];
                }
            }
            // Extract Calories
            const kcal = extractCalories(product);
            if (kcal !== undefined) foodItem.calories = kcal;
        }
        
        // Use robust extraction
        foodItem.ingredients = extractCleanIngredients(product, lang);

        if (product.allergens_tags && Array.isArray(product.allergens_tags)) {
            foodItem.allergens = cleanTags(product.allergens_tags);
        }
        
        if (product.categories_tags && Array.isArray(product.categories_tags)) {
             foodItem.tags = cleanTags(product.categories_tags);
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
    
    // Explicitly ask for language specific ingredient fields and nutriments
    const fields = 'product_name,nutriscore_grade,ingredients_text,ingredients_text_en,ingredients_text_de,allergens_tags,categories_tags,labels_tags,stores,image_front_url,unique_scans_n,nutriments';
    
    // 2. Fetch Top 10 results (increased from 5 to allow filtering)
    // We sort by unique_scans_n to get popular items, but we MUST filter them next.
    const searchUrl = `${FOOD_API_URL}/search?search_terms=${encodeURIComponent(productName)}&fields=${fields}&page_size=10&sort_by=unique_scans_n&cc=${country}&lc=${language}`;
    
    try {
        const response = await fetch(searchUrl);
        if (!response.ok) throw new Error('Failed to search Open Food Facts.');
        
        const data = await response.json();
        let products = data.products || [];
        
        // Filter out results that don't match the search term well enough
        // This is CRITICAL for "Coca Cola Zero" not showing "Chocolate"
        const searchTerms = productName.toLowerCase().split(' ').filter(w => w.length > 2); // Ignore small words like "the", "in"
        
        if (products.length > 0) {
            // Augment products with a score
            const scoredProducts = products.map((p: any) => {
                const { score, matchedRatio } = calculateRelevanceScore(p, searchTerms, language);
                return { ...p, _relevanceScore: score, _matchedRatio: matchedRatio };
            });

            // Filter: At least 50% of significant search words must appear in product name
            const filteredProducts = scoredProducts.filter((p: any) => p._matchedRatio >= 0.5);

            // Sort by relevance score desc
            filteredProducts.sort((a: any, b: any) => b._relevanceScore - a._relevanceScore);

            // Use filtered list if not empty, otherwise fallback (maybe search terms were too strict)
            if (filteredProducts.length > 0) {
                products = filteredProducts;
            }
        }

        // If no food found or score too low, try beauty (only if initial list was empty or filtered to empty)
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
                         tags: cleanTags(product.categories_tags),
                         purchaseLocation: product.stores ? product.stores.split(',') : [],
                         isVegan: product.labels_tags ? product.labels_tags.join(' ').toLowerCase().includes('vegan') : false
                     };
                 }
             }
             throw new Error(`Product "${productName}" not found.`);
        }

        const product = products[0]; // Take the best match

        const foodItem: Partial<FoodItem> = { itemType: 'product' };

        if (product.nutriscore_grade) {
            const score = product.nutriscore_grade.toUpperCase();
            if (['A', 'B', 'C', 'D', 'E'].includes(score)) {
                foodItem.nutriScore = score as FoodItem['nutriScore'];
            }
        }
        
        const kcal = extractCalories(product);
        if (kcal !== undefined) foodItem.calories = kcal;
        
        foodItem.ingredients = extractCleanIngredients(product, language);

        if (product.allergens_tags && Array.isArray(product.allergens_tags)) {
            foodItem.allergens = cleanTags(product.allergens_tags);
        }
        
        if (product.categories_tags && Array.isArray(product.categories_tags)) {
             foodItem.tags = cleanTags(product.categories_tags);
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
            }
        } else {
            foodItem.isLactoseFree = false;
        }
        
        return foodItem;

    } catch (error) {
        console.error("Error searching Open Facts by name:", error);
        throw error;
    }
};
