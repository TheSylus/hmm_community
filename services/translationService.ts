
import { Type, GoogleGenAI } from "@google/genai";
import { getAiClient, hasValidApiKey } from './geminiService';

const CACHE_KEY = 'food_tracker_translation_cache';
const SOURCE_LANGUAGE = 'en';
const BATCH_DELAY_MS = 100;

const loadCache = (): Record<string, Record<string, string>> => {
    try {
        const stored = localStorage.getItem(CACHE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (e) { return {}; }
};

const saveCache = (cache: Record<string, Record<string, string>>) => {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch (e) {}
};

const memoryCache: Record<string, Record<string, string>> = loadCache();

interface PendingRequest {
    text: string;
    targetLang: 'de';
    resolve: (translated: string) => void;
}

let pendingQueue: PendingRequest[] = [];
let batchTimeout: ReturnType<typeof setTimeout> | null = null;

const processBatch = async () => {
    if (pendingQueue.length === 0) return;

    const currentBatch = [...pendingQueue];
    pendingQueue = [];
    batchTimeout = null;

    const uniqueTexts = Array.from(new Set(currentBatch.map(r => r.text))).filter(t => !memoryCache['de']?.[t]);

    if (uniqueTexts.length === 0) {
        currentBatch.forEach(req => req.resolve(memoryCache['de'][req.text] || req.text));
        return;
    }

    try {
        const gemini = getAiClient();
        // FIX: Updated model to gemini-3-flash-preview for basic text tasks.
        const response = await gemini.models.generateContent({
            model: "gemini-3-flash-preview",
            config: {
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
            contents: { parts: [{ text: `Translate to German: ${JSON.stringify(uniqueTexts)}` }] },
        });

        // FIX: Accessing .text directly.
        const json = JSON.parse(response.text || '{"translations":[]}');
        const mapping: Record<string, string> = {};
        json.translations?.forEach((t: any) => mapping[t.original] = t.translated);

        if (!memoryCache['de']) memoryCache['de'] = {};
        uniqueTexts.forEach(text => memoryCache['de'][text] = mapping[text] || text);
        saveCache(memoryCache);

        currentBatch.forEach(req => req.resolve(memoryCache['de'][req.text] || req.text));
    } catch (error) {
        currentBatch.forEach(req => req.resolve(req.text));
    }
};

export const translateTexts = async (texts: (string | undefined | null)[], targetLang: 'en' | 'de'): Promise<string[]> => {
    if (targetLang === SOURCE_LANGUAGE || !texts.length || !hasValidApiKey()) {
        return texts.map(t => t || '');
    }

    const results: string[] = new Array(texts.length);
    const promises: Promise<void>[] = [];

    texts.forEach((text, index) => {
        const val = text?.trim() || '';
        if (!val) { results[index] = ''; return; }
        if (memoryCache[targetLang]?.[val]) { results[index] = memoryCache[targetLang][val]; return; }

        promises.push(new Promise<string>((resolve) => {
            pendingQueue.push({ text: val, targetLang: 'de', resolve });
        }).then(t => { results[index] = t; }));
    });

    if (pendingQueue.length > 0 && !batchTimeout) {
        batchTimeout = setTimeout(processBatch, BATCH_DELAY_MS);
    }

    if (promises.length > 0) await Promise.all(promises);
    return results;
};
