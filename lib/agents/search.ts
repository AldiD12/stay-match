import type { Content, Part } from '@google/genai';
import { generateContent, GEMINI_MODEL } from '../gemini';
import {
  fetchProperties, fetchPropertiesDeclaration,
  analyzePropertyReviews, analyzePropertyReviewsDeclaration,
} from '../tools';
import type { QueryIntent, AgentEvent, PropertyAnalysis } from '../types';

const tools = [{ functionDeclarations: [fetchPropertiesDeclaration, analyzePropertyReviewsDeclaration] }];

export async function* runSearchAgent(
  intent: QueryIntent,
  originalQuery: string,
  acceptedCollector: PropertyAnalysis[],
): AsyncGenerator<AgentEvent> {
  const systemPrompt = `You are a property matching agent for Albania. Follow these steps EXACTLY:
1. Call fetchProperties ONCE to get candidates. Do NOT call it again.
2. For EACH property returned, call analyzePropertyReviews with the criteria below.
3. After all analyzePropertyReviews calls are done, output a single summary sentence. Stop.

Criteria for analyzePropertyReviews: "${intent.vibe} ${intent.travelStyle}"
User query: "${originalQuery}"
Filters: location=${intent.location}, maxPrice=${intent.maxPrice ?? 'any'}, partySize=${intent.partySize ?? 'any'}`;

  const contents: Content[] = [{ role: 'user', parts: [{ text: systemPrompt }] }];
  const allProps = fetchProperties({});
  const MAX_TURNS = 24;

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await generateContent({
      model: GEMINI_MODEL,
      contents,
      config: { tools },
    });

    const parts: Part[] = response.candidates?.[0]?.content?.parts ?? [];
    const funcCalls = parts.filter(p => p.functionCall !== undefined);
    if (funcCalls.length === 0) break;

    contents.push({ role: 'model', parts });
    const responseParts: Part[] = [];

    for (const part of funcCalls) {
      const fc = part.functionCall!;
      const startMs = Date.now();
      const args = (fc.args ?? {}) as Record<string, unknown>;
      yield { type: 'tool_call_start', tool: fc.name ?? '', params: args };

      let toolResult: Record<string, unknown>;
      try {
        if (fc.name === 'fetchProperties') {
          const found = fetchProperties(args as Parameters<typeof fetchProperties>[0]);
          toolResult = { properties: found };
          yield {
            type: 'tool_call_result',
            tool: fc.name,
            success: true,
            durationMs: Date.now() - startMs,
            summary: `Found ${found.length} candidate(s)`,
          };
        } else if (fc.name === 'analyzePropertyReviews') {
          const analysis = await analyzePropertyReviews(
            args as unknown as Parameters<typeof analyzePropertyReviews>[0],
          );
          toolResult = { ...analysis } as Record<string, unknown>;
          const prop = allProps.find(p => p.id === analysis.propertyId);
          const propName = prop?.name ?? analysis.propertyId;
          const isAccepted = analysis.matchStrength >= 0.60 && acceptedCollector.length < 5;

          if (isAccepted) {
            acceptedCollector.push(analysis);
            yield { type: 'property_accepted', propertyId: analysis.propertyId, name: propName, matchScore: analysis.matchStrength };
          } else {
            yield { type: 'property_rejected', propertyId: analysis.propertyId, name: propName, reason: `Match ${(analysis.matchStrength * 100).toFixed(0)}% below threshold` };
          }
          yield {
            type: 'tool_call_result',
            tool: fc.name,
            success: true,
            durationMs: Date.now() - startMs,
            summary: `Match: ${(analysis.matchStrength * 100).toFixed(0)}%`,
          };
        } else {
          toolResult = { error: `Unknown tool: ${fc.name ?? 'unnamed'}` };
          yield { type: 'tool_call_result', tool: fc.name ?? '', success: false, durationMs: Date.now() - startMs, summary: 'Unknown tool' };
        }
      } catch (err) {
        toolResult = { error: String(err) };
        yield { type: 'tool_call_result', tool: fc.name ?? '', success: false, durationMs: Date.now() - startMs, summary: String(err) };
      }

      responseParts.push({
        functionResponse: {
          name: fc.name ?? '',
          response: toolResult,
        },
      });
    }

    contents.push({ role: 'function', parts: responseParts });
  }
}
