/**
 * Pre-compute review embeddings via Vertex AI (gemini-embedding-001, 3072-dim).
 * Uses gcloud ADC — no API key needed.
 * Usage: npx tsx scripts/embed.ts
 * Output: data/embeddings.json
 * Resumes from existing output — safe to re-run.
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const PROJECT = 'staymatch-496921';
const LOCATION = 'us-central1';
const MODEL = 'gemini-embedding-001';
const ENDPOINT = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${MODEL}:predict`;

function getToken(): string {
  return execSync(`gcloud auth print-access-token --project=${PROJECT}`).toString().trim();
}

async function embed(text: string): Promise<number[]> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const token = getToken();
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ instances: [{ content: text }] }),
    });
    if (res.status === 429) {
      const body = await res.text();
      const delay = (/retryDelay.*?"(\d+)s"/.exec(body)?.[1] ?? '60');
      process.stdout.write(`\n  rate limited — waiting ${delay}s...\n`);
      await new Promise(r => setTimeout(r, (parseInt(delay) + 5) * 1000));
      continue;
    }
    if (!res.ok) throw new Error(`Embed API error: ${res.status} ${await res.text()}`);
    const json = await res.json() as { predictions: Array<{ embeddings: { values: number[] } }> };
    return json.predictions[0].embeddings.values;
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

  console.log(`${reviews.length} total, ${existing.length} done, ${todo.length} to embed`);
  console.log(`Model: ${MODEL} (3072-dim) via Vertex AI`);

  const results = [...existing];

  for (const r of todo) {
    const i = reviews.indexOf(r);
    process.stdout.write(`\r  ${results.length + 1}/${reviews.length} `);
    const vector = await embed(r.text);
    results.push({ propertyId: r.propertyId, reviewIndex: i, text: r.text, vector });
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
    await new Promise(res => setTimeout(res, 200));
  }

  console.log(`\nWrote ${results.length} embeddings → ${outPath} (dims: ${results[0]?.vector.length})`);
}

main().catch(e => { console.error(e); process.exit(1); });
