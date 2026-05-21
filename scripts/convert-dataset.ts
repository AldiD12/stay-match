/**
 * Convert the full Google Places dataset → data/properties.json + data/reviews.json
 * No Gemini needed — uses scraped data directly.
 * Usage: npx tsx scripts/convert-dataset.ts public/dataset_crawler-google-places.json
 */
import fs from 'fs';
import path from 'path';

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
  reviews?: Array<{
    name?: string;
    text?: string;
    publishedAtDate?: string;
    stars?: number;
    reviewContext?: Record<string, string>;
    reviewDetailedRating?: Record<string, number>;
    originalLanguage?: string;
  }>;
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

function buildDescription(record: ExtendedRecord): string {
  if (record.hotelDescription) return record.hotelDescription;

  // Build from scraped signals
  const score = record.totalScore ?? 0;
  const count = record.reviewsCount ?? 0;
  const stars = record.hotelStars ? `${record.hotelStars}, ` : '';
  const loc = record.locatedIn ? ` in ${record.locatedIn}` : ` in ${record.city ?? 'Albania'}`;

  // Pull top English highlight tags from reviews
  const highlights = new Set<string>();
  for (const r of (record.reviews ?? []).slice(0, 10)) {
    if (r.reviewContext) {
      for (const v of Object.values(r.reviewContext)) {
        v.split(',').forEach(h => highlights.add(h.trim()));
      }
    }
  }
  const highlightStr = [...highlights].slice(0, 3).join(', ');

  return `${stars}★${score} across ${count} reviews${loc}. ${highlightStr ? `Guests highlight: ${highlightStr}.` : 'Praised by travellers for warm hospitality and authentic character.'}`;
}

// Extend interface for locatedIn field
interface ExtendedRecord extends PlaceRecord {
  locatedIn?: string;
}

function qualityScore(p: PlaceRecord): number {
  const score = p.totalScore ?? 0;
  const count = p.reviewsCount ?? 0;
  const hasEnglish = (p.reviews ?? []).some(r => /[a-zA-Z]{10,}/.test(r.text ?? ''));
  return score * Math.log10(count + 1) * (hasEnglish ? 1.2 : 0.8);
}

async function main() {
  const file = process.argv[2];
  if (!file) { console.error('Usage: npx tsx scripts/convert-dataset.ts <file.json>'); process.exit(1); }

  const raw = JSON.parse(fs.readFileSync(file, 'utf-8')) as ExtendedRecord[];
  console.log(`Loaded ${raw.length} records`);

  // Filter: must have rating ≥ 4.5 and at least 5 reviews
  const qualified = raw.filter(r => (r.totalScore ?? 0) >= 4.5 && (r.reviewsCount ?? 0) >= 5);
  console.log(`Qualified (★4.5+, 5+ reviews): ${qualified.length}`);

  // Sort by quality score, take top 15
  const selected = qualified.sort((a, b) => qualityScore(b) - qualityScore(a)).slice(0, 15);
  console.log(`Selected top ${selected.length}:`);
  selected.forEach((p, i) => console.log(`  ${i + 1}. ${p.title} ★${p.totalScore} (${p.reviewsCount} reviews)`));

  const properties: object[] = [];
  const reviews: object[] = [];
  let id = 1;

  for (const record of selected) {
    const pid = String(id++);
    const price = parsePrice(record.price);

    properties.push({
      id: pid,
      name: record.title,
      location: record.city ?? 'Albania',
      basePrice: price,
      sleeps: estimateSleeps(price, record.categoryName ?? ''),
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

  console.log(`\n✅ ${properties.length} properties → data/properties.json`);
  console.log(`✅ ${reviews.length} reviews → data/reviews.json`);
  console.log('\nNext: delete data/embeddings.json then run: npm run embed');
}

main().catch(e => { console.error(e); process.exit(1); });
