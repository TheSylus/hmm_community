
import { FoodItem } from '../types';

// Using the CGI search endpoint as it mirrors the website's fuzzy search logic better than API v2
const SEARCH_API_URL = 'https://world.openfoodfacts.org/cgi/search.pl';
const PRODUCT_API_URL = 'https://world.openfoodfacts.org/api/v2';

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
        return ""; 
    }
};

/**
 * Extracts and cleans ingredients text.
 */
const extractCleanIngredients = (product: any, lang: string = 'en'): string[] => {
    let rawText = '';
    const langKey = `ingredients_text_${lang}`;
    
    if (product[langKey]) {
        rawText = product[langKey];
    } else if (product.ingredients_text_en) {
        rawText = product.ingredients_text_en;
    } else if (product.ingredients_text) {
        rawText = product.ingredients_text;
    }

    if (!rawText) return [];

    // Remove prefixes and clean formatting characters
    let cleanedText = rawText.replace(/^(ingredients|zutaten|inhaltsstoffe)(\s*[:\-])?\s*/i, '');
    cleanedText = cleanedText.replace(/[_*{}]/g, '');
    cleanedText = cleanedText.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');

    // Split by comma, ignoring commas inside parentheses
    const parts = cleanedText.split(/,\s*(?![^()]*\))/);

    return parts.map(p => {
        let s = p.trim();
        if (s.endsWith('.')) s = s.slice(0, -1);
        if (s.length > 2 && s === s.toUpperCase()) {
            s = s.charAt(0) + s.slice(1).toLowerCase();
        }
        s = s.replace(/^[-•]\s*/, '');
        return s;
    }).filter(s => s.length > 1);
};

/**
 * Cleans cryptic tags and removes generic taxonomy terms.
 */
const cleanTags = (tags: string[], productName: string = ''): string[] => {
    if (!Array.isArray(tags)) return [];
    
    const pName = productName.toLowerCase();
    
    // Extensive blacklist of generic/structural categories
    const ignoredTags = [
        'beverages', 'food', 'drinks', 'groceries', 'products', 
        'non-alcoholic beverages', 'unsweetened beverages', 
        'cocoa and its products', 'snacks', 'sweet snacks', 'salty snacks',
        'beverages and beverages preparations', 
        'plant-based foods', 'plant-based foods and beverages',
        'artificially sweetened beverages', 'carbonated drinks',
        'dairies', 'meats', 'seafood', 'fishes', 
        'fruits and vegetables', 'cereals and potatoes',
        'fresh foods', 'fermented foods', 'desserts'
    ];

    // Conditional tags: only show if the product name supports it
    const conditionalTags = [
        { tag: 'waters', keyword: ['water', 'wasser'] },
        { tag: 'spring waters', keyword: ['water', 'wasser'] },
        { tag: 'mineral waters', keyword: ['water', 'wasser'] },
        { tag: 'natural mineral waters', keyword: ['water', 'wasser'] },
        { tag: 'milks', keyword: ['milk', 'milch'] }
    ];

    return tags
        .map(tag => {
            // Remove language prefixes (en:, de:, etc.)
            let cleaned = tag.replace(/^[a-z]{2}:/, '').replace(/-/g, ' ');
            return cleaned.trim().toLowerCase();
        })
        .filter(tag => {
            if (tag.length < 3) return false;
            if (ignoredTags.includes(tag)) return false;
            
            // Filter conditional tags
            const condition = conditionalTags.find(c => c.tag === tag);
            if (condition) {
                const hasKeyword = condition.keyword.some(k => pName.includes(k));
                if (!hasKeyword) return false;
            }
            
            return true;
        })
        .slice(0, 5);
};

/**
 * Calculates a relevance score using word overlap (Jaccard-like) and length penalties.
 * Essential for distinguishing "Coca Cola" from "Coca Cola Flavoured Candy".
 */
const calculateRelevanceScore = (product: any, searchTerms: string[], lang: string) => {
    let score = 0;
    const pName = (product.product_name || '').toLowerCase();
    const pNameWords = pName.split(/\s+/);
    
    // 1. Word Overlap Score
    let matchedTerms = 0;
    searchTerms.forEach(term => {
        if (pName.includes(term)) {
            score += 20;
            matchedTerms++;
        }
    });

    // 2. Exact Start Bonus
    if (pName.startsWith(searchTerms[0])) {
        score += 15;
    }

    // 3. Length Penalty (The anti-noise filter)
    // If the product name is significantly longer than the search query, it's likely a derivative product.
    // e.g. Search "Cola" (1 word) vs "Cola Flavored Chewy Candy Sticks" (5 words).
    const normalizedSearch = searchTerms.join(' ');
    const lengthRatio = pName.length / (normalizedSearch.length || 1);
    
    if (lengthRatio > 3) score -= 30; // Very long name = likely wrong product
    else if (lengthRatio > 2) score -= 15;

    // 4. Data Quality Bonuses
    if (product.nutriscore_grade) score += 5;
    if (product.image_front_url) score += 5;
    if (product[`ingredients_text_${lang}`]) score += 10; // Prefer user's language

    return { score, matchedRatio: matchedTerms / searchTerms.length };
};

// Extract calories (kcal) handling 0 correctly
const extractCalories = (product: any): number | undefined => {
    if (!product.nutriments) return undefined;
    
    const possibleKeys = ['energy-kcal_100g', 'energy-kcal', 'energy-kcal_value', 'energy-kcal_serving'];
    
    for (const key of possibleKeys) {
        const val = product.nutriments[key];
        if (typeof val === 'number') return Math.round(val);
        if (typeof val === 'string' && val.trim() !== '') {
            const parsed = parseFloat(val);
            if (!isNaN(parsed)) return Math.round(parsed);
        }
    }
    
    return undefined;
};

const fetchFromApi = async (baseUrl: string, barcode: string): Promise<any> => {
    const fields = 'product_name,image_front_url,nutriscore_grade,ingredients_text,ingredients_text_de,ingredients_text_en,allergens_tags,categories_tags,labels_tags,stores,nutriments';
    const url = `${baseUrl}/product/${barcode}.json?fields=${fields}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Product not found.`);
    const data = await response.json();
    if (data.status === 0 || !data.product) throw new Error(data.status_verbose || 'Product not found.');
    return data.product;
};

export const fetchProductFromOpenFoodFacts = async (barcode: string): Promise<Partial<FoodItem>> => {
    const lang = navigator.language.split('-')[0] || 'en';

    try {
        let product;
        let isFood = true;
        try {
            product = await fetchFromApi(PRODUCT_API_URL, barcode);
        } catch (e) {
            // Fallback to Beauty API is rarely needed but kept for safety
            throw e; 
        }

        const foodItem: Partial<FoodItem> = { itemType: 'product' };

        if (product.product_name) foodItem.name = product.product_name;
        if (product.image_front_url) {
            const base64 = await imageUrlToBase64(product.image_front_url);
            if (base64) foodItem.image = base64;
        }

        if (product.nutriscore_grade) {
            const score = product.nutriscore_grade.toUpperCase();
            if (['A', 'B', 'C', 'D', 'E'].includes(score)) foodItem.nutriScore = score;
        }
        
        const kcal = extractCalories(product);
        if (kcal !== undefined) foodItem.calories = kcal;
        
        foodItem.ingredients = extractCleanIngredients(product, lang);

        if (product.allergens_tags) foodItem.allergens = cleanTags(product.allergens_tags, product.product_name);
        if (product.categories_tags) foodItem.tags = cleanTags(product.categories_tags, product.product_name);
        if (product.stores) foodItem.purchaseLocation = product.stores.split(',').map((s: string) => s.trim()).filter(Boolean);

        if (product.labels_tags) {
            const labels = Array.isArray(product.labels_tags) ? product.labels_tags.join(' ').toLowerCase() : '';
            foodItem.isVegan = labels.includes('vegan');
            foodItem.isGlutenFree = labels.includes('gluten-free') || labels.includes('glutenfree');
            foodItem.isLactoseFree = labels.includes('lactose-free') || labels.includes('lactosefree');
        }

        return foodItem;

    } catch (error) {
        console.error("Error fetching from Open Facts API:", error);
        throw error;
    }
};

export const searchProductByNameFromOpenFoodFacts = async (productName: string, language: string = 'en'): Promise<Partial<FoodItem>> => {
    const country = language === 'de' ? 'de' : 'us'; 
    
    // Explicit fields to minimize payload but maximize utility
    const fields = 'product_name,nutriscore_grade,ingredients_text,ingredients_text_en,ingredients_text_de,allergens_tags,categories_tags,labels_tags,stores,image_front_url,unique_scans_n,nutriments';
    
    // USE SEARCH.PL (CGI) - This matches the website's search behavior better than APIv2
    const searchUrl = `${SEARCH_API_URL}?search_terms=${encodeURIComponent(productName)}&search_simple=1&action=process&json=1&page_size=20&fields=${fields}&cc=${country}&lc=${language}`;
    
    try {
        const response = await fetch(searchUrl);
        if (!response.ok) throw new Error('Failed to search Open Food Facts.');
        
        const data = await response.json();
        let products = data.products || [];
        
        // Filter terms: ignore small words
        const searchTerms = productName.toLowerCase().split(' ').filter(w => w.length > 2);
        
        if (products.length > 0 && searchTerms.length > 0) {
            const scoredProducts = products.map((p: any) => {
                const { score, matchedRatio } = calculateRelevanceScore(p, searchTerms, language);
                return { ...p, _relevanceScore: score, _matchedRatio: matchedRatio };
            });

            // STRICT FILTER: Match ratio must be high enough to be relevant
            const filteredProducts = scoredProducts.filter((p: any) => p._matchedRatio >= 0.5);

            // Sort by our custom score (descending)
            filteredProducts.sort((a: any, b: any) => b._relevanceScore - a._relevanceScore);

            if (filteredProducts.length > 0) {
                products = filteredProducts;
            }
        }

        if (products.length === 0) {
             throw new Error(`Product "${productName}" not found.`);
        }

        // Take the best match
        const product = products[0]; 

        const foodItem: Partial<FoodItem> = { itemType: 'product' };

        if (product.nutriscore_grade) {
            const score = product.nutriscore_grade.toUpperCase();
            if (['A', 'B', 'C', 'D', 'E'].includes(score)) foodItem.nutriScore = score;
        }
        
        const kcal = extractCalories(product);
        if (kcal !== undefined) foodItem.calories = kcal;
        
        foodItem.ingredients = extractCleanIngredients(product, language);

        if (product.allergens_tags) foodItem.allergens = cleanTags(product.allergens_tags, product.product_name);
        if (product.categories_tags) foodItem.tags = cleanTags(product.categories_tags, product.product_name);
        
        if (product.stores) {
             foodItem.purchaseLocation = product.stores.split(',').map((s: string) => s.trim()).filter(Boolean);
        }

        if (product.labels_tags) {
            const labels = Array.isArray(product.labels_tags) ? product.labels_tags.join(' ').toLowerCase() : '';
            foodItem.isVegan = labels.includes('vegan');
            foodItem.isGlutenFree = labels.includes('gluten-free') || labels.includes('glutenfree');
            foodItem.isLactoseFree = labels.includes('lactose-free') || labels.includes('lactosefree');
        } else {
            // Default to false if no labels found to avoid undefined
            foodItem.isLactoseFree = false;
            foodItem.isVegan = false;
            foodItem.isGlutenFree = false;
        }
        
        return foodItem;

    } catch (error) {
        console.error("Error searching Open Facts by name:", error);
        throw error;
    }
};
