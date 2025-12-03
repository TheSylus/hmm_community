
import { Type } from "@google/genai";
import { getAiClient, hasValidApiKey } from './geminiService';

// Constants
const CACHE_KEY = 'food_tracker_translation_cache';
const SOURCE_LANGUAGE = 'en';
const BATCH_DELAY_MS = 100; // Wait 100ms to collect requests

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

// --- Batching State ---
interface PendingRequest {
    text: string;
    targetLang: 'de'; // Currently strictly 'de' as source is 'en', but extensible
    resolve: (translated: string) => void;
    reject: (error: any) => void;
}

let pendingQueue: PendingRequest[] = [];
let batchTimeout: ReturnType<typeof setTimeout> | null = null;

// The actual API caller processing the batch
const processBatch = async () => {
    if (pendingQueue.length === 0) return;

    // 1. Take snapshot of current queue and clear global
    const currentBatch = [...pendingQueue];
    pendingQueue = [];
    batchTimeout = null;

    // 2. Group by language (though we primarily support en->de now)
    const requestsByLang: Record<string, PendingRequest[]> = {};
    currentBatch.forEach(req => {
        if (!requestsByLang[req.targetLang]) requestsByLang[req.targetLang] = [];
        requestsByLang[req.targetLang].push(req);
    });

    // 3. Process per language
    for (const [lang, requests] of Object.entries(requestsByLang)) {
        // Deduplicate texts to save tokens
        const uniqueTexts = Array.from(new Set(requests.map(r => r.text)));
        
        // Filter out what might have been cached in the meantime
        const textsToFetch = uniqueTexts.filter(text => {
            return !memoryCache[lang]?.[text];
        });

        if (textsToFetch.length === 0) {
            // Everything is in cache, just resolve
            requests.forEach(req => {
                const cached = memoryCache[lang]?.[req.text] || req.text;
                req.resolve(cached);
            });
            continue;
        }

        try {
            const gemini = getAiClient();
            const langName = lang === 'de' ? 'German' : 'English';

            // Send ONE request for ALL texts
            const response = await gemini.models.generateContent({
                model: "gemini-2.5-flash",
                config: {
                    // QUALITY GATE: Temperature 0 ensures deterministic translations.
                    // This is crucial so "Apple" is ALWAYS "Apfel" (cache hit) and never "Ein Apfel" (cache miss).
                    temperature: 0, 
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            translations: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        original: { type: Type.STRING },
                                        translated: { type: Type.STRING }
                                    },
                                    required: ["original", "translated"]
                                }
                            }
                        }
                    }
                },
                contents: {
                    parts: [{
                        text: `Translate array to ${langName}. Preserve casing.` +
                        `\nInput: ${JSON.stringify(textsToFetch)}`
                    }]
                },
            });

            // Parse Response
            const json = JSON.parse(response.text);
            const mapping: Record<string, string> = {};
            
            if (json.translations && Array.isArray(json.translations)) {
                json.translations.forEach((t: any) => {
                    if (t.original && t.translated) {
                        mapping[t.original] = t.translated;
                    }
                });
            }

            // Update Cache
            if (!memoryCache[lang]) memoryCache[lang] = {};
            let cacheUpdated = false;
            
            textsToFetch.forEach(text => {
                // If API missed it, fallback to original
                const result = mapping[text] || text;
                memoryCache[lang][text] = result;
                cacheUpdated = true;
            });

            if (cacheUpdated) saveCache(memoryCache);

            // Resolve all promises
            requests.forEach(req => {
                const result = memoryCache[lang][req.text] || req.text;
                req.resolve(result);
            });

        } catch (error) {
            console.error("Batch translation failed:", error);
            // Fallback: Resolve with original text instead of crashing app
            requests.forEach(req => req.resolve(req.text));
        }
    }
};


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

    // Prepare result array
    const results: string[] = new Array(texts.length);
    const promises: Promise<void>[] = [];

    texts.forEach((text, index) => {
        const trimmedText = typeof text === 'string' ? text.trim() : '';
        
        if (!trimmedText) {
            results[index] = '';
            return;
        }

        // Check Cache Immediately
        if (memoryCache[targetLang][trimmedText]) {
            results[index] = memoryCache[targetLang][trimmedText];
            return;
        }

        // If not in cache, add to Batch Queue
        // We create a promise for THIS specific text item
        const p = new Promise<string>((resolve, reject) => {
            pendingQueue.push({
                text: trimmedText,
                targetLang: targetLang as 'de', // casting for now
                resolve,
                reject
            });
        }).then(translated => {
            results[index] = translated;
        });

        promises.push(p);
    });

    // Start Timer if not running
    if (pendingQueue.length > 0 && !batchTimeout) {
        batchTimeout = setTimeout(processBatch, BATCH_DELAY_MS);
    }

    // Wait for all queued items to be resolved by the batch processor
    if (promises.length > 0) {
        await Promise.all(promises);
    }

    return results;
};
