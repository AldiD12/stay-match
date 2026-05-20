import fs from 'fs';
import path from 'path';
import type { ReviewEmbedding } from './types';

let cache: ReviewEmbedding[] | null = null;

function load(): ReviewEmbedding[] {
  if (cache) return cache;
  const p = path.join(process.cwd(), 'data', 'embeddings.json');
  if (!fs.existsSync(p)) return [];
  cache = JSON.parse(fs.readFileSync(p, 'utf-8')) as ReviewEmbedding[];
  return cache;
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function findTopReviews(
  propertyId: string,
  queryVector: number[],
  k = 3,
): Array<{ text: string; score: number }> {
  const embeddings = load().filter(e => e.propertyId === propertyId);
  if (embeddings.length === 0) return [];

  return embeddings
    .map(e => ({ text: e.text, score: cosine(e.vector, queryVector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

export function hasEmbeddings(): boolean {
  return load().length > 0;
}
