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
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Describe your perfect Albanian stay..."
        disabled={isRunning}
        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-5 py-4 text-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={isRunning || !value.trim()}
        className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-lg transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
      >
        {isRunning ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            Searching...
          </span>
        ) : (
          'Find My Stay'
        )}
      </button>
    </form>
  );
}
