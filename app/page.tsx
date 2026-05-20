'use client';

import { useState, useCallback } from 'react';
import SearchInput from '@/components/SearchInput';
import DemoQueryButtons from '@/components/DemoQueryButtons';
import ExecutionVisualizer from '@/components/ExecutionVisualizer';
import PropertyCard from '@/components/PropertyCard';
import type { AgentEvent, RankedProperty } from '@/lib/types';

export default function HomePage() {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [properties, setProperties] = useState<RankedProperty[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
    setEvents([]);
    setProperties([]);
    setIsRunning(true);

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Server error: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          let event: AgentEvent;
          try {
            event = JSON.parse(raw) as AgentEvent;
          } catch {
            continue;
          }

          if (event.type === 'final_ranking') {
            setProperties(event.properties);
            setEvents(prev => [...prev, event]);
          } else if (event.type === 'done') {
            setIsRunning(false);
          } else {
            setEvents(prev => [...prev, event]);
          }
        }
      }
    } catch (err) {
      setEvents(prev => [...prev, { type: 'error', message: String(err) }]);
      setIsRunning(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-black p-8 max-w-screen-xl mx-auto">
      {/* Header */}
      <header className="mb-10">
        <div className="flex items-baseline gap-3 mb-2">
          <h1 className="text-4xl font-bold text-zinc-100">StayMatch</h1>
          <span className="text-blue-500 font-mono text-sm">AI</span>
        </div>
        <p className="text-zinc-500 text-lg">
          Describe your perfect Albanian stay. The agent finds it.
        </p>
      </header>

      {/* Search */}
      <div className="space-y-4 mb-10">
        <SearchInput onSearch={handleSearch} isRunning={isRunning} />
        <DemoQueryButtons onSelect={handleSearch} isRunning={isRunning} />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-2 gap-8 items-start">
        {/* Left: Results */}
        <div>
          {properties.length > 0 && (
            <div className="space-y-5">
              <h2 className="text-sm font-mono text-zinc-500 uppercase tracking-wider">
                {properties.length} Match{properties.length !== 1 ? 'es' : ''} Found
              </h2>
              {properties.map((p, i) => (
                <PropertyCard key={p.property.id} property={p} index={i} />
              ))}
            </div>
          )}

          {!isRunning && properties.length === 0 && (
            <div className="flex items-center justify-center h-64 text-zinc-700 text-sm">
              Your matches will appear here.
            </div>
          )}
        </div>

        {/* Right: Live Visualizer */}
        <div className="sticky top-8 bg-zinc-950 border border-zinc-800 rounded-2xl p-6 h-[70vh]">
          <ExecutionVisualizer events={events} isRunning={isRunning} />
        </div>
      </div>
    </div>
  );
}
