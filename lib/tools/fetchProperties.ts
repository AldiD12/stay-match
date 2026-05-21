import fs from 'fs';
import path from 'path';
import type { Property } from '../types';

let cache: Property[] | null = null;

function loadAll(): Property[] {
  if (cache) return cache;
  const p = path.join(process.cwd(), 'data', 'properties.json');
  cache = JSON.parse(fs.readFileSync(p, 'utf-8')) as Property[];
  return cache;
}

export interface FetchPropertiesArgs {
  location?: string;
  category?: string;
  maxPrice?: number;
}

export function fetchProperties(args: FetchPropertiesArgs): Property[] {
  let results = loadAll();

  if (args.location) {
    const loc = args.location.toLowerCase();
    results = results.filter(p => p.location.toLowerCase().includes(loc));
  }
  if (args.category) {
    const cat = args.category.toLowerCase();
    results = results.filter(p => p.category.toLowerCase().includes(cat));
  }
  if (args.maxPrice !== undefined) {
    results = results.filter(p => !p.basePrice || p.basePrice <= args.maxPrice!);
  }

  return results;
}

export const fetchPropertiesDeclaration = {
  name: 'fetchProperties',
  description:
    'Search Albanian places filtered by location, category, and optional max price. Returns matching places. Use category to distinguish between: accommodation (hotels/guesthouses), restaurant, bar, cafe (cafes/coworking), activity (attractions/tours/museums).',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'City or region in Albania e.g. "Saranda", "Tirana", "Berat".',
      },
      category: {
        type: 'string',
        enum: ['accommodation', 'restaurant', 'bar', 'cafe', 'activity'],
        description: 'Type of place to search for.',
      },
      maxPrice: {
        type: 'number',
        description: 'Maximum price per night in USD (for accommodation only).',
      },
    },
    required: [],
  },
};
