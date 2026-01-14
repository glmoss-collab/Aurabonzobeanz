
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

// Fashion DNA - Iconographic Analysis Types
export interface DesignerInfluence {
  name: string;
  era: string;
  signature: string;
  relevance: string;
}

export interface StyleMovement {
  name: string;
  period: string;
  characteristics: string[];
}

export interface FashionDNA {
  primaryEra: string;
  eraYearRange: string;
  styleMovements: StyleMovement[];
  designerInfluences: DesignerInfluence[];
  silhouetteAnalysis: string;
  fabricIntelligence: string;
  culturalContext: string;
  modernInterpretation: string;
  investmentPotential: 'Heritage Piece' | 'Contemporary Classic' | 'Trend-Forward' | 'Timeless Essential';
  styleArchetype: string;
  editorialNotes: string;
}

export interface AnalysisResult {
  itemName: string;
  originalPalette: string[];
  complimentaryPalette: string[];
  description: string;
  fashionDNA?: FashionDNA;
  suggestions: {
    type: StyleType;
    description: string;
    colorsUsed: string[];
  }[];
}
