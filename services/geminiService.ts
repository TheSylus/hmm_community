
import { GoogleGenAI, Type } from "@google/genai";
import { FoodItem, NutriScore, GroceryCategory, Receipt, ReceiptItem } from "../types";
import { AiFoodAnalysisSchema, AiIngredientsAnalysisSchema, AiReceiptSchema } from "./schemas";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const hasValidApiKey = (): boolean => {
    return !!process.env.API_KEY;
};

export function getAiClient() {
    if (!process.env.API_KEY) {
        throw new Error("API key not found. Please ensure it's set in your environment variables.");
    }
    return ai;
}

// QUALITY GATE: Image Optimization
const resizeImage = (base64Str: string, mode: 'main' | 'text' | 'receipt' = 'main'): Promise<string> => {
    let maxWidth = 1024;
    let quality = 0.85;

    if (mode === 'main') {
        maxWidth = 1024;
        quality = 0.85;
    } else if (mode === 'text') {
        maxWidth = 1200;
        quality = 0.7;
    } else if (mode === 'receipt') {
        maxWidth = 1536;
        quality = 0.8;
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

            if (height > 10000) { 
                const scale = 10000 / height;
                height = 10000;
                width = Math.round(width * scale);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            } else {
                resolve(base64Str);
            }
        };
        img.onerror = () => {
            resolve(base64Str);
        };
    });
};

const parseJsonFromString = (text: string) => {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1]);
    }
    try {
        return JSON.parse(text);
    } catch (e) {
        const arrayMatch = text.match(/(\[[\s\S]*\])/);
        if (arrayMatch && arrayMatch[1]) {
            try { return JSON.parse(arrayMatch[1]); } catch (p) {}
        }
        const objectMatch = text.match(/(\{[\s\S]*\})/);
        if (objectMatch && objectMatch[1]) {
             try { return JSON.parse(objectMatch[1]); } catch (p) {}
        }
    }
    throw new Error("Could not parse JSON from the AI response.");
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
  if (!match) throw new Error("Invalid base64 image string.");
  const mimeType = match[1];
  const data = match[2];

  try {
    const gemini = getAiClient();
    const imagePart = { inlineData: { mimeType, data } };
    const textPart = {
      text: "Identify item. Name: Extract EXACT brand + product text. Type: 'product', 'drugstore', 'dish'. Category: produce, bakery, meat_fish, dairy_eggs, pantry, frozen, snacks, beverages, household, personal_care, restaurant_food, other. Tags: max 5 keywords. Nutri-Score (A-E). BoundingBox: DETECT EXACT PIXEL BOUNDARIES of the single main object.",
    };

    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [imagePart, textPart] },
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
          required: ["name", "tags", "itemType", "category"],
        },
      },
    });
    
    const rawResult = parseJsonFromString(response.text);
    
    // ZOD VALIDATION
    const parsedResult = AiFoodAnalysisSchema.safeParse(rawResult);
    
    if (!parsedResult.success) {
        console.warn("AI Validation Failed", parsedResult.error);
        throw new Error("AI response did not match expected schema.");
    }
    
    const result = parsedResult.data;

    let boundingBox: BoundingBox | undefined;
    if (result.boundingBox) {
        const img = new Image();
        img.src = resizedImage;
        await new Promise(r => { img.onload = r; });
        const w = img.width;
        const h = img.height;
        boundingBox = {
            x: (result.boundingBox.xmin / 1000) * w,
            y: (result.boundingBox.ymin / 1000) * h,
            width: ((result.boundingBox.xmax - result.boundingBox.xmin) / 1000) * w,
            height: ((result.boundingBox.ymax - result.boundingBox.ymin) / 1000) * h
        };
    }
    return { 
        name: result.name || '', 
        tags: result.tags || [], 
        nutriScore: (result.nutriScore as NutriScore) || undefined, 
        itemType: (result.itemType as any) || 'product',
        category: (result.category as any) || 'other',
        boundingBox, 
        image: resizedImage 
    };
  } catch (error) {
    console.error("Error analyzing food image:", error);
    throw error;
  }
};

export const analyzeIngredientsImage = async (base64Image: string): Promise<{ ingredients: string[]; allergens: string[]; isLactoseFree: boolean; isVegan: boolean; isGlutenFree: boolean; }> => {
    const resizedImage = await resizeImage(base64Image, 'text');
    const match = resizedImage.match(/^data:(image\/[a-z]+);base64,(.*)$/);
    if (!match) throw new Error("Invalid base64 image string.");
    const mimeType = match[1];
    const data = match[2];
    try {
      const gemini = getAiClient();
      const imagePart = { inlineData: { mimeType, data } };
      const textPart = { text: "Extract ingredients/INCI. List allergens. Boolean checks: isLactoseFree, isVegan, isGlutenFree." };
      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [imagePart, textPart] },
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
            },
            required: ["ingredients", "allergens", "isLactoseFree", "isVegan", "isGlutenFree"],
          },
        },
      });
      const rawResult = parseJsonFromString(response.text);
      
      // ZOD VALIDATION
      const parsed = AiIngredientsAnalysisSchema.safeParse(rawResult);
      if (!parsed.success) {
          console.warn("Ingredients validation failed", parsed.error);
          return { ingredients: [], allergens: [], isLactoseFree: false, isVegan: false, isGlutenFree: false };
      }
      
      return {
          ingredients: parsed.data.ingredients || [],
          allergens: parsed.data.allergens || [],
          isLactoseFree: !!parsed.data.isLactoseFree,
          isVegan: !!parsed.data.isVegan,
          isGlutenFree: !!parsed.data.isGlutenFree
      };
    } catch (error) {
      console.error("Error analyzing ingredients image:", error);
      throw error;
    }
  };

export const findNearbyRestaurants = async (latitude: number, longitude: number): Promise<{ name: string; cuisine?: string }[]> => {
  try {
    const gemini = getAiClient();
    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [{ text: "Find 5 nearby restaurants. Return JSON array: [{name, cuisine}]." }] },
      config: {
        temperature: 0.1,
        tools: [{googleMaps: {}}],
        toolConfig: { retrievalConfig: { latLng: { latitude, longitude } } }
      }
    });
    const result = parseJsonFromString(response.text);
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error finding nearby restaurants:", error);
    throw error;
  }
};

export const performConversationalSearch = async (query: string, items: FoodItem[]): Promise<string[]> => {
  if (!query || items.length === 0) return [];
  const optimizedItems = items.map(item => ({
      id: item.id,
      n: item.name,
      t: item.itemType,
      c: item.category,
      r: item.rating,
      nt: item.notes,
      tg: item.tags
  }));
  try {
    const gemini = getAiClient();
    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        temperature: 0.2,
        systemInstruction: "Search engine. Return IDs of items that match query. Keys: n=name, nt=notes, tg=tags.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { matchingIds: { type: Type.ARRAY, items: { type: Type.STRING } } },
          required: ["matchingIds"],
        },
      },
      contents: { parts: [{ text: `Query: "${query}"\nData: ${JSON.stringify(optimizedItems)}` }] },
    });
    return parseJsonFromString(response.text).matchingIds || [];
  } catch (error) {
    console.error("Error performing conversational search:", error);
    throw error;
  }
};

export const parseShoppingList = async (input: string): Promise<{ name: string; quantity: number; category: GroceryCategory }[]> => {
    try {
        const gemini = getAiClient();
        const response = await gemini.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{ text: `Extract items from this shopping list: "${input}". JSON.` }] },
            config: {
                temperature: 0,
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
                                    category: { type: Type.STRING, enum: ['produce', 'bakery', 'meat_fish', 'dairy_eggs', 'pantry', 'frozen', 'snacks', 'beverages', 'household', 'personal_care', 'restaurant_food', 'other'] }
                                },
                                required: ["name", "quantity", "category"]
                            }
                        }
                    },
                    required: ["items"]
                }
            }
        });
        const result = parseJsonFromString(response.text);
        return result.items || [];
    } catch (error) {
        console.error("Error parsing shopping list:", error);
        throw error;
    }
};

// --- IMPROVED RECEIPT ANALYSIS WITH CONTEXT ---

export const analyzeReceiptImage = async (
    base64Image: string, 
    shoppingListContext: { id: string, name: string }[] = []
): Promise<Omit<Partial<Receipt>, 'items'> & { items: Partial<ReceiptItem>[] }> => {
    const resizedImage = await resizeImage(base64Image, 'receipt');
    const match = resizedImage.match(/^data:(image\/[a-z]+);base64,(.*)$/);
    if (!match) throw new Error("Invalid base64 image string.");
    const mimeType = match[1];
    const data = match[2];

    // Prepare context prompt
    let contextStr = "";
    if (shoppingListContext.length > 0) {
        contextStr = `\nI have recently bought items from my shopping list. Try to map receipt lines to these IDs if they match semantically: ${JSON.stringify(shoppingListContext)}`;
    }

    try {
        const gemini = getAiClient();
        const response = await gemini.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { inlineData: { mimeType, data } },
                    { text: `Analyze this receipt. Extract merchant, date (YYYY-MM-DD), currency, total. Extract line items (name, price, quantity). Categorize: produce, bakery, meat_fish, dairy_eggs, pantry, frozen, snacks, beverages, household, personal_care, restaurant_food, other.${contextStr}\nIf a line item on the receipt matches an item from the provided shopping list context, return its 'id' in the 'food_item_id' field for that item.` }
                ]
            },
            config: {
                temperature: 0.1,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        merchant_name: { type: Type.STRING },
                        date: { type: Type.STRING },
                        total_amount: { type: Type.NUMBER },
                        currency: { type: Type.STRING },
                        items: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    raw_name: { type: Type.STRING },
                                    price: { type: Type.NUMBER },
                                    quantity: { type: Type.NUMBER },
                                    category: { type: Type.STRING, enum: ['produce', 'bakery', 'meat_fish', 'dairy_eggs', 'pantry', 'frozen', 'snacks', 'beverages', 'household', 'personal_care', 'restaurant_food', 'other'] },
                                    food_item_id: { type: Type.STRING, description: "The ID from the context if matched." }
                                },
                                required: ["raw_name", "price", "category"]
                            }
                        }
                    },
                    required: ["merchant_name", "total_amount", "items"]
                }
            }
        });

        const rawResult = parseJsonFromString(response.text);
        
        // ZOD VALIDATION
        const parsed = AiReceiptSchema.safeParse(rawResult);
        if (!parsed.success) {
             console.warn("Receipt validation failed", parsed.error);
             throw new Error("Validation failed");
        }
        
        const result = parsed.data;

        return {
            merchant_name: result.merchant_name,
            date: result.date || new Date().toISOString().split('T')[0],
            total_amount: result.total_amount || 0,
            currency: result.currency || 'EUR',
            items: (result.items || []) as Partial<ReceiptItem>[]
        };
    } catch (error) {
        console.error("Error analyzing receipt:", error);
        throw error;
    }
}
