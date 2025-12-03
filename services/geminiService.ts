
import { GoogleGenAI, Type } from "@google/genai";
import { FoodItem, NutriScore, GroceryCategory } from "../types";

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
// Gemini charges based on image tiles (512x512). 
// 1. 'main' mode (product detection): Resize to 768px. 
//    - 512px is too small for reliable text reading (OCR) of product names.
//    - 768px ensures text legibility while staying efficient (approx 770 tokens).
// 2. 'text' mode (ingredients): Resize to 1024px to keep fine print legible.
const resizeImage = (base64Str: string, mode: 'main' | 'text' = 'main'): Promise<string> => {
    // Settings based on mode
    const maxWidth = mode === 'main' ? 768 : 1024;
    const quality = mode === 'main' ? 0.6 : 0.6; // Keep compression high to save bandwidth

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
                // Optimization: Use medium quality for standard photos to save bandwidth/tokens
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            } else {
                resolve(base64Str); // Fallback
            }
        };
        img.onerror = () => {
            resolve(base64Str); // Fallback
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
            try {
                return JSON.parse(arrayMatch[1]);
            } catch (parseError) {
                console.error("Failed to parse extracted array:", parseError);
            }
        }
        
        const objectMatch = text.match(/(\{[\s\S]*\})/);
        if (objectMatch && objectMatch[1]) {
             try {
                return JSON.parse(objectMatch[1]);
            } catch (parseError) {
                console.error("Failed to parse extracted object:", parseError);
            }
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
  // QUALITY GATE: Resize for balance between OCR accuracy and Token cost.
  const resizedImage = await resizeImage(base64Image, 'main');

  const match = resizedImage.match(/^data:(image\/[a-z]+);base64,(.*)$/);
  if (!match) {
    throw new Error("Invalid base64 image string.");
  }
  const mimeType = match[1];
  const data = match[2];

  try {
    const gemini = getAiClient();

    const imagePart = {
      inlineData: {
        mimeType,
        data,
      },
    };

    // Prompt Optimization: 
    // Explicitly requesting "EXACT text from packaging" forces the model to perform OCR.
    // "BoundingBox: tight crop around main product only" fixes the coordinate mismatch issue.
    const textPart = {
      text: "Identify item. Name: Extract EXACT brand + product text from packaging (OCR). Type: 'product' (grocery), 'drugstore' (non-food), 'dish' (meal). Category: produce, bakery, meat_fish, dairy_eggs, pantry, frozen, snacks, beverages, household, personal_care, restaurant_food, other. Tags: max 5 keywords. Nutri-Score (A-E) if visible. BoundingBox: tight crop encompassing ONLY the main product packaging, ignore background.",
    };

    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        temperature: 0.1, // QUALITY GATE: Low temp for factual image recognition
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            itemType: {
              type: Type.STRING,
              enum: ['product', 'drugstore', 'dish']
            },
            category: {
                type: Type.STRING,
                enum: ['produce', 'bakery', 'meat_fish', 'dairy_eggs', 'pantry', 'frozen', 'snacks', 'beverages', 'household', 'personal_care', 'restaurant_food', 'other']
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            nutriScore: { type: Type.STRING },
            boundingBox: {
              type: Type.OBJECT,
              properties: {
                  x: { type: Type.NUMBER, description: "X coordinate in pixels" },
                  y: { type: Type.NUMBER, description: "Y coordinate in pixels" },
                  width: { type: Type.NUMBER, description: "Width in pixels" },
                  height: { type: Type.NUMBER, description: "Height in pixels" },
              },
              required: ["x", "y", "width", "height"]
            }
          },
          required: ["name", "tags", "itemType", "category"],
        },
      },
    });
    
    const result = parseJsonFromString(response.text);
    
    const validScores: NutriScore[] = ['A', 'B', 'C', 'D', 'E'];
    if (result.nutriScore && !validScores.includes(result.nutriScore.toUpperCase())) {
      result.nutriScore = null;
    }
    
    // CRITICAL FIX: Return the RESIZED image. 
    // The UI must display this specific image for the coordinates to be valid.
    return { ...result, image: resizedImage };

  } catch (error) {
    console.error("Error analyzing food image:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Could not analyze image with AI. Please try again or enter details manually.");
  }
};


export const analyzeIngredientsImage = async (base64Image: string): Promise<{ ingredients: string[]; allergens: string[]; isLactoseFree: boolean; isVegan: boolean; isGlutenFree: boolean; }> => {
    // QUALITY GATE: Text Mode. 
    // Needs 1024px for legibility, but we increase compression (0.6) to save size.
    const resizedImage = await resizeImage(base64Image, 'text');
    
    const match = resizedImage.match(/^data:(image\/[a-z]+);base64,(.*)$/);
    if (!match) {
      throw new Error("Invalid base64 image string.");
    }
    const mimeType = match[1];
    const data = match[2];
  
    try {
      const gemini = getAiClient();
  
      const imagePart = {
        inlineData: {
          mimeType,
          data,
        },
      };
  
      const textPart = {
        text: "Extract ingredients/INCI. List allergens. Boolean checks: isLactoseFree, isVegan, isGlutenFree.",
      };
  
      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [imagePart, textPart] },
        config: {
          temperature: 0, // QUALITY GATE: 0 for pure OCR/Extraction
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
      
      const result = parseJsonFromString(response.text);

      return {
        ingredients: result.ingredients || [],
        allergens: result.allergens || [],
        isLactoseFree: result.isLactoseFree || false,
        isVegan: result.isVegan || false,
        isGlutenFree: result.isGlutenFree || false,
      };
  
    } catch (error) {
      console.error("Error analyzing ingredients image:", error);
      if (error instanceof Error) {
          throw error;
      }
      throw new Error("Could not analyze ingredients list with AI.");
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
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude,
              longitude
            }
          }
        }
      }
    });
    
    const result = parseJsonFromString(response.text);
    return Array.isArray(result) ? result : [];

  } catch (error) {
    console.error("Error finding nearby restaurants:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Could not find nearby restaurants using AI.");
  }
};

export const performConversationalSearch = async (query: string, items: FoodItem[]): Promise<string[]> => {
  if (!query || items.length === 0) {
    return [];
  }

  // QUALITY GATE: Aggressive Minification
  // We strip keys that have null values and use short key names to save Input Tokens.
  const optimizedItems = items.map(item => {
      const compact: any = {
          id: item.id,
          n: item.name, // Name
          t: item.itemType, // Type
          c: item.category // Category
      };
      
      if (item.rating) compact.r = item.rating;
      if (item.notes) compact.nt = item.notes; // Notes
      if (item.tags && item.tags.length > 0) compact.tg = item.tags; // Tags
      
      if (item.itemType === 'dish') {
          if (item.restaurantName) compact.rn = item.restaurantName;
          if (item.cuisineType) compact.ct = item.cuisineType;
      }
      
      return compact;
  });

  try {
    const gemini = getAiClient();
    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        temperature: 0.2, // Low temp for search accuracy
        systemInstruction: "You are a search engine. Return IDs of items that match the user query semantically. Use the minified keys: n=name, nt=notes, tg=tags, rn=restaurant.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchingIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["matchingIds"],
        },
      },
      contents: {
        parts: [{ text: `Query: "${query}"\nData: ${JSON.stringify(optimizedItems)}` }]
      },
    });

    const result = parseJsonFromString(response.text);
    
    return result.matchingIds || [];

  } catch (error) {
    console.error("Error performing conversational search:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Could not perform AI search.");
  }
};

export const parseShoppingList = async (input: string): Promise<{ name: string; quantity: number; category: GroceryCategory }[]> => {
    try {
        const gemini = getAiClient();
        const response = await gemini.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{ text: `Extract items from this shopping list text: "${input}". Return JSON.` }] },
            config: {
                temperature: 0, // QUALITY GATE: 0 for deterministic parsing
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
                                    category: { 
                                        type: Type.STRING, 
                                        enum: ['produce', 'bakery', 'meat_fish', 'dairy_eggs', 'pantry', 'frozen', 'snacks', 'beverages', 'household', 'personal_care', 'restaurant_food', 'other']
                                    }
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
        throw new Error("Could not parse shopping list.");
    }
};
