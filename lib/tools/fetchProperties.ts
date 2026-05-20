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
  maxPrice?: number;
  partySize?: number;
}

export function fetchProperties(args: FetchPropertiesArgs): Property[] {
  let results = loadAll();

  if (args.location) {
    const loc = args.location.toLowerCase();
    results = results.filter(p => p.location.toLowerCase().includes(loc));
  }
  if (args.maxPrice !== undefined) {
    results = results.filter(p => p.basePrice <= args.maxPrice!);
  }
  if (args.partySize !== undefined) {
    results = results.filter(p => p.sleeps >= args.partySize!);
  }

  return results;
}

export const fetchPropertiesDeclaration = {
  name: 'fetchProperties',
  description:
    'Search Albanian properties filtered by location, maximum nightly price, and party size. Returns matching property objects.',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'City or region in Albania, e.g. "Saranda", "Tirana", "Valbona".',
      },
      maxPrice: {
        type: 'number',
        description: 'Maximum price per night in USD.',
      },
      partySize: {
        type: 'number',
        description: 'Minimum number of guests the property must sleep.',
      },
    },
    required: [],
  },
};
