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
      <div className="flex items-center gap-3 text-secondary font-serif italic text-sm py-2 bg-surface-container-lowest/50 rounded-xl px-4 border border-outline-variant/10">
        <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse-slow shrink-0" />
        <span className="leading-relaxed">{event.message}</span>
      </div>
    );
  }

  if (event.type === 'tool_call_start') {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 text-primary font-mono text-[11px] font-bold mb-2 uppercase tracking-wider">
          <span className="h-3.5 w-3.5 rounded-full border border-primary border-t-transparent animate-spin shrink-0" />
          {event.tool}()
        </div>
        <pre className="text-on-surface-variant/70 text-[11px] font-mono overflow-x-auto bg-surface-container-low/50 rounded-lg p-2.5 max-h-24">
          {JSON.stringify(event.params, null, 2)}
        </pre>
      </div>
    );
  }

  if (event.type === 'tool_call_result') {
    return (
      <div className="flex items-center gap-3 text-xs pl-3 border-l-2 border-outline/35 py-1 text-on-surface-variant/80 font-medium">
        <span className={event.success ? 'text-secondary font-bold text-sm' : 'text-error font-bold text-sm'}>
          {event.success ? '✓' : '✗'}
        </span>
        <span className="font-mono bg-surface-container-lowest border border-outline-variant/25 px-2 py-0.5 rounded text-[10px] uppercase font-bold shrink-0">{event.tool}</span>
        <span className="truncate max-w-[150px]">{event.summary}</span>
        <span className="text-on-surface-variant/50 ml-auto font-mono text-[10px]">{event.durationMs}ms</span>
      </div>
    );
  }

  if (event.type === 'property_accepted') {
    return (
      <div className="flex items-center gap-2 bg-secondary-container/60 border border-outline-variant/30 rounded-xl px-4 py-3 shadow-sm">
        <span className="material-symbols-outlined text-[18px] text-on-secondary-container">auto_awesome</span>
        <span className="text-on-secondary-container text-xs font-bold uppercase tracking-wider truncate max-w-[140px]">{event.name}</span>
        <span className="ml-auto bg-surface-container-lowest text-on-secondary-container border border-outline-variant/25 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0">
          {(event.matchScore * 100).toFixed(0)}% match
        </span>
      </div>
    );
  }

  if (event.type === 'property_rejected') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 border border-outline-variant/10 rounded-xl bg-surface-container-lowest/30 opacity-60 text-xs">
        <span className="text-error font-bold shrink-0 text-sm">✗</span>
        <span className="text-on-surface-variant/70 line-through truncate max-w-[120px] font-medium">{event.name}</span>
        <span className="ml-auto text-on-surface-variant/50 text-[10px] font-semibold italic max-w-[130px] truncate">{event.reason}</span>
      </div>
    );
  }

  if (event.type === 'final_ranking') {
    return (
      <div className="flex items-center gap-2 bg-primary text-on-primary rounded-xl px-4 py-3 shadow-md">
        <span className="material-symbols-outlined text-[18px] text-white shrink-0 animate-bounce">auto_awesome</span>
        <span className="text-xs font-bold uppercase tracking-wider">
          {event.properties.length} matches ranked
        </span>
      </div>
    );
  }

  if (event.type === 'error') {
    return (
      <div className="bg-error-container border border-error/20 rounded-xl px-4 py-3 text-error text-xs font-semibold leading-relaxed">
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
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          <span className="font-label-sm text-[11px] font-bold text-secondary uppercase tracking-widest">Agent Execution</span>
          {isRunning && (
            <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse-slow shrink-0" />
          )}
        </div>
        <span className="text-[10px] font-mono text-on-surface-variant/40 font-bold uppercase tracking-wider">Trace Logs</span>
      </div>

      {!hasContent && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <span className="material-symbols-outlined text-[36px] text-on-surface-variant/20 mb-4 animate-pulse-slow">insights</span>
          <p className="text-on-surface-variant/50 font-serif italic text-sm leading-relaxed max-w-[200px]">
            AI curation pipeline will trace here live as it matches your stay.
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        <AnimatePresence initial={false}>
          {events.map((event, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <EventCard event={event} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

