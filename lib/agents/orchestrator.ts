import { interpretQuery } from './interpreter';
import { runSearchAgent } from './search';
import { runSynthesisAgent } from './synthesis';
import type { AgentEvent, PropertyAnalysis } from '../types';

export async function* runOrchestrator(query: string): AsyncGenerator<AgentEvent> {
  try {
    yield { type: 'agent_thinking', message: 'Understanding your travel request...' };

    const intent = await interpretQuery(query);
    yield {
      type: 'agent_thinking',
      message: `Searching ${intent.location} for "${intent.vibe}"...`,
    };

    const acceptedAnalyses: PropertyAnalysis[] = [];

    for await (const event of runSearchAgent(intent, query, acceptedAnalyses)) {
      yield event;
    }

    if (acceptedAnalyses.length === 0) {
      yield { type: 'agent_thinking', message: 'No strong matches found. Broadening search...' };
    } else {
      yield {
        type: 'agent_thinking',
        message: `Writing match explanations for ${acceptedAnalyses.length} properties...`,
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
