/**
 * Run once to pre-compute review embeddings via Vertex AI.
 * Usage: npx tsx scripts/embed.ts
 * Requires: gcloud auth application-default login
 * Output: data/embeddings.json
 * Resumes from existing output — safe to re-run.
 */
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

const PROJECT = 'staymatch-496921';
const LOCATION = 'us-central1';
const MODEL = 'text-embedding-004';

const client = new GoogleGenAI({ vertexai: true, project: PROJECT, location: LOCATION });

async function embed(text: string): Promise<number[]> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const result = await client.models.embedContent({ model: MODEL, contents: text });
      const values = result.embeddings?.[0]?.values;
      if (!values) throw new Error('No embedding values returned');
      return values;
    } catch (err) {
      const msg = String(err);
      if (attempt < 4 && (msg.includes('429') || msg.includes('503') || msg.includes('UNAVAILABLE'))) {
        const delay = (/retry in (\d+)/.exec(msg)?.[1] ?? '10');
        process.stdout.write(`\n  retrying in ${delay}s...\n`);
        await new Promise(r => setTimeout(r, (parseInt(delay) + 2) * 1000));
        continue;
      }
      throw err;
    }
  }
  throw new Error('embed: exhausted retries');
}

async function main() {
  const reviewsPath = path.join(process.cwd(), 'data', 'reviews.json');
  const outPath = path.join(process.cwd(), 'data', 'embeddings.json');

  const reviews = JSON.parse(fs.readFileSync(reviewsPath, 'utf-8')) as Array<{
    propertyId: string; text: string;
  }>;

  const existing: Array<{ propertyId: string; reviewIndex: number; text: string; vector: number[] }> =
    fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf-8')) : [];

  const doneIndexes = new Set(existing.map(e => e.reviewIndex));
  const todo = reviews.filter((_, i) => !doneIndexes.has(i));

  console.log(`${reviews.length} total, ${existing.length} done, ${todo.length} to embed  (model: ${MODEL})`);

  const results = [...existing];

  for (const r of todo) {
    const i = reviews.indexOf(r);
    process.stdout.write(`\r  ${results.length + 1}/${reviews.length}`);
    const vector = await embed(r.text);
    results.push({ propertyId: r.propertyId, reviewIndex: i, text: r.text, vector });
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
    await new Promise(res => setTimeout(res, 200));
  }

  console.log(`\nWrote ${results.length} embeddings → ${outPath}`);
  console.log(`Vector dims: ${results[0]?.vector.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
