import { interpretQuery } from './interpreter';
import { runSearchAgent } from './search';
import { runSynthesisAgent } from './synthesis';
import type { AgentEvent, PropertyAnalysis, QueryIntent } from '../types';

export async function* runOrchestrator(query: string): AsyncGenerator<AgentEvent> {
  try {
    yield { type: 'agent_thinking', message: 'Understanding your travel request...' };

    const intent = await interpretQuery(query);
    yield {
      type: 'agent_thinking',
      message: `Searching ${intent.location} for "${intent.vibe}"...`,
    };

    const acceptedAnalyses: PropertyAnalysis[] = [];
    const allScored: PropertyAnalysis[] = [];

    for await (const event of runSearchAgent(intent, query, acceptedAnalyses, allScored)) {
      yield event;
    }

    // Fallback 1: specific city returned nothing — widen to all Albania
    if (acceptedAnalyses.length === 0 && intent.location !== 'Albania') {
      yield { type: 'agent_thinking', message: `Nothing in ${intent.location} — checking all of Albania...` };
      const broadIntent: QueryIntent = { ...intent, location: 'Albania' };
      for await (const event of runSearchAgent(broadIntent, query, acceptedAnalyses, allScored)) {
        yield event;
      }
    }

    // Fallback 2: still nothing — drop category filter, lower threshold
    if (acceptedAnalyses.length === 0) {
      yield { type: 'agent_thinking', message: 'Broadening search across all place types...' };
      const openIntent: QueryIntent = { ...intent, location: 'Albania' };
      for await (const event of runSearchAgent(openIntent, query, acceptedAnalyses, allScored, true)) {
        yield event;
      }
    }

    // Fallback 3: absolute last resort — take top 3 by raw score, threshold ignored
    // This guarantees the demo never shows a blank screen
    if (acceptedAnalyses.length === 0 && allScored.length > 0) {
      yield { type: 'agent_thinking', message: 'Showing closest matches we could find...' };
      const top3 = [...allScored]
        .sort((a, b) => b.matchStrength - a.matchStrength)
        .slice(0, 3);
      acceptedAnalyses.push(...top3);
    }

    if (acceptedAnalyses.length === 0) {
      yield { type: 'agent_thinking', message: 'No places in our database for this query yet.' };
    } else {
      yield {
        type: 'agent_thinking',
        message: `Writing match explanations for ${acceptedAnalyses.length} places...`,
      };
    }

    const finalProperties = await runSynthesisAgent(query, acceptedAnalyses);

    yield { type: 'final_ranking', properties: finalProperties };
    yield { type: 'done' };
  } catch (err) {
    yield { type: 'error', message: String(err) };
    yield { type: 'done' };
  }
}
