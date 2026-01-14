
export enum StyleType {
  CASUAL = 'Casual',
  BUSINESS = 'Business',
  NIGHT_OUT = 'Night Out'
}

export interface OutfitSuggestion {
  type: StyleType;
  description: string;
  imageUrl?: string;
  isGenerating: boolean;
  error?: string;
  colorsUsed: string[]; // Hex codes or color names
}

export interface AnalysisResult {
  itemName: string;
  originalPalette: string[];
  complimentaryPalette: string[];
  description: string;
  suggestions: {
    type: StyleType;
    description: string;
    colorsUsed: string[];
  }[];
}
