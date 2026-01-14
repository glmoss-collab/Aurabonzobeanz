
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, StyleType, FashionDNA } from "../types";
import { getMimeTypeFromDataUrl, getBase64FromDataUrl } from "./imageValidationService";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

/**
 * Custom error types for better error handling
 */
export class GeminiAPIError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'GeminiAPIError';
  }
}

/**
 * Exponential backoff delay calculation
 */
const getRetryDelay = (attempt: number): number => {
  const delay = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt);
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay;
  return Math.min(delay + jitter, RETRY_CONFIG.maxDelayMs);
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Determines if an error is retryable
 */
const isRetryableError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // Network errors, rate limits, and server errors are retryable
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('rate limit') ||
      message.includes('503') ||
      message.includes('502') ||
      message.includes('500') ||
      message.includes('fetch failed')
    );
  }
  return false;
};

/**
 * Wraps an async function with retry logic
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < RETRY_CONFIG.maxRetries && isRetryableError(error)) {
        const delay = getRetryDelay(attempt);
        console.warn(
          `${context} failed (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}). ` +
          `Retrying in ${Math.round(delay)}ms...`,
          error
        );
        await sleep(delay);
      } else {
        break;
      }
    }
  }

  throw new GeminiAPIError(
    `${context} failed after ${RETRY_CONFIG.maxRetries + 1} attempts: ${lastError?.message}`,
    'MAX_RETRIES_EXCEEDED',
    false
  );
}

export const analyzeItem = async (base64Image: string): Promise<AnalysisResult> => {
  const prompt = `Analyze this clothing item and suggest 3 distinct outfits (Casual, Business, Night Out).
  1. Identify the item name and its core color palette (3-5 colors). Use ONLY Hex codes (e.g., #FFFFFF).
  2. Suggest a complimentary color palette that would look great with this item (3-5 accent colors). Use ONLY Hex codes.
  3. For each outfit, provide a description and list which Hex codes from BOTH palettes are primarily used in that specific look.
  Return the result in strictly valid JSON format.`;

  // Extract correct MIME type from data URL instead of hardcoding
  const mimeType = getMimeTypeFromDataUrl(base64Image);
  const base64Data = getBase64FromDataUrl(base64Image);

  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            { inlineData: { mimeType, data: base64Data } },
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

    const text = response.text;
    if (!text) {
      throw new GeminiAPIError('Empty response from AI model', 'EMPTY_RESPONSE', true);
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new GeminiAPIError('Failed to parse AI response', 'PARSE_ERROR', false);
    }
  }, 'Clothing analysis');
};

/**
 * Fashion DNA Analysis - Master Fashion Historian & Trend Forecaster
 * Provides iconographic analysis mapping clothing to specific eras, designers, and style movements
 */
export const analyzeFashionDNA = async (base64Image: string): Promise<FashionDNA> => {
  const prompt = `You are a master fashion historian and trend forecaster with encyclopedic knowledge spanning from
ancient textile arts to contemporary haute couture. You have studied under legendary curators at the Met's Costume Institute,
the V&A, and have advised leading fashion houses on archival research.

Analyze this garment with the discerning eye of a chief curator preparing an exhibition at a world-class fashion museum.
Your analysis should reflect the scholarly depth of a Vogue Runway editorial combined with the historical precision
of academic fashion research.

ICONOGRAPHIC ANALYSIS FRAMEWORK:

1. PRIMARY ERA IDENTIFICATION: Identify the dominant historical period this piece channels. Be specific
   (e.g., "Mid-Century American Sportswear" not just "1950s").

2. STYLE MOVEMENTS: Connect to 2-3 fashion movements that inform this piece's DNA
   (e.g., Bauhaus minimalism, Memphis design, Japanese avant-garde, British punk, etc.)

3. DESIGNER INFLUENCES: Cite 2-3 specific designers or fashion houses whose signature elements are echoed here.
   Include their peak era and what specific design signature is referenced.

4. SILHOUETTE ANALYSIS: Describe the construction, proportions, and architectural elements using proper
   fashion terminology (raglan sleeves, drop shoulder, A-line, bias cut, etc.)

5. FABRIC INTELLIGENCE: Analyze the textile - its likely composition, weave/knit structure, weight,
   and how it contributes to the garment's character.

6. CULTURAL CONTEXT: Place this piece within its broader cultural moment - what social, artistic,
   or political movements does it reflect?

7. MODERN INTERPRETATION: How does this piece translate historical references for contemporary wear?

8. INVESTMENT POTENTIAL: Classify as Heritage Piece, Contemporary Classic, Trend-Forward, or Timeless Essential.

9. STYLE ARCHETYPE: What fashion archetype does this piece serve? (The Bohemian, The Minimalist, The Power Player, etc.)

10. EDITORIAL NOTES: Write a brief, evocative description as if for a luxury fashion publication -
    poetic yet informative, suitable for a high-end lookbook.

Return structured JSON with deep fashion intelligence.`;

  const mimeType = getMimeTypeFromDataUrl(base64Image);
  const base64Data = getBase64FromDataUrl(base64Image);

  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            primaryEra: { type: Type.STRING, description: "The dominant historical era this piece channels" },
            eraYearRange: { type: Type.STRING, description: "Specific year range (e.g., '1965-1972')" },
            styleMovements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  period: { type: Type.STRING },
                  characteristics: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["name", "period", "characteristics"]
              }
            },
            designerInfluences: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Designer or fashion house name" },
                  era: { type: Type.STRING, description: "Their peak era" },
                  signature: { type: Type.STRING, description: "Their signature design element referenced" },
                  relevance: { type: Type.STRING, description: "How this piece echoes their work" }
                },
                required: ["name", "era", "signature", "relevance"]
              }
            },
            silhouetteAnalysis: { type: Type.STRING, description: "Technical analysis of construction and proportions" },
            fabricIntelligence: { type: Type.STRING, description: "Textile analysis and contribution to character" },
            culturalContext: { type: Type.STRING, description: "Broader cultural and social context" },
            modernInterpretation: { type: Type.STRING, description: "How historical references translate to contemporary wear" },
            investmentPotential: {
              type: Type.STRING,
              enum: ['Heritage Piece', 'Contemporary Classic', 'Trend-Forward', 'Timeless Essential']
            },
            styleArchetype: { type: Type.STRING, description: "The fashion archetype this piece serves" },
            editorialNotes: { type: Type.STRING, description: "Evocative description for luxury publication" }
          },
          required: [
            "primaryEra", "eraYearRange", "styleMovements", "designerInfluences",
            "silhouetteAnalysis", "fabricIntelligence", "culturalContext",
            "modernInterpretation", "investmentPotential", "styleArchetype", "editorialNotes"
          ]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new GeminiAPIError('Empty response from fashion analysis', 'EMPTY_RESPONSE', true);
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new GeminiAPIError('Failed to parse fashion DNA analysis', 'PARSE_ERROR', false);
    }
  }, 'Fashion DNA analysis');
};

export const generateOutfitImage = async (
  itemDescription: string,
  outfitDescription: string,
  style: StyleType
): Promise<string> => {
  const prompt = `A professional high-quality fashion flat-lay image on a clean solid off-white background.
  The layout features: 1) ${itemDescription}. 2) These matching items: ${outfitDescription}.
  The overall vibe is ${style}. Modern lighting, minimalist aesthetic, no humans, just the clothes and accessories arranged neatly in a grid.`;

  return withRetry(async () => {
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
        const imageMime = part.inlineData.mimeType || 'image/png';
        return `data:${imageMime};base64,${part.inlineData.data}`;
      }
    }
    throw new GeminiAPIError('No image data in response', 'NO_IMAGE_DATA', true);
  }, 'Outfit image generation');
};

export const editOutfitImage = async (
  base64Image: string,
  editPrompt: string
): Promise<string> => {
  const prompt = `Edit this fashion flat-lay image based on the following instruction: "${editPrompt}". Keep the clothing items consistent but modify according to the request.`;

  // Extract correct MIME type from data URL
  const mimeType = getMimeTypeFromDataUrl(base64Image);
  const base64Data = getBase64FromDataUrl(base64Image);

  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const imageMime = part.inlineData.mimeType || 'image/png';
        return `data:${imageMime};base64,${part.inlineData.data}`;
      }
    }
    throw new GeminiAPIError('Failed to edit image', 'EDIT_FAILED', true);
  }, 'Image editing');
};

/**
 * Get user-friendly error message from Gemini errors
 */
export const getGeminiErrorMessage = (error: unknown): string => {
  if (error instanceof GeminiAPIError) {
    switch (error.code) {
      case 'MAX_RETRIES_EXCEEDED':
        return 'Unable to connect to the styling service. Please check your connection and try again.';
      case 'EMPTY_RESPONSE':
        return 'The styling service returned an empty response. Please try again.';
      case 'PARSE_ERROR':
        return 'Unable to process the styling results. Please try a different photo.';
      case 'NO_IMAGE_DATA':
        return 'Failed to generate outfit image. Please try again.';
      case 'EDIT_FAILED':
        return 'Failed to edit the outfit image. Please try a different instruction.';
      default:
        return error.message;
    }
  }
  if (error instanceof Error) {
    if (error.message.includes('API key')) {
      return 'Service configuration error. Please contact support.';
    }
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
};
