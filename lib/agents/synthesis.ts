import { generateContent, GEMINI_MODEL } from '../gemini';
import { fetchProperties } from '../tools';
import type { PropertyAnalysis, RankedProperty } from '../types';

const SYSTEM = `You are a travel copywriter for a hospitality platform in Albania.
Given a user's original query and a list of matched properties with review quotes, write a short, vivid, personalised match explanation for each property.
Respond ONLY with valid JSON — no prose, no markdown fences.
Return an array where each item is:
{ "propertyId": string, "vibeMatchPercent": number, "headline": string, "explanation": string, "quotes": [string, string?] }
- vibeMatchPercent: integer 60–99, reflecting how well the property fits the query vibe
- headline: one punchy sentence (max 12 words) capturing the core appeal
- explanation: 2–3 sentences why this property matches the traveller's request
- quotes: 1–2 of the most compelling verbatim review excerpts (keep them short — max 25 words each)`;

export async function runSynthesisAgent(
  originalQuery: string,
  analyses: PropertyAnalysis[],
): Promise<RankedProperty[]> {
  if (analyses.length === 0) return [];

  const allProps = fetchProperties({});
  const context = analyses.map(a => {
    const prop = allProps.find(p => p.id === a.propertyId);
    return {
      propertyId: a.propertyId,
      name: prop?.name,
      description: prop?.description,
      matchStrength: a.matchStrength,
      quotes: a.quotes,
    };
  });

  const prompt = `${SYSTEM}

User query: "${originalQuery}"

Matched properties:
${JSON.stringify(context, null, 2)}`;

  const response = await generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  const raw = response.candidates?.[0]?.content?.parts
    ?.map(p => ('text' in p ? p.text : ''))
    .join('') ?? '';
  const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  type SynthResult = {
    propertyId: string;
    vibeMatchPercent: number;
    headline: string;
    explanation: string;
    quotes: string[];
  };

  let synthResults: SynthResult[] = [];
  try {
    synthResults = JSON.parse(clean) as SynthResult[];
  } catch (e) {
    // JSON parse failed — build a minimal result directly from the analysis data
    console.error('[synthesis] JSON parse failed:', e, '\nRaw response:', raw.slice(0, 500));
    return analyses
      .map(a => {
        const prop = allProps.find(p => p.id === a.propertyId);
        if (!prop) return null;
        return {
          property: prop,
          vibeMatchPercent: Math.round(a.matchStrength * 100),
          headline: `${prop.name} — ${Math.round(a.matchStrength * 100)}% match`,
          explanation: prop.description,
          quotes: a.quotes.slice(0, 2),
        };
      })
      .filter((r): r is RankedProperty => r !== null)
      .sort((a, b) => b.vibeMatchPercent - a.vibeMatchPercent);
  }

  return synthResults
    .map(r => {
      const prop = allProps.find(p => p.id === r.propertyId);
      if (!prop) return null;
      return {
        property: prop,
        vibeMatchPercent: r.vibeMatchPercent,
        headline: r.headline,
        explanation: r.explanation,
        quotes: r.quotes ?? [],
      };
    })
    .filter((r): r is RankedProperty => r !== null)
    .sort((a, b) => b.vibeMatchPercent - a.vibeMatchPercent);
}
