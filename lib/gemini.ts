import { GoogleGenAI } from '@google/genai';

export const GEMINI_MODEL = 'gemini-2.5-flash';
export const EMBEDDING_MODEL = 'text-embedding-004';

function getClient(): GoogleGenAI {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY environment variable is required');
  }
  return new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
}

export async function generateContent(
  ...args: Parameters<GoogleGenAI['models']['generateContent']>
): Promise<ReturnType<GoogleGenAI['models']['generateContent']>> {
  return getClient().models.generateContent(...args);
}

export async function embedText(text: string): Promise<number[]> {
  const result = await getClient().models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
  });
  const values = result.embeddings?.[0]?.values;
  if (!values) throw new Error('No embedding values returned');
  return values;
}
