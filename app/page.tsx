'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchInput from '@/components/SearchInput';
import DemoQueryButtons from '@/components/DemoQueryButtons';
import ExecutionVisualizer from '@/components/ExecutionVisualizer';
import PropertyCard from '@/components/PropertyCard';
import PlaneTransition from '@/components/PlaneTransition';
import type { AgentEvent, RankedProperty } from '@/lib/types';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  properties?: RankedProperty[];
  events?: AgentEvent[];
  isRunning?: boolean;
  isError?: boolean;
}

function getAssistantResponseText(query: string, propertiesCount: number): string {
  if (propertiesCount === 0) {
    return `I searched thoroughly for properties matching your request, but couldn't find any direct matches. Could you try refining your criteria (e.g. adjusting locations, budget, or amenities)?`;
  }
  return `Perfect. I've curated a selection of ${propertiesCount} premium properties ideal for your request, combining inspiring views with reliable infrastructure. Take a look at these matches.`;
}

interface PolaroidData {
  id: string;
  src: string;
  alt: string;
  caption: string;
  query: string;
}

const POLAROIDS: PolaroidData[] = [
  {
    id: 'ksamil-beach',
    src: 'https://images.unsplash.com/photo-1599946347371-68eb71b16afc?auto=format&fit=crop&w=600&q=80',
    alt: 'Ksamil Beach turquoise waters',
    caption: 'Ksamil Paradise',
    query: 'luxury beachfront villa in Ksamil or Sarandë with turquoise sea views, fast fiber wifi, and a spacious terrace',
  },
  {
    id: 'theth-mountains',
    src: 'https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=600&q=80',
    alt: 'Theth Albanian Alps mountains',
    caption: 'Albanian Alps',
    query: 'cozy mountain guesthouse in Theth or Valbona with alpine views, stone architecture, fireplace, and peaceful workspaces',
  },
  {
    id: 'berat-houses',
    src: 'https://images.unsplash.com/photo-1705405999485-188af37e0462?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YmVyYXR8ZW58MHx8MHx8fDA%3D',
    alt: 'Berat white Ottoman houses',
    caption: 'City of Windows',
    query: 'historic Ottoman house in Berat with traditional white architecture, mountain views, and authentic Albanian character',
  },
  {
    id: 'gjirokaster-stone',
    src: 'https://images.unsplash.com/photo-1630339858071-4e64cc76fb6c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Z2ppcm9rYXN0ZXJ8ZW58MHx8MHx8fDA%3D',
    alt: 'Gjirokastër stone architecture',
    caption: 'Stone City',
    query: 'UNESCO heritage stone house in Gjirokastër with castle views, traditional architecture, and modern amenities',
  },
  {
    id: 'riviera-sunset',
    src: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
    alt: 'Albanian Riviera sunset coastline',
    caption: 'Riviera Sunset',
    query: 'stunning coastal villa on the Albanian Riviera in Dhërmi or Himara with sunset views, infinity pool, and outdoor workspace',
  },
  {
    id: 'tirana-modern',
    src: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=600&q=80',
    alt: 'Tirana colorful buildings',
    caption: 'Vibrant Tirana',
    query: 'modern apartment in central Tirana with colorful architecture, rooftop terrace, high-speed internet, and city views',
  },
];

interface PolaroidPhotoProps {
  src: string;
  alt: string;
  caption: string;
  className?: string;
  rotation?: string;
}

function PolaroidPhoto({ src, alt, caption, className = '', rotation = 'rotate-0' }: PolaroidPhotoProps) {
  return (
    <div
      className={`group bg-white border border-[#e9e8e5] p-3 pb-7 shadow-[0_8px_30px_rgba(26,26,26,0.04)] hover:shadow-[0_20px_40px_rgba(26,26,26,0.08)] hover:-translate-y-2 hover:scale-[1.03] transition-all duration-500 ease-out hover:z-30 select-none ${rotation} ${className}`}
    >
      <div className="relative w-full aspect-square overflow-hidden bg-neutral-50">
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
      </div>
      <div className="mt-3 text-center">
        <span className="font-serif italic font-normal text-secondary text-sm select-none block">
          {caption}
        </span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [mode, setMode] = useState<'discover' | 'concierge'>('discover');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [conciergeQuery, setConciergeQuery] = useState('');
  const [bottomQuery, setBottomQuery] = useState('');
  const [conciergeTab, setConciergeTab] = useState<'chat' | 'properties'>('chat');

  // Global legacy states for Discover mode Curation Workspace fallback
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [properties, setProperties] = useState<RankedProperty[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message on mount to prevent SSR locale/time hydration mismatch
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: "Welcome to StayMatch Luxury Concierge. I can help you find premium properties tailored to your exact work and lifestyle requirements in Albania. How can I assist you today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  }, []);

  // Auto scroll to trace workspace when search starts in Discover mode
  useEffect(() => {
    if (mode === 'discover' && isRunning && workspaceRef.current) {
      setTimeout(() => {
        workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [isRunning, mode]);

  // Auto scroll to bottom of chat when new messages arrive or isRunning triggers
  useEffect(() => {
    if (mode === 'concierge') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isRunning, mode]);

  const handleSearch = useCallback(async (query: string) => {
    // 1. Strict Input Sanitization & 500-Character Cap (Bulletproof Safeguard)
    const cleanedQuery = query.trim().slice(0, 500);
    if (!cleanedQuery) return;

    setMode('concierge');
    setIsRunning(true);
    setEvents([]);
    setProperties([]);
    setConciergeTab('chat');

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsgId = 'user-' + Date.now();
    const assistantMsgId = 'assistant-' + Date.now();

    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: cleanedQuery,
      timestamp,
    };

    const assistantMessage: ChatMessage = {
      id: assistantMsgId,
      sender: 'assistant',
      text: '',
      timestamp,
      properties: [],
      events: [],
      isRunning: true,
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setSelectedMessageId(assistantMsgId);

    let currentEvents: AgentEvent[] = [];
    let currentProperties: RankedProperty[] = [];

    // 2. Defensive SSE Stream Reading
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: cleanedQuery }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Server returned status code: ${res.status}`);
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
            continue; // Skip malformed JSON entries defensively
          }

          if (event.type === 'final_ranking') {
            currentProperties = event.properties;
            setProperties(event.properties);
            currentEvents.push(event);
          } else if (event.type === 'done') {
            // Handled on loop completion
          } else {
            currentEvents.push(event);
          }

          setEvents([...currentEvents]);

          // Dynamically stream events directly to the message thread bubble
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    events: [...currentEvents],
                    properties: [...currentProperties],
                  }
                : msg
            )
          );
        }
      }

      const finalResponseText = getAssistantResponseText(cleanedQuery, currentProperties.length);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                text: finalResponseText,
                isRunning: false,
              }
            : msg
        )
      );
      setIsRunning(false);
      if (currentProperties.length > 0) {
        setConciergeTab('properties');
      }

    } catch (err) {
      const errorMessage = String(err);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                text: `I encountered an unexpected issue while searching: ${errorMessage}. Please try refining your criteria or search again.`,
                isError: true,
                isRunning: false,
              }
            : msg
        )
      );
      setIsRunning(false);
    }
  }, []);

  const handleConciergeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (conciergeQuery.trim() && !isRunning) {
      handleSearch(conciergeQuery.trim());
      setConciergeQuery('');
    }
  };

  const handleBottomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bottomQuery.trim() && !isRunning) {
      handleSearch(bottomQuery.trim());
      setBottomQuery('');
    }
  };

  const hasWorkspace = isRunning || properties.length > 0;

  // Retrieve properties for currently selected message or default to latest global properties
  const selectedMsg = messages.find(m => m.id === selectedMessageId);
  const selectedMessageProperties = selectedMsg?.properties ?? properties;

  // Track expanded trace card IDs in chat thread to create a rich detail inspector
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);

  // Auto-expand active assistant search trace
  useEffect(() => {
    if (isRunning && selectedMessageId) {
      setExpandedTraceId(selectedMessageId);
    }
  }, [isRunning, selectedMessageId]);

  return (
    <>
      <PlaneTransition />
      {/* Top NavBar */}
      <nav className="hidden md:block fixed bg-surface/90 backdrop-blur-md top-0 border-b border-outline-variant/30 w-full h-20 px-margin-mobile md:px-margin-desktop z-50 transition-all duration-200">
        <div className="flex justify-between items-center w-full h-full max-w-container-max mx-auto">
          <div 
            onClick={() => setMode('discover')} 
            className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed tracking-tight cursor-pointer select-none"
          >
            StayMatch
          </div>
          <div className="flex items-center gap-8 h-full">
            {/* Discover */}
            <button 
              onClick={() => setMode('discover')}
              className={`font-label-lg text-label-lg transition-colors duration-200 scale-95 active:transition-transform h-full flex items-center pt-1 px-1 cursor-pointer border-b-2 ${
                mode === 'discover' 
                  ? 'text-primary font-bold border-primary' 
                  : 'text-on-surface-variant/70 border-transparent hover:text-primary'
              }`}
            >
              Discover
            </button>
            {/* Collections (Inactive) */}
            <button className="font-label-lg text-label-lg text-on-surface-variant/60 hover:text-primary transition-colors duration-200 scale-95 cursor-default h-full flex items-center pt-1 px-1">
              Collections
            </button>
            {/* Concierge */}
            <button 
              onClick={() => setMode('concierge')}
              className={`font-label-lg text-label-lg transition-colors duration-200 scale-95 active:transition-transform h-full flex items-center pt-1 px-1 cursor-pointer border-b-2 ${
                mode === 'concierge' 
                  ? 'text-primary font-bold border-primary' 
                  : 'text-on-surface-variant/70 border-transparent hover:text-primary'
              }`}
            >
              Concierge
            </button>
          </div>
          <button className="font-label-lg text-label-lg text-primary scale-95 active:transition-transform hover:opacity-75 transition-opacity font-bold">
            Sign In
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      {mode === 'concierge' ? (
        <div className="flex-grow flex flex-col md:flex-row w-full max-w-container-max mx-auto h-[calc(100dvh-80px)] md:h-[calc(100dvh-80px)] mt-0 md:mt-20 overflow-hidden">
          {/* Mobile Segmented Tab Selector */}
          <div className="md:hidden flex p-3 bg-surface-container-low border-b border-outline-variant/30 justify-center items-center gap-2 w-full">
            <button
              onClick={() => setConciergeTab('chat')}
              className={`flex-1 py-2.5 text-center rounded-full text-xs uppercase font-bold tracking-wider transition-all duration-300 ${
                conciergeTab === 'chat'
                  ? 'bg-primary text-on-primary shadow-md'
                  : 'text-on-surface-variant/75 hover:bg-surface-container-high'
              }`}
            >
              Chat Concierge
            </button>
            <button
              onClick={() => setConciergeTab('properties')}
              className={`flex-1 py-2.5 text-center rounded-full text-xs uppercase font-bold tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 ${
                conciergeTab === 'properties'
                  ? 'bg-primary text-on-primary shadow-md'
                  : 'text-on-surface-variant/75 hover:bg-surface-container-high'
              }`}
            >
              Curated Stays
              {selectedMessageProperties.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  conciergeTab === 'properties' ? 'bg-white text-primary' : 'bg-primary text-white'
                }`}>
                  {selectedMessageProperties.length}
                </span>
              )}
            </button>
          </div>
          
          {/* Left Column: Chat Thread (35%) */}
          <aside className={`w-full md:w-[35%] flex flex-col border-r border-outline-variant/50 bg-surface-bright flex-1 md:flex-none md:h-full min-h-0 overflow-hidden ${
            conciergeTab === 'chat' ? 'flex' : 'hidden md:flex'
          }`}>
            {/* Chat Header (Mobile Only) */}
            <div className="md:hidden p-4 border-b border-outline-variant/50 flex items-center justify-between">
              <h1 className="font-headline-md text-headline-md text-on-surface">Concierge</h1>
              <button className="text-on-surface-variant/70">
                <span className="material-symbols-outlined text-[24px]">more_horiz</span>
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 custom-scrollbar pb-6 md:pb-6">
              {/* Today Badge */}
              <div className="text-center my-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant/75 uppercase tracking-wider bg-surface-container-low px-4 py-1.5 rounded-full border border-outline-variant/20">
                  Today
                </span>
              </div>

              {/* Message List */}
              {messages.map((msg) => (
                <div key={msg.id} className="space-y-3">
                  {msg.sender === 'user' ? (
                    /* User Message Capsule */
                    <div className="flex justify-end">
                      <div className="bg-primary text-on-primary rounded-3xl rounded-tr-none px-6 py-4 max-w-[85%] font-body-md text-body-md shadow-sm leading-relaxed text-balance">
                        {msg.text}
                      </div>
                    </div>
                  ) : (
                    /* Assistant Message Capsule */
                    <div 
                      className={`flex flex-col gap-2 transition-all duration-300 rounded-[2rem] p-1.5 ${
                        selectedMessageId === msg.id 
                          ? 'bg-surface-container-low/40 border border-outline-variant/15' 
                          : 'border border-transparent'
                      }`}
                    >
                      <div className="flex justify-start items-start gap-2.5">
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center shrink-0 shadow-sm border border-outline-variant/10">
                          <span 
                            className="material-symbols-outlined text-[16px] text-on-secondary-container" 
                            style={{ fontVariationSettings: '"FILL" 1' }}
                          >
                            auto_awesome
                          </span>
                        </div>
                        {/* Content bubble */}
                        <div 
                          className={`text-on-surface border rounded-3xl rounded-tl-none px-6 py-4 max-w-[85%] font-body-md text-body-md shadow-sm leading-relaxed ${
                            msg.isError 
                              ? 'border-error-container/30 bg-error-container/20 text-error' 
                              : 'bg-surface-container-low border-outline-variant/30'
                          }`}
                        >
                          {msg.isRunning && !msg.text ? (
                            /* Typing Indicator Bouncing Dots */
                            <div className="flex items-center gap-1.5 py-1">
                              <div className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          ) : (
                            msg.text
                          )}
                        </div>
                      </div>

                      {/* Interactive In-Bubble Execution Trace Logs */}
                      {msg.events && msg.events.length > 0 && (
                        <div className="pl-10.5 pr-2.5 w-full">
                          <div className="border-t border-outline-variant/20 pt-3 mt-1">
                            <button 
                              onClick={() => setExpandedTraceId(expandedTraceId === msg.id ? null : msg.id)}
                              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-secondary hover:text-primary transition-colors focus:outline-none"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                {expandedTraceId === msg.id ? 'keyboard_arrow_up' : 'insights'}
                              </span>
                              <span>{expandedTraceId === msg.id ? 'Hide Curation Logs' : 'View Curation Logs'}</span>
                              {msg.isRunning && (
                                <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse shrink-0" />
                              )}
                            </button>
                            
                            <AnimatePresence>
                              {expandedTraceId === msg.id && (
                                <motion.div 
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-3 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 shadow-inner max-h-[220px] overflow-y-auto custom-scrollbar"
                                >
                                  <ExecutionVisualizer events={msg.events} isRunning={msg.isRunning || false} />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Area */}
            <div className="p-4 md:p-6 bg-surface-bright pb-safe border-t border-outline-variant/30 z-10 shadow-[0_-4px_24px_rgba(26,26,26,0.02)]">
              <form onSubmit={handleConciergeSubmit} className="relative w-full max-w-md mx-auto">
                <input 
                  type="text"
                  value={conciergeQuery}
                  onChange={(e) => setConciergeQuery(e.target.value)}
                  disabled={isRunning}
                  placeholder={isRunning ? "AI Concierge is processing..." : "Refine your search or ask something else..."}
                  className="w-full bg-surface-container-lowest border border-secondary-container rounded-full py-4 pl-6 pr-14 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-[0_4px_20px_rgba(26,26,26,0.04)] placeholder-on-surface-variant/40 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button 
                  type="submit"
                  disabled={isRunning || !conciergeQuery.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-on-primary rounded-full hover:bg-primary-container transition-colors flex items-center justify-center focus:outline-none disabled:opacity-30 disabled:hover:bg-primary"
                >
                  {isRunning ? (
                    <span className="h-4 w-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
                  )}
                </button>
              </form>
            </div>
          </aside>

          {/* Right Column: Property Grid (65%) */}
          <main className={`w-full md:w-[65%] p-6 md:p-10 overflow-y-auto bg-surface-container-lowest flex-1 md:flex-none md:h-full min-h-0 custom-scrollbar pb-10 ${
            conciergeTab === 'properties' ? 'block' : 'hidden md:block'
          }`}>
            <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                {selectedMessageProperties.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[11px] font-bold uppercase tracking-widest text-green-600">
                        {selectedMessageProperties.length} match{selectedMessageProperties.length !== 1 ? 'es' : ''} found
                      </span>
                    </div>
                    <h2 className="font-headline-lg text-headline-lg text-on-surface">Curated for You</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                      Avg. vibe match: <strong>{Math.round(selectedMessageProperties.reduce((s, p) => s + p.vibeMatchPercent, 0) / selectedMessageProperties.length)}%</strong>
                      {' · '}Sorted by compatibility
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="font-headline-lg text-headline-lg text-on-surface">Curated for You</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">Describe your ideal stay to get matched</p>
                  </>
                )}
              </div>
            </header>

            {selectedMessageProperties.length > 0 ? (
              <div className="space-y-6">
                {/* #1 result — featured hero card */}
                <PropertyCard key={selectedMessageProperties[0].property.id} property={selectedMessageProperties[0]} index={0} featured={true} />
                {/* Rest in 2-col grid */}
                {selectedMessageProperties.length > 1 && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-gutter">
                    {selectedMessageProperties.slice(1).map((p, i) => (
                      <PropertyCard key={p.property.id} property={p} index={i + 1} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[55vh] text-center border border-dashed border-outline-variant/40 rounded-[2.5rem] bg-surface-container-lowest/30 p-8 shadow-inner">
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant/20 mb-4 animate-bounce">page_info</span>
                <p className="text-on-surface-variant font-serif italic text-base max-w-xs leading-relaxed">
                  {isRunning
                    ? "Evaluating and scoring stays matching your lifestyle..."
                    : "No matches loaded. Send a message to stream curated stays here."}
                </p>
              </div>
            )}
          </main>
        </div>
      ) : (
        /* Discover Mode (Landing Page View) */
        <main className="flex-grow flex flex-col pt-0 md:pt-20">
          
          {/* Hero Section */}
          <section 
            className="relative w-full min-h-[90vh] flex flex-col justify-center items-center px-margin-mobile md:px-margin-desktop py-stack-lg z-10"
            style={{ background: 'radial-gradient(circle at center 60%, rgba(241, 223, 209, 0.4) 0%, rgba(250, 249, 246, 1) 60%)', overflow: 'hidden' }}
          >
            {/* Floating Ambient Watermarks */}
            <PolaroidPhoto
              src={POLAROIDS[0].src}
              alt={POLAROIDS[0].alt}
              caption={POLAROIDS[0].caption}
              rotation="rotate-[-6deg]"
              className="absolute top-[6%] left-[8%] w-[130px] lg:w-[170px] hidden lg:block opacity-40 hover:opacity-100 hover:rotate-[-2deg] transition-all duration-500"
            />
            <PolaroidPhoto
              src={POLAROIDS[1].src}
              alt={POLAROIDS[1].alt}
              caption={POLAROIDS[1].caption}
              rotation="rotate-[5deg]"
              className="absolute top-[8%] right-[8%] w-[140px] lg:w-[180px] hidden lg:block opacity-40 hover:opacity-100 hover:rotate-[2deg] transition-all duration-500"
            />
            <PolaroidPhoto
              src={POLAROIDS[2].src}
              alt={POLAROIDS[2].alt}
              caption={POLAROIDS[2].caption}
              rotation="rotate-[-3deg]"
              className="absolute top-[44%] left-[6%] w-[120px] lg:w-[160px] hidden xl:block opacity-35 hover:opacity-100 hover:rotate-0 transition-all duration-500"
            />
            <PolaroidPhoto
              src={POLAROIDS[3].src}
              alt={POLAROIDS[3].alt}
              caption={POLAROIDS[3].caption}
              rotation="rotate-[4deg]"
              className="absolute top-[46%] right-[6%] w-[120px] lg:w-[160px] hidden xl:block opacity-35 hover:opacity-100 hover:rotate-0 transition-all duration-500"
            />
            <PolaroidPhoto
              src={POLAROIDS[4].src}
              alt={POLAROIDS[4].alt}
              caption={POLAROIDS[4].caption}
              rotation="rotate-[3deg]"
              className="absolute bottom-[4%] left-[10%] w-[130px] lg:w-[170px] hidden lg:block opacity-40 hover:opacity-100 hover:rotate-[-1deg] transition-all duration-500"
            />
            <PolaroidPhoto
              src={POLAROIDS[5].src}
              alt={POLAROIDS[5].alt}
              caption={POLAROIDS[5].caption}
              rotation="rotate-[-4deg]"
              className="absolute bottom-[6%] right-[10%] w-[130px] lg:w-[170px] hidden lg:block opacity-40 hover:opacity-100 hover:rotate-[1deg] transition-all duration-500"
            />

            <div className="relative z-10 text-center w-full max-w-[950px] mx-auto">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="font-display-lg text-[32px] leading-[40px] sm:text-[44px] sm:leading-[54px] md:text-[72px] md:leading-[82px] font-bold text-primary mb-6 md:mb-10 tracking-tight text-balance max-w-4xl mx-auto"
              >
                Where does your <span className="font-serif italic font-normal text-secondary">Heart Wants To Go?</span>
              </motion.h1>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="mb-8"
              >
                <SearchInput onSearch={handleSearch} isRunning={isRunning} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <DemoQueryButtons onSelect={handleSearch} isRunning={isRunning} />
              </motion.div>
            </div>
          </section>

          {/* Legacy Curation Workspace under Hero (Fallback check) */}
          <AnimatePresence>
            {hasWorkspace && (
              <motion.section 
                ref={workspaceRef}
                id="curation-workspace"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="py-24 px-margin-mobile md:px-margin-desktop bg-surface-container-low/30 border-y border-outline-variant/20 overflow-hidden"
              >
                <div className="max-w-container-max mx-auto w-full">
                  <div className="text-center mb-16">
                    <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest block mb-3">AI Engine Workspace</span>
                    <h2 className="font-display-lg text-3xl md:text-5xl font-bold text-primary tracking-tight">
                      Your custom stay short-list, <span className="font-serif italic font-normal text-secondary">curated</span> in real-time
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    
                    {/* Left Column: AI Live Trace */}
                    <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant/35 rounded-[2rem] p-6 h-[72vh] flex flex-col shadow-[0_8px_32px_rgba(26,26,26,0.03)] overflow-hidden">
                      <ExecutionVisualizer events={events} isRunning={isRunning} />
                    </div>

                    {/* Right Column: Curated Property Results */}
                    <div className="lg:col-span-7 space-y-8">
                      {properties.length > 0 ? (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                            <span className="font-label-sm text-xs font-bold text-secondary uppercase tracking-widest">
                              Verified Matches ({properties.length})
                            </span>
                            <span className="text-xs text-on-surface-variant/60 font-semibold uppercase tracking-wider">Sorted by compatibility</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {properties.map((p, i) => (
                              <PropertyCard key={p.property.id} property={p} index={i} />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[50vh] text-center border border-dashed border-outline-variant/50 rounded-[2.5rem] bg-surface-container-lowest/30 p-8">
                          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 mb-4 animate-bounce">page_info</span>
                          <p className="text-on-surface-variant font-serif italic text-base max-w-xs leading-relaxed">
                            Evaluating and scoring stays matching your lifestyle...
                          </p>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Curated Collections Section */}
          <section className="py-16 md:py-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full">
            <h2 className="font-display-lg text-3xl md:text-6xl font-bold text-primary mb-10 md:mb-24 text-center tracking-tight max-w-4xl mx-auto leading-tight">
              Curated collections for the <span className="font-serif italic font-normal text-secondary">modern explorer</span>.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12 lg:gap-16 justify-items-center">
              {POLAROIDS.map((item, index) => {
                const rotations = ["rotate-[-1.5deg]", "rotate-[2deg]", "rotate-[-1deg]", "rotate-[1.5deg]", "rotate-[-2deg]", "rotate-[1.2deg]"];
                return (
                  <div key={item.id} className="w-full max-w-[280px] sm:max-w-[320px]">
                    <PolaroidPhoto
                      src={item.src}
                      alt={item.alt}
                      caption={item.caption}
                      rotation={rotations[index % rotations.length]}
                    />
                  </div>
                );
              })}
            </div>
          </section>

          {/* How It Works Section */}
          <section className="py-16 md:py-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full border-t border-outline-variant/10">
            <h2 className="font-display-lg text-3xl md:text-6xl font-bold text-primary mb-10 md:mb-24 text-center tracking-tight leading-tight">
              Your stay, <span className="font-serif italic font-normal text-secondary">curated</span> in seconds.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
              <div className="flex flex-col items-center text-center group">
                <div className="text-8xl font-serif italic text-secondary/20 mb-6 group-hover:text-secondary transition-colors duration-500 font-bold">01</div>
                <h3 className="font-headline-md text-2xl font-bold mb-4 tracking-tight">Describe Your Vibe</h3>
                <p className="text-on-surface-variant/80 font-body-lg leading-relaxed max-w-sm">
                  Type naturally exactly what you want. Fast fiber wifi, quiet nights, stone castle vaults — we handle it all.
                </p>
              </div>
              <div className="flex flex-col items-center text-center group md:mt-12">
                <div className="text-8xl font-serif italic text-secondary/20 mb-6 group-hover:text-secondary transition-colors duration-500 font-bold">02</div>
                <h3 className="font-headline-md text-2xl font-bold mb-4 tracking-tight">AI Deep-Match</h3>
                <p className="text-on-surface-variant/80 font-body-lg leading-relaxed max-w-sm">
                  Our resident AI cross-references property listings, verifying actual connection speed tests and noise parameters.
                </p>
              </div>
              <div className="flex flex-col items-center text-center group md:mt-24">
                <div className="text-8xl font-serif italic text-secondary/20 mb-6 group-hover:text-secondary transition-colors duration-500 font-bold">03</div>
                <h3 className="font-headline-md text-2xl font-bold mb-4 tracking-tight">Book Instantly</h3>
                <p className="text-on-surface-variant/80 font-body-lg leading-relaxed max-w-sm">
                  Receive a highly accurate premium shortlist matched specifically to you, ready to compare and secure.
                </p>
              </div>
            </div>
          </section>

          {/* Features Grid Section */}
          <section className="py-16 md:py-32 px-margin-mobile md:px-margin-desktop bg-surface-container-lowest border-y border-outline-variant/10 relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.015] pointer-events-none"></div>
            <div className="max-w-container-max mx-auto w-full relative z-10">
              <h2 className="font-display-lg text-3xl md:text-5xl font-bold text-primary mb-10 md:mb-20 text-center tracking-tight">
                Built for how you live and work
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="bg-surface rounded-[2.2rem] p-12 flex flex-col items-center text-center shadow-[0_12px_40px_rgba(26,26,26,0.02)] border border-outline-variant/30 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                  <span className="material-symbols-outlined text-[48px] text-primary mb-8 opacity-80 group-hover:opacity-100 transition-opacity">wifi</span>
                  <h3 className="font-headline-md text-2xl font-bold mb-4">Verified Speed</h3>
                  <p className="text-on-surface-variant font-body-md leading-relaxed">
                    250+ Mbps connection tests guaranteed for seamless, reliable streaming.
                  </p>
                </div>
                <div className="bg-surface rounded-[2.2rem] p-12 flex flex-col items-center text-center shadow-[0_12px_40px_rgba(26,26,26,0.02)] border border-outline-variant/30 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                  <span className="material-symbols-outlined text-[48px] text-primary mb-8 opacity-80 group-hover:opacity-100 transition-opacity">volume_off</span>
                  <h3 className="font-headline-md text-2xl font-bold mb-4">Quiet Zone Assurance</h3>
                  <p className="text-on-surface-variant font-body-md leading-relaxed">
                    Insulated quiet hours and quiet zones after 9 PM to foster restorative sleep.
                  </p>
                </div>
                <div className="bg-surface rounded-[2.2rem] p-12 flex flex-col items-center text-center shadow-[0_12px_40px_rgba(26,26,26,0.02)] border border-outline-variant/30 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                  <span className="material-symbols-outlined text-[48px] text-primary mb-8 opacity-80 group-hover:opacity-100 transition-opacity">desk</span>
                  <h3 className="font-headline-md text-2xl font-bold mb-4">Ergonomic Workspaces</h3>
                  <p className="text-on-surface-variant font-body-md leading-relaxed">
                    Dedicated high-quality desks and proper seating in every curated unit.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Final CTA Banner */}
          <section className="py-12 md:py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full">
            <div className="bg-primary rounded-[2rem] md:rounded-[3rem] p-8 sm:p-12 md:p-28 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-container/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

              <h2 className="font-display-lg text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-8 md:mb-16 tracking-tight relative z-10 max-w-2xl mx-auto leading-tight">
                Ready to find your match?
              </h2>

              <div className="w-full max-w-3xl relative z-10">
                <form onSubmit={handleBottomSubmit} className="relative flex items-center w-full h-14 md:h-20 rounded-full bg-white border border-transparent shadow-2xl focus-within:ring-4 focus-within:ring-white/20 transition-all overflow-hidden pl-5 md:pl-8 pr-2">
                  <span className="material-symbols-outlined text-on-surface-variant mr-2 md:mr-4 text-[22px] md:text-[28px] shrink-0">search</span>
                  <input
                    type="text"
                    value={bottomQuery}
                    onChange={e => setBottomQuery(e.target.value)}
                    placeholder="Where to in Albania?"
                    className="w-full h-full bg-transparent border-none focus:ring-0 text-sm md:text-body-lg text-primary placeholder:text-on-surface-variant/40 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isRunning || !bottomQuery.trim()}
                    className="bg-primary text-white rounded-full p-3 md:p-4 hover:bg-zinc-800 transition-colors ml-2 flex items-center justify-center h-10 w-10 md:h-16 md:w-16 shrink-0 shadow-md disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-[18px] md:text-[24px]">arrow_forward</span>
                  </button>
                </form>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="w-full border-t border-outline-variant/30 bg-surface-container-lowest pt-16 pb-32 md:pb-16 px-margin-mobile md:px-margin-desktop mt-12">
            <div className="max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
              <div 
                onClick={() => setMode('discover')} 
                className="font-headline-md text-headline-md font-bold text-primary tracking-tight cursor-pointer"
              >
                StayMatch
              </div>
              <div className="flex space-x-12">
                <button className="font-label-lg text-on-surface-variant/80 hover:text-primary transition-colors font-bold uppercase tracking-wider text-xs cursor-default">Product</button>
                <button className="font-label-lg text-on-surface-variant/80 hover:text-primary transition-colors font-bold uppercase tracking-wider text-xs cursor-default">Destinations</button>
                <button className="font-label-lg text-on-surface-variant/80 hover:text-primary transition-colors font-bold uppercase tracking-wider text-xs cursor-default">Company</button>
              </div>
              <div className="flex space-x-6">
                <a className="text-on-surface-variant/60 hover:text-primary transition-colors" href="#">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path></svg>
                </a>
                <a className="text-on-surface-variant/60 hover:text-primary transition-colors" href="#">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path></svg>
                </a>
              </div>
            </div>
          </footer>
        </main>
      )}

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-20 pb-safe px-4 bg-surface border-t border-outline-variant/30 z-50 shadow-[0_-4px_20px_rgba(26,26,26,0.06)]">
        {/* Discover */}
        <button 
          onClick={() => setMode('discover')}
          className={`flex flex-col items-center justify-center rounded-full px-5 py-1 text-xs font-semibold scale-90 transition-transform active:scale-100 cursor-pointer ${
            mode === 'discover' 
              ? 'bg-secondary-container text-on-secondary-container shadow-sm border border-outline-variant/10' 
              : 'text-on-surface-variant/70 hover:bg-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined mb-0.5" style={{ fontVariationSettings: mode === 'discover' ? '"FILL" 1' : '"FILL" 0' }}>explore</span>
          <span className="font-label-sm text-[10px] uppercase font-bold tracking-wider">Discover</span>
        </button>
        
        {/* Saved (Inactive) */}
        <button className="flex flex-col items-center justify-center text-on-surface-variant/40 rounded-full px-4 py-1 cursor-default text-xs font-semibold">
          <span className="material-symbols-outlined mb-0.5">favorite</span>
          <span className="font-label-sm text-[10px] uppercase font-bold tracking-wider">Saved</span>
        </button>
        
        {/* Concierge */}
        <button 
          onClick={() => setMode('concierge')}
          className={`flex flex-col items-center justify-center rounded-full px-5 py-1 text-xs font-semibold scale-90 transition-transform active:scale-100 cursor-pointer ${
            mode === 'concierge' 
              ? 'bg-secondary-container text-on-secondary-container shadow-sm border border-outline-variant/10' 
              : 'text-on-surface-variant/70 hover:bg-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined mb-0.5" style={{ fontVariationSettings: mode === 'concierge' ? '"FILL" 1' : '"FILL" 0' }}>auto_awesome</span>
          <span className="font-label-sm text-[10px] uppercase font-bold tracking-wider">Concierge</span>
        </button>
        
        {/* Profile (Inactive) */}
        <button className="flex flex-col items-center justify-center text-on-surface-variant/40 rounded-full px-4 py-1 cursor-default text-xs font-semibold">
          <span className="material-symbols-outlined mb-0.5">person</span>
          <span className="font-label-sm text-[10px] uppercase font-bold tracking-wider">Profile</span>
        </button>
      </nav>
    </>
  );
}
