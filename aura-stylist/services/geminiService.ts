
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, StyleType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeItem = async (base64Image: string): Promise<AnalysisResult> => {
  const prompt = `Analyze this clothing item and suggest 3 distinct outfits (Casual, Business, Night Out). 
  1. Identify the item name and its core color palette (3-5 colors). Use ONLY Hex codes (e.g., #FFFFFF).
  2. Suggest a complimentary color palette that would look great with this item (3-5 accent colors). Use ONLY Hex codes.
  3. For each outfit, provide a description and list which Hex codes from BOTH palettes are primarily used in that specific look.
  Return the result in strictly valid JSON format.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Image.split(',')[1] } },
          { text: prompt }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          itemName: { type: Type.STRING },
          originalPalette: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Hex codes for the item's colors" },
          complimentaryPalette: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Hex codes for accent/complimentary colors" },
          description: { type: Type.STRING },
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: [StyleType.CASUAL, StyleType.BUSINESS, StyleType.NIGHT_OUT] },
                description: { type: Type.STRING },
                colorsUsed: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["type", "description", "colorsUsed"]
            }
          }
        },
        required: ["itemName", "originalPalette", "complimentaryPalette", "description", "suggestions"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateOutfitImage = async (
  itemDescription: string, 
  outfitDescription: string, 
  style: StyleType
): Promise<string> => {
  const prompt = `A professional high-quality fashion flat-lay image on a clean solid off-white background. 
  The layout features: 1) ${itemDescription}. 2) These matching items: ${outfitDescription}. 
  The overall vibe is ${style}. Modern lighting, minimalist aesthetic, no humans, just the clothes and accessories arranged neatly in a grid.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Failed to generate image");
};

export const editOutfitImage = async (
  base64Image: string, 
  editPrompt: string
): Promise<string> => {
  const prompt = `Edit this fashion flat-lay image based on the following instruction: "${editPrompt}". Keep the clothing items consistent but modify according to the request.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/png', data: base64Image.split(',')[1] } },
        { text: prompt }
      ]
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Failed to edit image");
};
