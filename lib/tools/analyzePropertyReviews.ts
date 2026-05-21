import fs from 'fs';
import path from 'path';
import { embedText } from '../gemini';
import { findTopReviews, hasEmbeddings } from '../embeddings';
import type { PropertyAnalysis, Review } from '../types';

let reviewCache: Review[] | null = null;

function loadReviews(propertyId: string): Review[] {
  if (!reviewCache) {
    const p = path.join(process.cwd(), 'data', 'reviews.json');
    reviewCache = JSON.parse(fs.readFileSync(p, 'utf-8')) as Review[];
  }
  return reviewCache.filter(r => r.propertyId === propertyId);
}

function keywordScore(reviews: Review[], criteria: string): Array<{ text: string; score: number }> {
  const words = criteria.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  return reviews
    .map(r => {
      const lower = r.text.toLowerCase();
      const hits = words.filter(w => lower.includes(w)).length;
      return { text: r.text, score: hits / words.length };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export interface AnalyzeArgs {
  propertyId: string;
  criteria: string;
}

export async function analyzePropertyReviews(args: AnalyzeArgs): Promise<PropertyAnalysis> {
  const reviews = loadReviews(args.propertyId);
  if (reviews.length === 0) {
    return { propertyId: args.propertyId, matchStrength: 0, quotes: [], summary: 'No reviews available.' };
  }

  let topReviews: Array<{ text: string; score: number }>;

  if (hasEmbeddings()) {
    const queryVector = await embedText(args.criteria);
    topReviews = findTopReviews(args.propertyId, queryVector, 3);
  } else {
    topReviews = keywordScore(reviews, args.criteria);
  }

  const avg = topReviews.length > 0
    ? topReviews.reduce((s, r) => s + r.score, 0) / topReviews.length
    : 0;

  // Cosine similarity is already calibrated — no bias needed.
  // Keyword overlap (0–1) needs a baseline boost so weak matches still surface.
  const matchStrength = hasEmbeddings()
    ? avg
    : Math.min(1, avg + 0.3);

  return {
    propertyId: args.propertyId,
    matchStrength: Math.round(matchStrength * 100) / 100,
    quotes: topReviews.map(r => r.text),
    summary: `Top ${topReviews.length} review(s) selected based on criteria: "${args.criteria}".`,
  };
}

export const analyzePropertyReviewsDeclaration = {
  name: 'analyzePropertyReviews',
  description:
    'Analyse guest reviews for a specific property against given criteria. Returns a match strength score (0–1) and the most relevant verbatim review quotes.',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      propertyId: {
        type: 'string',
        description: 'The property ID to analyse.',
      },
      criteria: {
        type: 'string',
        description:
          'A short description of what to look for in reviews, e.g. "fast wifi and good workspace for remote work" or "family-friendly with pool and safe for children".',
      },
    },
    required: ['propertyId', 'criteria'],
  },
};
