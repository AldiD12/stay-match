'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { AgentEvent } from '@/lib/types';

interface Props {
  events: AgentEvent[];
  isRunning: boolean;
}

function EventCard({ event }: { event: AgentEvent }) {
  if (event.type === 'agent_thinking') {
    return (
      <div className="flex items-center gap-3 text-zinc-400 italic text-sm py-1">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse-slow" />
        {event.message}
      </div>
    );
  }

  if (event.type === 'tool_call_start') {
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3">
        <div className="flex items-center gap-2 text-blue-400 font-mono text-xs font-semibold mb-1">
          <span className="h-3 w-3 rounded-full border border-blue-400 border-t-transparent animate-spin" />
          {event.tool}()
        </div>
        <pre className="text-zinc-500 text-xs overflow-x-auto">
          {JSON.stringify(event.params, null, 2)}
        </pre>
      </div>
    );
  }

  if (event.type === 'tool_call_result') {
    return (
      <div className="flex items-center gap-2 text-xs pl-2 border-l-2 border-zinc-700">
        <span className={event.success ? 'text-green-400' : 'text-red-400'}>
          {event.success ? '✓' : '✗'}
        </span>
        <span className="text-zinc-400 font-mono">{event.tool}</span>
        <span className="text-zinc-500">{event.summary}</span>
        <span className="text-zinc-600 ml-auto">{event.durationMs}ms</span>
      </div>
    );
  }

  if (event.type === 'property_accepted') {
    return (
      <div className="flex items-center gap-2 bg-green-950 border border-green-800 rounded-lg px-3 py-2">
        <span className="text-green-400 text-sm">✓</span>
        <span className="text-green-300 text-sm font-medium">{event.name}</span>
        <span className="ml-auto text-green-500 text-xs font-mono">
          {(event.matchScore * 100).toFixed(0)}% match
        </span>
      </div>
    );
  }

  if (event.type === 'property_rejected') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 opacity-50">
        <span className="text-red-500 text-sm">✗</span>
        <span className="text-zinc-500 text-sm line-through">{event.name}</span>
        <span className="ml-auto text-zinc-600 text-xs">{event.reason}</span>
      </div>
    );
  }

  if (event.type === 'final_ranking') {
    return (
      <div className="flex items-center gap-2 bg-blue-950 border border-blue-700 rounded-lg px-3 py-2">
        <span className="text-blue-400">✦</span>
        <span className="text-blue-300 text-sm font-semibold">
          {event.properties.length} match{event.properties.length !== 1 ? 'es' : ''} ranked
        </span>
      </div>
    );
  }

  if (event.type === 'error') {
    return (
      <div className="bg-red-950 border border-red-800 rounded-lg px-3 py-2 text-red-400 text-sm">
        {event.message}
      </div>
    );
  }

  return null;
}

export default function ExecutionVisualizer({ events, isRunning }: Props) {
  const hasContent = events.length > 0 || isRunning;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Agent Execution</span>
        {isRunning && (
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse-slow" />
        )}
      </div>

      {!hasContent && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-zinc-600 text-sm text-center">
            Agent execution trace will appear here<br />as it searches for your match.
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        <AnimatePresence initial={false}>
          {events.map((event, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <EventCard event={event} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
