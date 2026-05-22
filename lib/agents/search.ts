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
  // Collects ALL scored properties regardless of threshold — used by orchestrator as last resort
  allScored: PropertyAnalysis[],
  lowThreshold = false,
): AsyncGenerator<AgentEvent> {
  const systemPrompt = `You are a property matching agent for Albania. Follow these steps EXACTLY:
1. Call fetchProperties ONCE to get candidates. Do NOT call it again.
2. For EACH property returned, call analyzePropertyReviews with the criteria below.
3. After all analyzePropertyReviews calls are done, output a single summary sentence. Stop.

Criteria for analyzePropertyReviews: "${originalQuery} — ${intent.vibe}"
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
      // Vertex AI prefixes tool names with "default_api." — strip it before matching
      const toolName = (fc.name ?? '').replace(/^default_api\./, '');
      yield { type: 'tool_call_start', tool: toolName, params: args };

      let toolResult: Record<string, unknown>;
      try {
        if (toolName === 'fetchProperties') {
          const found = fetchProperties(args as Parameters<typeof fetchProperties>[0]);
          toolResult = { properties: found };
          yield {
            type: 'tool_call_result',
            tool: toolName,
            success: true,
            durationMs: Date.now() - startMs,
            summary: `Found ${found.length} candidate(s)`,
          };
        } else if (toolName === 'analyzePropertyReviews') {
          const analysis = await analyzePropertyReviews(
            args as unknown as Parameters<typeof analyzePropertyReviews>[0],
          );
          toolResult = { ...analysis } as Record<string, unknown>;
          const prop = allProps.find(p => p.id === analysis.propertyId);
          const propName = prop?.name ?? analysis.propertyId;

          // Always track every scored property — deduped by propertyId
          const alreadyTracked = allScored.some(s => s.propertyId === analysis.propertyId);
          if (!alreadyTracked) allScored.push(analysis);

          const threshold = lowThreshold ? 0.30 : 0.45;
          const isAccepted = analysis.matchStrength >= threshold && acceptedCollector.length < 5;

          if (isAccepted) {
            acceptedCollector.push(analysis);
            yield { type: 'property_accepted', propertyId: analysis.propertyId, name: propName, matchScore: analysis.matchStrength };
          } else {
            yield { type: 'property_rejected', propertyId: analysis.propertyId, name: propName, reason: `Match ${(analysis.matchStrength * 100).toFixed(0)}% below threshold` };
          }
          yield {
            type: 'tool_call_result',
            tool: toolName,
            success: true,
            durationMs: Date.now() - startMs,
            summary: `Match: ${(analysis.matchStrength * 100).toFixed(0)}%`,
          };
        } else {
          toolResult = { error: `Unknown tool: ${fc.name ?? 'unnamed'}` };
          yield { type: 'tool_call_result', tool: toolName, success: false, durationMs: Date.now() - startMs, summary: 'Unknown tool' };
        }
      } catch (err) {
        toolResult = { error: String(err) };
        yield { type: 'tool_call_result', tool: toolName, success: false, durationMs: Date.now() - startMs, summary: String(err) };
      }

      responseParts.push({
        functionResponse: {
          // Send back the original name (with prefix) so Vertex AI can match it
          name: fc.name ?? '',
          response: toolResult,
        },
      });
    }

    contents.push({ role: 'function', parts: responseParts });
  }
}
