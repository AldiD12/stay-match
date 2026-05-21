import { GoogleGenAI } from '@google/genai';

export const GEMINI_MODEL = 'gemini-2.5-flash-lite';
export const EMBEDDING_MODEL = 'gemini-embedding-001';

function getClient(): GoogleGenAI {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY environment variable is required');
  }
  return new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
}

function retryDelayMs(err: unknown): number | null {
  const msg = String(err);
  if (msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('529') || msg.includes('overloaded')) {
    return 1500;
  }
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
    const match = /retry in (\d+)/.exec(msg);
    return ((match ? parseInt(match[1]) : 62) + 3) * 1000;
  }
  return null;
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

export async function generateContent(
  ...args: Parameters<GoogleGenAI['models']['generateContent']>
): Promise<ReturnType<GoogleGenAI['models']['generateContent']>> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await getClient().models.generateContent(...args);
    } catch (err) {
      const delay = retryDelayMs(err);
      if (attempt < 4 && delay !== null) {
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
  throw new Error('generateContent: exhausted retries');
}

export async function embedText(text: string): Promise<number[]> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await getClient().models.embedContent({
        model: EMBEDDING_MODEL,
        contents: text,
      });
      const values = result.embeddings?.[0]?.values;
      if (!values) throw new Error('No embedding values returned');
      return values;
    } catch (err) {
      const delay = retryDelayMs(err);
      if (attempt < 2 && delay !== null) {
        await sleep(Math.min(delay, 3000));
        continue;
      }
      throw err;
    }
  }
  throw new Error('embedText: exhausted retries');
}
