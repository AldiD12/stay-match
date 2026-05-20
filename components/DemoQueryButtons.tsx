'use client';

interface Props {
  onSelect: (query: string) => void;
  isRunning: boolean;
}

const DEMOS = [
  {
    label: 'Digital Nomad',
    icon: '💻',
    query: 'I need blazing fast wifi, a proper desk, and a buzzing neighbourhood where I can work remotely for a month. I want to feel like I actually live there, not just passing through.',
  },
  {
    label: 'Family in Saranda',
    icon: '🏖️',
    query: 'Family of 5 heading to Saranda for two weeks. We need a private pool, separate bedrooms for the kids, and a safe garden. Budget around €100 a night.',
  },
  {
    label: 'Ottoman Aristocrat',
    icon: '🏰',
    query: 'I want to feel like an 18th-century Ottoman aristocrat — vaulted ceilings, ancient stonework, mountain views — but without spending a fortune. Atmosphere over amenities.',
  },
];

export default function DemoQueryButtons({ onSelect, isRunning }: Props) {
  return (
    <div className="flex gap-3 flex-wrap">
      {DEMOS.map(d => (
        <button
          key={d.label}
          onClick={() => onSelect(d.query)}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-blue-500 text-sm text-zinc-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>{d.icon}</span>
          <span>{d.label}</span>
        </button>
      ))}
    </div>
  );
}
