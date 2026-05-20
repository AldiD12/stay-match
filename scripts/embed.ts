/**
 * Run once to pre-compute review embeddings.
 * Usage: GOOGLE_API_KEY=xxx npx tsx scripts/embed.ts
 * Output: data/embeddings.json
 */
import fs from 'fs';
import path from 'path';

// Inline the Gemini call to avoid circular imports with Next.js
async function embed(text: string, apiKey: string): Promise<number[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'models/text-embedding-004', content: { parts: [{ text }] } }),
  });
  if (!res.ok) throw new Error(`Embed API error: ${res.status} ${await res.text()}`);
  const json = await res.json() as { embedding: { values: number[] } };
  return json.embedding.values;
}

async function main() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_API_KEY is required');

  const reviewsPath = path.join(process.cwd(), 'data', 'reviews.json');
  const outPath = path.join(process.cwd(), 'data', 'embeddings.json');

  const reviews = JSON.parse(fs.readFileSync(reviewsPath, 'utf-8')) as Array<{
    propertyId: string; text: string;
  }>;

  console.log(`Embedding ${reviews.length} reviews...`);

  const results: Array<{ propertyId: string; reviewIndex: number; text: string; vector: number[] }> = [];

  for (let i = 0; i < reviews.length; i++) {
    const r = reviews[i];
    process.stdout.write(`\r${i + 1}/${reviews.length}`);
    const vector = await embed(r.text, apiKey);
    results.push({ propertyId: r.propertyId, reviewIndex: i, text: r.text, vector });
    // Respect rate limits
    await new Promise(res => setTimeout(res, 100));
  }

  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nWrote ${results.length} embeddings to ${outPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
