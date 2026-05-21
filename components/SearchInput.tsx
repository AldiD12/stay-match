'use client';

import { useState, type FormEvent } from 'react';

interface Props {
  onSearch: (query: string) => void;
  isRunning: boolean;
}

export default function SearchInput({ onSearch, isRunning }: Props) {
  const [value, setValue] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (value.trim() && !isRunning) onSearch(value.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl relative mx-auto">
      <div className="relative flex items-center w-full h-20 rounded-full bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant/30 shadow-[0_10px_40px_rgba(26,26,26,0.04)] focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-transparent transition-all overflow-hidden pl-6 pr-2">
        <span 
          className="material-symbols-outlined text-on-surface-variant mr-4 text-[28px]" 
          style={{ fontVariationSettings: '"FILL" 0' }}
        >
          search
        </span>
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="I am a digital nomad, I want to go to Albania, I need fast wifi and quietness..."
          disabled={isRunning}
          className="w-full h-full bg-transparent border-none focus:ring-0 font-body-lg text-body-lg text-on-surface placeholder:text-on-surface-variant/40 outline-none"
        />
        <button
          type="submit"
          disabled={isRunning || !value.trim()}
          className="bg-primary text-on-primary rounded-full p-4 hover:bg-on-primary-container transition-all ml-2 flex items-center justify-center h-16 w-16 shrink-0 shadow-lg disabled:opacity-40 disabled:hover:bg-primary transition-transform duration-200 active:scale-95"
        >
          {isRunning ? (
            <span className="h-5 w-5 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-[24px]">arrow_forward</span>
          )}
        </button>
      </div>
    </form>
  );
}

