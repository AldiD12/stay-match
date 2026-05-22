'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';

interface Props {
  onSearch: (query: string) => void;
  isRunning: boolean;
}

// Web Speech API types not in TS stdlib
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: Event) => void) | null;
}
declare const webkitSpeechRecognition: new () => SpeechRecognitionInstance;
declare const SpeechRecognition: new () => SpeechRecognitionInstance;

export default function SearchInput({ onSearch, isRunning }: Props) {
  const [value, setValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recogRef = useRef<SpeechRecognitionInstance | null>(null);
  const supportsSpeech = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    return () => { recogRef.current?.stop(); };
  }, []);

  function toggleMic() {
    if (isListening) {
      recogRef.current?.stop();
      setIsListening(false);
      return;
    }

    const Ctor = (typeof SpeechRecognition !== 'undefined' ? SpeechRecognition : webkitSpeechRecognition);
    const recog = new Ctor();
    recog.continuous = false;
    recog.interimResults = true;
    recog.lang = 'en-US';

    recog.onresult = (e: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setInterimText(interim);
      if (final) {
        setValue(v => (v + ' ' + final).trim());
        setInterimText('');
      }
    };

    recog.onend = () => {
      setIsListening(false);
      setInterimText('');
    };

    recog.onerror = () => {
      setIsListening(false);
      setInterimText('');
    };

    recogRef.current = recog;
    recog.start();
    setIsListening(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (q && !isRunning) onSearch(q);
  }

  const displayValue = isListening && interimText ? value + (value ? ' ' : '') + interimText : value;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl relative mx-auto">
      <div className="relative flex items-center w-full h-14 md:h-20 rounded-full bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant/30 shadow-[0_10px_40px_rgba(26,26,26,0.04)] focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-transparent transition-all overflow-hidden pl-4 md:pl-6 pr-2">
        <span
          className="material-symbols-outlined text-on-surface-variant mr-2 md:mr-4 text-[22px] md:text-[28px] shrink-0"
          style={{ fontVariationSettings: '"FILL" 0' }}
        >
          search
        </span>

        <input
          type="text"
          value={displayValue}
          onChange={e => { if (!isListening) setValue(e.target.value); }}
          placeholder="I am a digital nomad, I want to go to Albania, I need fast wifi and quietness..."
          disabled={isRunning}
          className={`w-full h-full bg-transparent border-none focus:ring-0 font-body-lg text-body-lg text-on-surface placeholder:text-on-surface-variant/40 outline-none ${isListening && interimText ? 'text-on-surface-variant/60 italic' : ''}`}
        />

        {/* Mic button — only shown if browser supports it */}
        {supportsSpeech && (
          <button
            type="button"
            onClick={toggleMic}
            disabled={isRunning}
            title={isListening ? 'Stop listening' : 'Speak your query'}
            className={`relative rounded-full p-2 md:p-3 mr-1 shrink-0 transition-all duration-200 flex items-center justify-center ${
              isListening
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            } disabled:opacity-40`}
          >
            {/* Pulse ring when listening */}
            {isListening && (
              <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-40" />
            )}
            <span
              className="material-symbols-outlined text-[18px] md:text-[22px] relative z-10"
              style={{ fontVariationSettings: `"FILL" ${isListening ? 1 : 0}` }}
            >
              {isListening ? 'mic' : 'mic_none'}
            </span>
          </button>
        )}

        <button
          type="submit"
          disabled={isRunning || !value.trim()}
          className="bg-primary text-on-primary rounded-full p-3 md:p-4 hover:bg-on-primary-container transition-all ml-1 flex items-center justify-center h-10 w-10 md:h-16 md:w-16 shrink-0 shadow-lg disabled:opacity-40 disabled:hover:bg-primary active:scale-95"
        >
          {isRunning ? (
            <span className="h-4 w-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-[18px] md:text-[24px]">arrow_forward</span>
          )}
        </button>
      </div>

      {/* Listening status */}
      {isListening && (
        <p className="text-center text-xs text-red-500 font-semibold mt-2 animate-pulse tracking-wide uppercase">
          Listening… speak your query
        </p>
      )}
    </form>
  );
}
