import { Type } from "@google/genai";
import { getAiClient, hasValidApiKey } from './geminiService';

// In-memory cache for translations: cache[targetLang][sourceText] = translatedText
const cache: Record<string, Record<string, string>> = {};

const SOURCE_LANGUAGE = 'en'; // The language AI results are generated and stored in.

export const translateTexts = async (texts: (string | undefined | null)[], targetLang: 'en' | 'de'): Promise<string[]> => {
    if (targetLang === SOURCE_LANGUAGE) {
        return texts.map(t => t || '');
    }
    if (!texts || texts.length === 0) {
        return [];
    }
    
    // Silently return original texts if no API key is available.
    // This prevents API calls and console warnings when the user hasn't set up a key.
    if (!hasValidApiKey()) {
        return texts.map(t => t || '');
    }

    if (!cache[targetLang]) {
        cache[targetLang] = {};
    }

    const result: string[] = new Array(texts.length);
    const textsToTranslate: string[] = [];
    const indicesToTranslate: number[] = [];

    texts.forEach((text, index) => {
        const trimmedText = typeof text === 'string' ? text.trim() : '';
        if (!trimmedText) {
            result[index] = '';
        } else if (cache[targetLang][trimmedText]) {
            result[index] = cache[targetLang][trimmedText];
        } else {
            textsToTranslate.push(trimmedText);
            indicesToTranslate.push(index);
        }
    });

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
            // Fallback for length mismatch
            indicesToTranslate.forEach((originalIndex, i) => {
                result[originalIndex] = textsToTranslate[i];
            });
            return result;
        }

        newTranslations.forEach((translatedText, i) => {
            const originalIndex = indicesToTranslate[i];
            const originalText = textsToTranslate[i];
            result[originalIndex] = translatedText;
            cache[targetLang][originalText] = translatedText;
        });

        return result;

    } catch (error) {
        // Log general errors but avoid warning about the missing API key, as it's now handled.
        console.error("Error translating texts:", error);
        
        // Fallback for any error
        indicesToTranslate.forEach((originalIndex, i) => {
            result[originalIndex] = textsToTranslate[i];
        });
        return result;
    }
};