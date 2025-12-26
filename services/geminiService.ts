
import { GoogleGenAI, Type } from "@google/genai";
import { FoodItem, NutriScore, GroceryCategory, Receipt, ReceiptItem } from "../types";
import { AiFoodAnalysisSchema, AiIngredientsAnalysisSchema, AiReceiptSchema } from "./schemas";

// FIX: Always initialize GoogleGenAI with process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const hasValidApiKey = (): boolean => {
    return !!process.env.API_KEY;
};

export function getAiClient() {
    if (!process.env.API_KEY) {
        throw new Error("API key not found.");
    }
    // FIX: Create a fresh instance for robustness as per guidelines.
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

// Lokale Bildoptimierung vor dem Cloud-Versand
const resizeImage = (base64Str: string, mode: 'main' | 'text' | 'receipt' = 'main'): Promise<string> => {
    let maxWidth = 1280;
    let quality = 0.9;

    if (mode === 'text' || mode === 'receipt') {
        maxWidth = 1600;
        quality = 0.85;
    }

    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            } else {
                resolve(base64Str);
            }
        };
        img.onerror = () => resolve(base64Str);
    });
};

const parseJson = (text: string | undefined) => {
    if (!text) return {};
    try {
        const cleaned = text.replace(/```json\s*|\s*```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("JSON Parsing Error", e);
        return {};
    }
};

export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export const analyzeFoodImage = async (base64Image: string): Promise<{ name: string; tags: string[]; nutriScore?: NutriScore; boundingBox?: BoundingBox; itemType?: 'product' | 'drugstore' | 'dish'; category?: GroceryCategory; image: string }> => {
  const resizedImage = await resizeImage(base64Image, 'main');
  const match = resizedImage.match(/^data:(image\/[a-z]+);base64,(.*)$/);
  if (!match) throw new Error("Invalid image format.");
  
  const mimeType = match[1];
  const data = match[2];

  try {
    const gemini = getAiClient();
    // FIX: Updated model to gemini-3-flash-preview for vision tasks as per task-based model selection.
    const response = await gemini.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [
          { inlineData: { mimeType, data } },
          { text: "Analyze item. Name: exact text on pack. Category: produce, bakery, meat_fish, dairy_eggs, pantry, frozen, snacks, beverages, household, personal_care, restaurant_food, other. Tags: max 5 keywords. Nutri-Score (A-E). BoundingBox: exact pixel boundaries (ymin, xmin, ymax, xmax) 0-1000." }
      ]},
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            itemType: { type: Type.STRING, enum: ['product', 'drugstore', 'dish'] },
            category: { type: Type.STRING, enum: ['produce', 'bakery', 'meat_fish', 'dairy_eggs', 'pantry', 'frozen', 'snacks', 'beverages', 'household', 'personal_care', 'restaurant_food', 'other'] },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            nutriScore: { type: Type.STRING },
            boundingBox: {
              type: Type.OBJECT,
              properties: {
                  ymin: { type: Type.NUMBER },
                  xmin: { type: Type.NUMBER },
                  ymax: { type: Type.NUMBER },
                  xmax: { type: Type.NUMBER },
              },
              required: ["ymin", "xmin", "ymax", "xmax"]
            }
          },
          required: ["name", "itemType", "category"],
        },
      },
    });
    
    // FIX: Accessing .text directly on response object as per extracting text output rules.
    const result = parseJson(response.text);
    
    let boundingBox: BoundingBox | undefined;
    if (result.boundingBox) {
        const img = new Image();
        img.src = resizedImage;
        await new Promise(r => img.onload = r);
        boundingBox = {
            x: (result.boundingBox.xmin / 1000) * img.width,
            y: (result.boundingBox.ymin / 1000) * img.height,
            width: ((result.boundingBox.xmax - result.boundingBox.xmin) / 1000) * img.width,
            height: ((result.boundingBox.ymax - result.boundingBox.ymin) / 1000) * img.height
        };
    }

    return { 
        name: result.name || '', 
        tags: result.tags || [], 
        nutriScore: result.nutriScore as NutriScore, 
        itemType: result.itemType || 'product',
        category: result.category || 'other',
        boundingBox, 
        image: resizedImage 
    };
  } catch (error) {
    console.error("AI Analysis failed:", error);
    throw error;
  }
};

export const analyzeIngredientsImage = async (base64Image: string): Promise<{ ingredients: string[]; allergens: string[]; isLactoseFree: boolean; isVegan: boolean; isGlutenFree: boolean; }> => {
    const resizedImage = await resizeImage(base64Image, 'text');
    const match = resizedImage.match(/^data:(image\/[a-z]+);base64,(.*)$/);
    if (!match) throw new Error("Invalid image format.");
    
    try {
      const gemini = getAiClient();
      // FIX: Updated model to gemini-3-flash-preview.
      const response = await gemini.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [
            { inlineData: { mimeType: match[1], data: match[2] } },
            { text: "Extract ingredients/allergens and check dietary flags." }
        ]},
        config: {
          temperature: 0,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
              allergens: { type: Type.ARRAY, items: { type: Type.STRING } },
              isLactoseFree: { type: Type.BOOLEAN },
              isVegan: { type: Type.BOOLEAN },
              isGlutenFree: { type: Type.BOOLEAN },
            }
          },
        },
      });
      // FIX: Accessing .text directly on response object.
      return parseJson(response.text);
    } catch (error) {
      console.error("Ingredients scan failed:", error);
      throw error;
    }
};

export const performConversationalSearch = async (query: string, items: FoodItem[]): Promise<string[]> => {
  if (!query || items.length === 0) return [];
  const gemini = getAiClient();
  // FIX: Updated model to gemini-3-pro-preview for complex reasoning/searching tasks.
  const response = await gemini.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: { parts: [{ text: `Search Query: "${query}"\nData: ${JSON.stringify(items.map(i => ({ id: i.id, n: i.name, t: i.tags })))}` }] },
    config: {
      systemInstruction: "Return JSON: { matchingIds: string[] }.",
      responseMimeType: "application/json"
    },
  });
  // FIX: Accessing .text directly on response object.
  return parseJson(response.text).matchingIds || [];
};

export const parseShoppingList = async (input: string): Promise<{ name: string; quantity: number; category: GroceryCategory }[]> => {
    const gemini = getAiClient();
    // FIX: Updated model to gemini-3-flash-preview.
    const response = await gemini.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [{ text: `List: "${input}"` }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    items: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                quantity: { type: Type.NUMBER },
                                category: { type: Type.STRING }
                            }
                        }
                    }
                }
            }
        }
    });
    // FIX: Accessing .text directly on response object.
    return parseJson(response.text).items || [];
};

export const analyzeReceiptImage = async (base64Image: string, context: { id: string, name: string }[] = []): Promise<Partial<Receipt> & { items: Partial<ReceiptItem>[] }> => {
    const resizedImage = await resizeImage(base64Image, 'receipt');
    const match = resizedImage.match(/^data:(image\/[a-z]+);base64,(.*)$/);
    if (!match) throw new Error("Invalid image format.");

    const gemini = getAiClient();
    // FIX: Updated model to gemini-3-flash-preview.
    const response = await gemini.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [
            { inlineData: { mimeType: match[1], data: match[2] } },
            { text: `Analyze receipt. Map items to context if possible: ${JSON.stringify(context)}` }
        ]},
        config: {
            temperature: 0.1,
            responseMimeType: "application/json"
        }
    });
    // FIX: Accessing .text directly on response object.
    const result = parseJson(response.text);
    return {
        merchant_name: result.merchant_name,
        date: result.date || new Date().toISOString(),
        total_amount: result.total_amount || 0,
        currency: result.currency || 'EUR',
        items: result.items || []
    };
};

export const findNearbyRestaurants = async (latitude: number, longitude: number): Promise<{ name: string; cuisine?: string }[]> => {
    try {
        const gemini = getAiClient();
        // FIX: Google Maps grounding is only supported in Gemini 2.5 series models. 
        // Using 'gemini-2.5-flash' explicitly for this tool.
        const response = await gemini.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "List good restaurants nearby.",
            config: {
                tools: [{ googleMaps: {} }],
                toolConfig: {
                    retrievalConfig: {
                        latLng: {
                            latitude,
                            longitude
                        }
                    }
                },
            },
        });

        const restaurants: { name: string; cuisine?: string }[] = [];
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

        if (chunks) {
            chunks.forEach((chunk: any) => {
                if (chunk.maps && chunk.maps.title) {
                    restaurants.push({
                        name: chunk.maps.title,
                    });
                }
            });
        }
        
        return restaurants;
    } catch (error) {
        console.error("Failed to find nearby restaurants:", error);
        return [];
    }
};
