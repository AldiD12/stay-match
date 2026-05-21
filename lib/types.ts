export type PlaceCategory = 'accommodation' | 'restaurant' | 'bar' | 'cafe' | 'activity';

export interface Property {
  id: string;
  name: string;
  location: string;
  category: PlaceCategory;
  basePrice: number;
  lat: number;
  lng: number;
  photoUrl: string;
  description: string;
  totalScore?: number;
  reviewsCount?: number;
  hotelStars?: string;
  phone?: string;
  website?: string;
  address?: string;
}

export interface Review {
  propertyId: string;
  author: string;
  date: string;
  text: string;
  source: string;
}

export interface ReviewEmbedding {
  propertyId: string;
  reviewIndex: number;
  text: string;
  vector: number[];
}

export interface PropertyAnalysis {
  propertyId: string;
  matchStrength: number; // 0–1
  quotes: string[];
  summary: string;
}

export interface RankedProperty {
  property: Property;
  vibeMatchPercent: number;
  headline: string;
  explanation: string;
  quotes: string[];
}

export interface QueryIntent {
  location: string;
  maxPrice?: number;
  partySize?: number;
  vibe: string;
  travelStyle: string;
}

export type AgentEvent =
  | { type: 'agent_thinking'; message: string }
  | { type: 'tool_call_start'; tool: string; params: Record<string, unknown> }
  | { type: 'tool_call_result'; tool: string; success: boolean; durationMs: number; summary: string }
  | { type: 'property_accepted'; propertyId: string; name: string; matchScore: number }
  | { type: 'property_rejected'; propertyId: string; name: string; reason: string }
  | { type: 'final_ranking'; properties: RankedProperty[] }
  | { type: 'error'; message: string }
  | { type: 'done' };
