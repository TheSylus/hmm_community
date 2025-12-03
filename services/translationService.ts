import { Type } from "@google/genai";
import { getAiClient, hasValidApiKey } from './geminiService';

// Constants
const CACHE_KEY = 'food_tracker_translation_cache';
const SOURCE_LANGUAGE = 'en';

// Helper to load cache from localStorage
const loadCache = (): Record<string, Record<string, string>> => {
    try {
        const stored = localStorage.getItem(CACHE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (e) {
        console.error("Failed to load translation cache", e);
        return {};
    }
};

// Helper to save cache to localStorage
const saveCache = (cache: Record<string, Record<string, string>>) => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
        console.error("Failed to save translation cache", e);
    }
};

// Initialize in-memory cache from storage
const memoryCache: Record<string, Record<string, string>> = loadCache();

export const translateTexts = async (texts: (string | undefined | null)[], targetLang: 'en' | 'de'): Promise<string[]> => {
    // 1. Optimization: If target is source language, return immediately.
    if (targetLang === SOURCE_LANGUAGE) {
        return texts.map(t => t || '');
    }
    
    // 2. Optimization: Filter out empty/null strings early
    if (!texts || texts.length === 0) {
        return [];
    }
    
    // Check if we even have an API key before trying remote translation
    if (!hasValidApiKey()) {
        return texts.map(t => t || '');
    }

    if (!memoryCache[targetLang]) {
        memoryCache[targetLang] = {};
    }

    const result: string[] = new Array(texts.length);
    const textsToTranslate: string[] = [];
    const indicesToTranslate: number[] = [];

    // 3. Optimization: Check cache first
    texts.forEach((text, index) => {
        const trimmedText = typeof text === 'string' ? text.trim() : '';
        if (!trimmedText) {
            result[index] = '';
        } else if (memoryCache[targetLang][trimmedText]) {
            // HIT: Use cached value
            result[index] = memoryCache[targetLang][trimmedText];
        } else {
            // MISS: Queue for translation
            textsToTranslate.push(trimmedText);
            indicesToTranslate.push(index);
        }
    });

    // If everything was in cache or empty, return immediately (0 API calls)
    if (textsToTranslate.length === 0) {
        return result;
    }

    try {
        const gemini = getAiClient();
        const langName = targetLang === 'de' ? 'German' : 'English';
        
        const response = await gemini.models.generateContent({
            model: "gemini-2.5-flash",
            config: {
                systemInstruction: `You are a translation expert. Translate the given English terms to the specified language. Maintain the original meaning and casing where appropriate. Return ONLY the JSON object.`,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        translations: {
                            type: Type.ARRAY,
                            description: `An array of translated strings, in the exact same order as the input array.`,
                            items: { type: Type.STRING },
                        },
                    },
                    required: ["translations"],
                },
            },
            contents: {
                parts: [{
                    text: `Translate the following English terms to ${langName}.
Input: ${JSON.stringify(textsToTranslate)}`
                }]
            },
        });

        const jsonString = response.text;
        const translatedResult = JSON.parse(jsonString);
        const newTranslations: string[] = translatedResult.translations || [];

        if (newTranslations.length !== textsToTranslate.length) {
            console.error('Translation length mismatch:', { input: textsToTranslate, output: newTranslations });
            // Fallback for length mismatch: use original text
            indicesToTranslate.forEach((originalIndex, i) => {
                result[originalIndex] = textsToTranslate[i];
            });
            return result;
        }

        // Fill results and update cache
        let cacheUpdated = false;
        newTranslations.forEach((translatedText, i) => {
            const originalIndex = indicesToTranslate[i];
            const originalText = textsToTranslate[i];
            
            result[originalIndex] = translatedText;
            
            if (originalText && translatedText) {
                memoryCache[targetLang][originalText] = translatedText;
                cacheUpdated = true;
            }
        });

        // Persist cache if we added new items
        if (cacheUpdated) {
            saveCache(memoryCache);
        }

        return result;

    } catch (error) {
        console.error("Error translating texts:", error);
        
        // Fallback for any error: use original text
        indicesToTranslate.forEach((originalIndex, i) => {
            result[originalIndex] = textsToTranslate[i];
        });
        return result;
    }
};