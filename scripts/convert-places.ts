/**
 * Convert Google Places crawler JSON → data/properties.json + data/reviews.json
 * Usage: npx tsx scripts/convert-places.ts /path/to/file1.json /path/to/file2.json ...
 * Picks the best 2-3 properties per city, generates descriptions via Gemini.
 */
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

// Load env
const envFile = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf-8').split('\n')) {
    const eq = line.indexOf('=');
    if (eq > 0) process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
}

const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });

interface PlacesRecord {
  title: string;
  totalScore?: number;
  reviewsCount?: number;
  street?: string;
  city?: string;
  location?: { lat: number; lng: number };
  price?: string;
  imageUrl?: string;
  categoryName?: string;
  reviews?: Array<{ text?: string; name?: string; publishedAtDate?: string; stars?: number }>;
}

interface Property {
  id: string;
  name: string;
  location: string;
  basePrice: number;
  sleeps: number;
  lat: number;
  lng: number;
  photoUrl: string;
  description: string;
}

interface Review {
  propertyId: string;
  author: string;
  date: string;
  text: string;
  source: string;
}

function parsePrice(raw: string | undefined): number {
  if (!raw) return 45;
  const n = parseInt(raw.replace(/[^0-9]/g, ''));
  return isNaN(n) ? 45 : n;
}

function estimateSleeps(price: number, category: string): number {
  if (category?.toLowerCase().includes('hostel') || category?.toLowerCase().includes('bujtinë')) return 1;
  if (price <= 35) return 2;
  if (price <= 70) return 3;
  if (price <= 120) return 4;
  return 6;
}

function qualityScore(p: PlacesRecord): number {
  const score = p.totalScore ?? 0;
  const count = p.reviewsCount ?? 0;
  const hasEnglish = (p.reviews ?? []).some(r => /[a-zA-Z]{10,}/.test(r.text ?? ''));
  return score * Math.log10(count + 1) * (hasEnglish ? 1.2 : 0.8);
}

async function generateDescription(name: string, city: string, topReviews: string[]): Promise<string> {
  const prompt = `Write a 2-sentence accommodation description for "${name}" in ${city}, Albania.
Tone: evocative, specific, traveller-focused. No marketing fluff.
Base it on these real guest reviews:
${topReviews.slice(0, 3).map(r => `- ${r}`).join('\n')}
Return only the 2-sentence description, nothing else.`;

  try {
    const res = await client.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return res.candidates?.[0]?.content?.parts?.map(p => ('text' in p ? p.text : '')).join('') ?? '';
  } catch {
    return `${name} is a highly-rated guesthouse in ${city}, Albania, praised by international travellers for its warm hospitality and authentic character.`;
  }
}

async function main() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error('Usage: npx tsx scripts/convert-places.ts file1.json file2.json ...');
    process.exit(1);
  }

  const allRecords: PlacesRecord[] = [];
  for (const f of files) {
    const raw = JSON.parse(fs.readFileSync(f, 'utf-8')) as PlacesRecord[];
    console.log(`Loaded ${raw.length} records from ${path.basename(f)}`);
    allRecords.push(...raw);
  }

  // Group by city
  const byCity: Record<string, PlacesRecord[]> = {};
  for (const r of allRecords) {
    const city = r.city ?? 'Unknown';
    if (!byCity[city]) byCity[city] = [];
    byCity[city].push(r);
  }

  console.log('\nCities found:', Object.entries(byCity).map(([c, v]) => `${c} (${v.length})`).join(', '));

  // Pick best per city: max 3 from large cities (Tirana), max 2 from others, max 1 from tiny ones
  const largeCities = new Set(['Tirana', 'Tiranë']);
  const selected: PlacesRecord[] = [];

  for (const [city, records] of Object.entries(byCity)) {
    const limit = largeCities.has(city) ? 3 : records.length >= 10 ? 2 : 1;
    const best = records
      .filter(r => (r.totalScore ?? 0) >= 4.5 && (r.reviewsCount ?? 0) >= 5)
      .sort((a, b) => qualityScore(b) - qualityScore(a))
      .slice(0, limit);
    console.log(`  ${city}: picked ${best.length}/${records.length} — ${best.map(b => b.title).join(', ')}`);
    selected.push(...best);
  }

  console.log(`\nTotal selected: ${selected.length} properties`);
  console.log('Generating descriptions via Gemini...\n');

  const properties: Property[] = [];
  const reviews: Review[] = [];
  let idCounter = 1;

  for (const record of selected) {
    const id = String(idCounter++);
    const price = parsePrice(record.price);
    const city = record.city ?? 'Albania';
    const category = record.categoryName ?? '';

    const usableReviews = (record.reviews ?? [])
      .filter(r => (r.text ?? '').trim().length > 20)
      .map(r => ({
        text: (r.text ?? '').trim(),
        author: r.name ?? 'Guest',
        date: r.publishedAtDate ?? '2024-01-01',
      }));

    const englishReviews = usableReviews.filter(r => /[a-zA-Z]{8,}/.test(r.text));
    const descSeed = (englishReviews.length >= 2 ? englishReviews : usableReviews).map(r => r.text);

    process.stdout.write(`  [${id}] ${record.title}... `);
    const description = await generateDescription(record.title, city, descSeed);
    console.log('done');

    properties.push({
      id,
      name: record.title,
      location: city,
      basePrice: price,
      sleeps: estimateSleeps(price, category),
      lat: record.location?.lat ?? 0,
      lng: record.location?.lng ?? 0,
      photoUrl: record.imageUrl ?? '',
      description,
    });

    for (const r of usableReviews) {
      reviews.push({
        propertyId: id,
        author: r.author,
        date: r.date.slice(0, 10),
        text: r.text,
        source: 'Google',
      });
    }

    await new Promise(res => setTimeout(res, 500));
  }

  const propsPath = path.join(process.cwd(), 'data', 'properties.json');
  const reviewsPath = path.join(process.cwd(), 'data', 'reviews.json');

  fs.writeFileSync(propsPath, JSON.stringify(properties, null, 2));
  fs.writeFileSync(reviewsPath, JSON.stringify(reviews, null, 2));

  console.log(`\n✅ Wrote ${properties.length} properties → data/properties.json`);
  console.log(`✅ Wrote ${reviews.length} reviews → data/reviews.json`);
  console.log('\nNext: npm run embed');
}

main().catch(e => { console.error(e); process.exit(1); });
