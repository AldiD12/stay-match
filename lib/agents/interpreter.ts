import { generateContent, GEMINI_MODEL } from '../gemini';
import type { QueryIntent } from '../types';

const SYSTEM = `You are a travel intent parser for an Albanian hospitality platform.
Extract structured travel intent from a user's natural-language query.
Respond ONLY with valid JSON — no prose, no markdown fences.
JSON shape: { "location": string, "maxPrice": number|null, "partySize": number|null, "vibe": string, "travelStyle": string }
- location: the Albanian city/region mentioned, or "Albania" if unspecified
- maxPrice: nightly USD budget if mentioned, otherwise null
- partySize: number of guests if mentioned, otherwise null
- vibe: 2–5 word vibe summary (e.g. "quiet mountain solitude", "luxury city break")
- travelStyle: one of: digital_nomad, family, romantic_couple, solo_adventurer, group_friends, cultural_explorer`;

export async function interpretQuery(query: string): Promise<QueryIntent> {
  const response = await generateContent({
    model: GEMINI_MODEL,
    contents: [
      { role: 'user', parts: [{ text: `${SYSTEM}\n\nUser query: ${query}` }] },
    ],
  });

  const text = response.text ?? '';
  // Strip markdown fences if Gemini wraps anyway
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(clean) as QueryIntent;
  } catch {
    return {
      location: 'Albania',
      maxPrice: undefined,
      partySize: undefined,
      vibe: query.slice(0, 60),
      travelStyle: 'cultural_explorer',
    };
  }
}
