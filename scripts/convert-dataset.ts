/**
 * Convert Google Places JSON files → data/properties.json + data/reviews.json
 * Handles all place types: accommodation, bar, restaurant, cafe, activity.
 * Usage: npx tsx scripts/convert-dataset.ts file1.json file2.json ...
 */
import fs from 'fs';
import path from 'path';
import type { PlaceCategory } from '../lib/types';

interface PlaceRecord {
  title: string;
  price?: string;
  categoryName?: string;
  address?: string;
  city?: string;
  location?: { lat: number; lng: number };
  totalScore?: number;
  reviewsCount?: number;
  hotelStars?: string;
  phone?: string;
  website?: string;
  imageUrl?: string;
  hotelDescription?: string;
  locatedIn?: string;
  permanentlyClosed?: boolean;
  reviews?: Array<{
    name?: string;
    text?: string;
    publishedAtDate?: string;
    stars?: number;
    reviewContext?: Record<string, string>;
    originalLanguage?: string;
  }>;
}

const ACCOMMODATION_CATS = ['hotel', 'guest house', 'hostel', 'lodging', 'apartment', 'inn', 'resort', 'bujtinë', 'motel'];
const RESTAURANT_CATS = ['restaurant', 'food', 'pizza', 'sushi', 'steakhouse', 'seafood', 'grill', 'brunch', 'bistro', 'tavern'];
const BAR_CATS = ['bar', 'pub', 'cocktail', 'nightclub', 'night club', 'lounge', 'club', 'sports bar', 'wine bar', 'rooftop'];
const CAFE_CATS = ['coffee', 'cafe', 'café', 'coworking', 'co-working', 'chocolate', 'bakery', 'pastry'];
const ACTIVITY_CATS = ['attraction', 'museum', 'landmark', 'monument', 'tour', 'park', 'mosque', 'church', 'castle', 'gallery', 'theater', 'historical', 'archaeological'];

function detectCategory(categoryName: string): PlaceCategory {
  const c = (categoryName ?? '').toLowerCase();
  if (ACCOMMODATION_CATS.some(k => c.includes(k))) return 'accommodation';
  if (BAR_CATS.some(k => c.includes(k))) return 'bar';
  if (CAFE_CATS.some(k => c.includes(k))) return 'cafe';
  if (RESTAURANT_CATS.some(k => c.includes(k))) return 'restaurant';
  if (ACTIVITY_CATS.some(k => c.includes(k))) return 'activity';
  return 'activity'; // default for unknown types
}

function parsePrice(raw: string | undefined, category: PlaceCategory): number {
  if (!raw || category !== 'accommodation') return 0;
  const n = parseInt(raw.replace(/[^0-9]/g, ''));
  return isNaN(n) ? 0 : n;
}

function qualityScore(p: PlaceRecord): number {
  const score = p.totalScore ?? 0;
  const count = p.reviewsCount ?? 0;
  const hasEnglish = (p.reviews ?? []).some(r => /[a-zA-Z]{10,}/.test(r.text ?? ''));
  return score * Math.log10(count + 1) * (hasEnglish ? 1.2 : 0.8);
}

function buildDescription(record: PlaceRecord): string {
  if (record.hotelDescription) return record.hotelDescription;
  const score = record.totalScore ?? 0;
  const count = record.reviewsCount ?? 0;
  const loc = record.locatedIn ? `in ${record.locatedIn}` : `in ${record.city ?? 'Albania'}`;
  const highlights = new Set<string>();
  for (const r of (record.reviews ?? []).slice(0, 10)) {
    if (r.reviewContext) {
      for (const v of Object.values(r.reviewContext)) {
        v.split(',').forEach(h => highlights.add(h.trim()));
      }
    }
  }
  const hl = [...highlights].slice(0, 3).join(', ');
  return `★${score} across ${count} reviews ${loc}. ${hl ? `Highlights: ${hl}.` : 'Highly rated by visitors.'}`;
}

async function main() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error('Usage: npx tsx scripts/convert-dataset.ts file1.json file2.json ...');
    process.exit(1);
  }

  const allRecords: PlaceRecord[] = [];
  for (const f of files) {
    const raw = JSON.parse(fs.readFileSync(f, 'utf-8')) as PlaceRecord[];
    const active = raw.filter(r => !r.permanentlyClosed);
    console.log(`  ${path.basename(f)}: ${active.length} records`);
    allRecords.push(...active);
  }
  console.log(`\nTotal: ${allRecords.length} records`);

  // Group by city + category
  type GroupKey = string;
  const groups: Record<GroupKey, PlaceRecord[]> = {};
  for (const r of allRecords) {
    const city = r.city ?? 'Unknown';
    const cat = detectCategory(r.categoryName ?? '');
    const key = `${city}::${cat}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  }

  const LARGE_CITIES = new Set(['Tirana', 'Tiranë', 'Saranda', 'Sarandë']);
  const selected: Array<PlaceRecord & { _category: PlaceCategory }> = [];

  console.log('\nSelecting top places per city + category:');
  for (const [key, records] of Object.entries(groups)) {
    const [city, cat] = key.split('::');
    const limit = LARGE_CITIES.has(city) ? 3 : 2;
    const minRating = cat === 'activity' ? 4.0 : 4.3;
    const minReviews = cat === 'activity' ? 3 : 5;

    const qualified = records
      .filter(r => (r.totalScore ?? 0) >= minRating && (r.reviewsCount ?? 0) >= minReviews)
      .sort((a, b) => qualityScore(b) - qualityScore(a))
      .slice(0, limit);

    if (qualified.length > 0) {
      console.log(`  [${cat}] ${city}: ${qualified.length}/${records.length}`);
      qualified.forEach(p => console.log(`    ★${p.totalScore} ${p.title}`));
      selected.push(...qualified.map(r => ({ ...r, _category: cat as PlaceCategory })));
    }
  }

  console.log(`\nTotal selected: ${selected.length} places`);

  const properties: object[] = [];
  const reviews: object[] = [];
  let id = 1;

  for (const record of selected) {
    const pid = String(id++);
    const category = record._category;
    const price = parsePrice(record.price, category);

    properties.push({
      id: pid,
      name: record.title,
      location: record.city ?? 'Albania',
      category,
      basePrice: price,
      lat: record.location?.lat ?? 0,
      lng: record.location?.lng ?? 0,
      photoUrl: record.imageUrl ?? '',
      description: buildDescription(record),
      totalScore: record.totalScore,
      reviewsCount: record.reviewsCount,
      hotelStars: record.hotelStars ?? null,
      phone: record.phone ?? null,
      website: record.website ?? null,
      address: record.address ?? null,
    });

    for (const r of (record.reviews ?? []).filter(r => (r.text ?? '').trim().length > 20)) {
      reviews.push({
        propertyId: pid,
        author: r.name ?? 'Guest',
        date: (r.publishedAtDate ?? '2024-01-01').slice(0, 10),
        text: r.text!.trim(),
        source: 'Google',
        stars: r.stars ?? null,
        language: r.originalLanguage ?? 'en',
      });
    }
  }

  fs.writeFileSync(path.join(process.cwd(), 'data', 'properties.json'), JSON.stringify(properties, null, 2));
  fs.writeFileSync(path.join(process.cwd(), 'data', 'reviews.json'), JSON.stringify(reviews, null, 2));

  // Summary by category
  const cats: Record<string, number> = {};
  selected.forEach(p => { cats[p._category] = (cats[p._category] ?? 0) + 1; });
  console.log('\nBreakdown by category:');
  Object.entries(cats).forEach(([c, n]) => console.log(`  ${c}: ${n}`));
  console.log(`\n✅ ${properties.length} places → data/properties.json`);
  console.log(`✅ ${reviews.length} reviews → data/reviews.json`);
  console.log('\nNext: rm data/embeddings.json && npm run embed');
}

main().catch(e => { console.error(e); process.exit(1); });
