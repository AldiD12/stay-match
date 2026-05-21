'use client';

interface Props {
  onSelect: (query: string) => void;
  isRunning: boolean;
}

const DEMOS = [
  {
    label: 'Digital Nomad',
    icon: 'laptop_mac',
    query: 'I need blazing fast wifi, a proper desk, and a buzzing neighbourhood where I can work remotely for a month. I want to feel like I actually live there, not just passing through.',
  },
  {
    label: 'Family beach villa',
    icon: 'pool',
    query: 'Family of 5 heading to Saranda for two weeks. We need a private pool, separate bedrooms for the kids, and a safe garden. Budget around €100 a night.',
  },
  {
    label: 'Ottoman Castle',
    icon: 'castle',
    query: 'I want to feel like an 18th-century Ottoman aristocrat — vaulted ceilings, ancient stonework, mountain views — but without spending a fortune. Atmosphere over amenities.',
  },
];

export default function DemoQueryButtons({ onSelect, isRunning }: Props) {
  return (
    <div className="flex gap-4 flex-wrap justify-center w-full max-w-3xl mx-auto mt-4">
      {DEMOS.map(d => (
        <button
          key={d.label}
          onClick={() => onSelect(d.query)}
          disabled={isRunning}
          className="font-label-sm text-label-sm bg-surface-container-lowest/80 backdrop-blur-sm border border-outline-variant/30 px-5 py-2.5 rounded-full hover:bg-surface-container-lowest transition-all shadow-sm flex items-center text-on-surface-variant scale-95 hover:scale-100 duration-200 disabled:opacity-40 disabled:pointer-events-none uppercase tracking-wider"
        >
          <span className="material-symbols-outlined text-[18px] mr-2 text-secondary">{d.icon}</span>
          <span>{d.label}</span>
        </button>
      ))}
    </div>
  );
}

