
import { GoogleGenAI, Type } from "@google/genai";
import { FoodItem, NutriScore, GroceryCategory, Receipt, ReceiptItem } from "../types";

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
// Strategy Shift: "Context Aware Resizing".
// - 'main' (Product): Square crop, high res for text reading on package.
// - 'text' (Ingredients): High res, no cropping, preserving details.
// - 'receipt' (Finance): High width, unlimited height to support long receipts.
const resizeImage = (base64Str: string, mode: 'main' | 'text' | 'receipt' = 'main'): Promise<string> => {
    // Settings based on mode
    let maxWidth = 1024;
    let quality = 0.85;
    let keepAspectRatio = true;

    if (mode === 'main') {
        maxWidth = 1024;
        quality = 0.85;
        keepAspectRatio = true; // Still keep aspect, but logic below handles dimensions
    } else if (mode === 'text') {
        maxWidth = 1200;
        quality = 0.7; // Text usually has high contrast, lower quality JPEG is fine
    } else if (mode === 'receipt') {
        maxWidth = 1536; // Receipts need high width for small thermal printer font
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

            // For receipts, we do NOT want to limit height aggressively, 
            // but we might want to ensure it doesn't break canvas limits (usually 16k pixels)
            if (height > 10000) { 
                // Extreme case safeguard
                const scale = 10000 / height;
                height = 10000;
                width = Math.round(width * scale);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Optional: Contrast enhancement could be added here for receipts
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
  // QUALITY GATE: High Resolution for Edge Detection
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

    // Prompt Optimization: Precision Focus
    // We emphasize finding the "single main object" and ignoring background clutter.
    // Asking for "EXACT PIXEL BOUNDARIES" helps the model focus on edge detection.
    const textPart = {
      text: "Identify item. Name: Extract EXACT brand + product text from packaging (OCR). Type: 'product' (grocery), 'drugstore' (non-food), 'dish' (meal). Category: produce, bakery, meat_fish, dairy_eggs, pantry, frozen, snacks, beverages, household, personal_care, restaurant_food, other. Tags: max 5 keywords. Nutri-Score (A-E) if visible. BoundingBox: DETECT EXACT PIXEL BOUNDARIES of the single main product object. Exclude background/table. Be precise.",
    };

    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        temperature: 0.1, // Low temp for factual consistency
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
                  ymin: { type: Type.NUMBER, description: "Top coordinate (0-1000 scale)" },
                  xmin: { type: Type.NUMBER, description: "Left coordinate (0-1000 scale)" },
                  ymax: { type: Type.NUMBER, description: "Bottom coordinate (0-1000 scale)" },
                  xmax: { type: Type.NUMBER, description: "Right coordinate (0-1000 scale)" },
              },
              required: ["ymin", "xmin", "ymax", "xmax"]
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
    
    // Coordinate Mapping: 0-1000 scale -> Pixel Coordinates
    // The model returns normalized coordinates (0-1000). We must map them to the resized image dimensions.
    // We need the dimensions of the RESIZED image to calculate this correctly.
    let boundingBox: BoundingBox | undefined;
    
    if (result.boundingBox) {
        // Load image to get actual dimensions of the blob we sent
        const img = new Image();
        img.src = resizedImage;
        await new Promise(r => { img.onload = r; }); // Wait for load to get dims
        
        const w = img.width;
        const h = img.height;
        
        // Convert 1000-scale to pixels
        const ymin = (result.boundingBox.ymin / 1000) * h;
        const xmin = (result.boundingBox.xmin / 1000) * w;
        const ymax = (result.boundingBox.ymax / 1000) * h;
        const xmax = (result.boundingBox.xmax / 1000) * w;
        
        boundingBox = {
            x: xmin,
            y: ymin,
            width: xmax - xmin,
            height: ymax - ymin
        };
    }
    
    return { ...result, boundingBox, image: resizedImage };

  } catch (error) {
    console.error("Error analyzing food image:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Could not analyze image with AI. Please try again or enter details manually.");
  }
};


export const analyzeIngredientsImage = async (base64Image: string): Promise<{ ingredients: string[]; allergens: string[]; isLactoseFree: boolean; isVegan: boolean; isGlutenFree: boolean; }> => {
    // Text Mode: 1024px is usually enough for text, medium compression fine for contrasty text.
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
        temperature: 0.2,
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

// --- RECEIPT ANALYSIS FEATURE ---

export const analyzeReceiptImage = async (base64Image: string): Promise<Partial<Receipt> & { items: Partial<ReceiptItem>[] }> => {
    // 1. Optimize Image for Receipts (Longer, higher resolution)
    const resizedImage = await resizeImage(base64Image, 'receipt');
    
    const match = resizedImage.match(/^data:(image\/[a-z]+);base64,(.*)$/);
    if (!match) throw new Error("Invalid base64 image string.");
    const mimeType = match[1];
    const data = match[2];

    try {
        const gemini = getAiClient();
        
        const response = await gemini.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { inlineData: { mimeType, data } },
                    { text: "Analyze this receipt. Extract merchant, date (YYYY-MM-DD), currency (EUR/USD), total. Extract all line items with name, price, quantity (if available, else 1). Categorize each item strictly into one of: 'produce', 'bakery', 'meat_fish', 'dairy_eggs', 'pantry', 'frozen', 'snacks', 'beverages', 'household', 'personal_care', 'restaurant_food', 'other'. Ignore discount lines or subtotal lines." }
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
                                    category: { 
                                        type: Type.STRING,
                                        enum: ['produce', 'bakery', 'meat_fish', 'dairy_eggs', 'pantry', 'frozen', 'snacks', 'beverages', 'household', 'personal_care', 'restaurant_food', 'other']
                                    }
                                },
                                required: ["raw_name", "price", "category"]
                            }
                        }
                    },
                    required: ["merchant_name", "total_amount", "items"]
                }
            }
        });

        const result = parseJsonFromString(response.text);
        
        // Ensure date is valid or fallback to today
        let date = result.date;
        if (!date || isNaN(Date.parse(date))) {
            date = new Date().toISOString().split('T')[0];
        }

        return {
            merchant_name: result.merchant_name,
            date: date,
            total_amount: result.total_amount,
            currency: result.currency || 'EUR',
            items: result.items || []
        };

    } catch (error) {
        console.error("Error analyzing receipt:", error);
        throw new Error("Could not analyze receipt.");
    }
}
