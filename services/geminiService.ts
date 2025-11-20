import { GoogleGenAI, Type } from "@google/genai";
import { FoodItem, NutriScore } from "../types";

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

// Helper to resize images before sending to AI to save bandwidth and ensure faster processing.
// While Gemini Image tokens are often fixed, smaller payloads reduce latency and parsing overhead.
const resizeImage = (base64Str: string, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
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
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            } else {
                resolve(base64Str); // Fallback if canvas fails
            }
        };
        img.onerror = () => {
            resolve(base64Str); // Fallback if image fails to load
        };
    });
};


// FIX: Replaced brittle JSON parsing with a more robust implementation.
// This version can extract a JSON object from within a markdown code block,
// making it more resilient to variations in the AI's response format,
// especially when using grounding tools which may return additional text.
const parseJsonFromString = (text: string) => {
    // Attempt to extract JSON from a markdown code block
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1]);
    }

    // Fallback for cases where the entire string is a JSON object
    try {
        return JSON.parse(text);
    } catch (e) {
        // If parsing fails, the text itself might be the intended (non-JSON) response
        // This is common with grounding tools that might return natural language.
        // We will attempt to find a JSON-like structure within the text.
        const arrayMatch = text.match(/(\[[\s\S]*\])/);
        if (arrayMatch && arrayMatch[1]) {
            try {
                return JSON.parse(arrayMatch[1]);
            } catch (parseError) {
                console.error("Failed to parse extracted array:", parseError);
            }
        }
    }
    // If all parsing fails, which can happen with grounding, we can't process it as JSON.
    // The calling function must handle this case. Here we throw to indicate failure.
    throw new Error("Could not parse JSON from the AI response.");
};


export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export const analyzeFoodImage = async (base64Image: string): Promise<{ name: string; tags: string[]; nutriScore?: NutriScore; boundingBox?: BoundingBox }> => {
  // Optimization: Resize image to max 800px width. High resolution is rarely needed for general object detection
  // and this significantly reduces the payload size.
  const resizedImage = await resizeImage(base64Image, 800);

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
      text: "Analyze this image of a food product. Identify the product's full name, provide up to 5 relevant tags, and find the Nutri-Score (A-E). Also, identify the primary food product in the image and return its bounding box. The bounding box should be an object with 'x', 'y', 'width', and 'height' properties, where each value is normalized between 0.0 and 1.0 (e.g., x=0.25 means 25% from the left edge). If any field is not found, return null for it. Return a single JSON object.",
    };

    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "The full name of the product as seen on the label.",
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of relevant tags for the product.",
            },
            nutriScore: {
              type: Type.STRING,
              description: "The Nutri-Score rating (A, B, C, D, or E) if visible. Null if not found.",
            },
            boundingBox: {
              type: Type.OBJECT,
              description: "Normalized bounding box of the main product.",
              properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  width: { type: Type.NUMBER },
                  height: { type: Type.NUMBER },
              }
            }
          },
          required: ["name", "tags"],
        },
      },
    });
    
    const result = JSON.parse(response.text);
    
    // Validate Nutri-Score before returning
    const validScores: NutriScore[] = ['A', 'B', 'C', 'D', 'E'];
    if (result.nutriScore && !validScores.includes(result.nutriScore.toUpperCase())) {
      result.nutriScore = null;
    }
    
    return result;

  } catch (error) {
    console.error("Error analyzing food image:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Could not analyze image with AI. Please try again or enter details manually.");
  }
};


export const analyzeIngredientsImage = async (base64Image: string): Promise<{ ingredients: string[]; allergens: string[]; isLactoseFree: boolean; isVegan: boolean; isGlutenFree: boolean; }> => {
    // Optimization: Resize image to max 1024px. We need slightly more resolution for text reading than object detection.
    const resizedImage = await resizeImage(base64Image, 1024);
    
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
        text: "Analyze this image of a food product's ingredients list. Extract the full list of ingredients. Also, extract a list of common allergens mentioned in the ingredients. Based on the ingredients, determine if the product is lactose-free, vegan, and/or gluten-free. Return a single JSON object with five keys: 'ingredients' (an array of strings), 'allergens' (an array of strings), 'isLactoseFree' (boolean), 'isVegan' (boolean), and 'isGlutenFree' (boolean). If a key cannot be determined, default the boolean to false and arrays to empty.",
      };
  
      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              ingredients: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "An array of strings, where each string is a single ingredient from the list.",
              },
               allergens: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "An array of strings, where each string is a potential allergen found in the ingredients list.",
              },
              isLactoseFree: {
                type: Type.BOOLEAN,
                description: "True if the product is lactose-free based on its ingredients, false otherwise.",
              },
              isVegan: {
                type: Type.BOOLEAN,
                description: "True if the product is vegan based on its ingredients, false otherwise.",
              },
              isGlutenFree: {
                type: Type.BOOLEAN,
                description: "True if the product is gluten-free based on its ingredients, false otherwise.",
              },
            },
            required: ["ingredients", "allergens", "isLactoseFree", "isVegan", "isGlutenFree"],
          },
        },
      });
      
      const result = JSON.parse(response.text);

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
      // FIX: Updated prompt to be more robust for JSON extraction.
      contents: { parts: [{ text: "List up to 10 restaurants near the provided location. For each, provide its name and main cuisine type. If cuisine is unknown, omit it. Format the response as a JSON array of objects, where each object has a 'name' and optional 'cuisine' key. The entire response should be a JSON array inside a markdown code block." }] },
      config: {
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
    
    // FIX: Using robust JSON parsing to handle potential markdown wrappers from grounding tool responses.
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

  // TOKEN OPTIMIZATION:
  // Instead of sending the full object structure with potentially empty fields,
  // we reconstruct a minimal object containing only the data present.
  // This significantly reduces the input token count for large lists.
  const optimizedItems = items.map(item => {
      const compact: any = {
          id: item.id,
          name: item.name,
          type: item.itemType
      };
      
      // Only add fields if they exist and are not empty
      if (item.rating) compact.rating = item.rating;
      if (item.notes && item.notes.trim()) compact.notes = item.notes;
      if (item.tags && item.tags.length > 0) compact.tags = item.tags;
      
      // Add specific fields only for dishes
      if (item.itemType === 'dish') {
          if (item.restaurantName) compact.restaurant = item.restaurantName;
          if (item.cuisineType) compact.cuisine = item.cuisineType;
      }
      
      // Add specific fields only for products
      if (item.itemType === 'product') {
           if (item.nutriScore) compact.nutriScore = item.nutriScore;
           // Only send dietary info if it's explicitly true (relevant)
           if (item.isLactoseFree) compact.lactoseFree = true;
           if (item.isVegan) compact.vegan = true;
           if (item.isGlutenFree) compact.glutenFree = true;
      }
      
      return compact;
  });

  try {
    const gemini = getAiClient();
    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: "You are a smart search assistant. Analyze the user's query and the provided food items. Return a JSON array containing only the `id` strings of the items that match the query. Match by name, semantic meaning of tags/notes/cuisine. If no items match, return an empty array.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchingIds: {
              type: Type.ARRAY,
              description: "An array of `id` strings for the food items that match the user's query.",
              items: { type: Type.STRING },
            },
          },
          required: ["matchingIds"],
        },
      },
      contents: {
        parts: [{ text: `User Query: "${query}"\n\nItems: ${JSON.stringify(optimizedItems)}` }]
      },
    });

    const result = JSON.parse(response.text);
    
    return result.matchingIds || [];

  } catch (error) {
    console.error("Error performing conversational search:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Could not perform AI search.");
  }
};