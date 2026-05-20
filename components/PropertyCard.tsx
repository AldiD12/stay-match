'use client';

import { motion } from 'framer-motion';
import type { RankedProperty } from '@/lib/types';

interface Props {
  property: RankedProperty;
  index: number;
}

export default function PropertyCard({ property: rp, index }: Props) {
  const { property, vibeMatchPercent, headline, explanation, quotes } = rp;

  const matchColor =
    vibeMatchPercent >= 85
      ? 'text-green-400'
      : vibeMatchPercent >= 70
        ? 'text-blue-400'
        : 'text-yellow-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.1 }}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
    >
      {/* Photo placeholder */}
      <div className="h-44 bg-zinc-800 relative flex items-center justify-center">
        <span className="text-zinc-600 text-sm">{property.location}</span>
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur rounded-lg px-3 py-1">
          <span className={`font-bold text-lg ${matchColor}`}>{vibeMatchPercent}%</span>
          <span className="text-zinc-400 text-xs ml-1">Vibe Match</span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="text-lg font-semibold text-zinc-100">{property.name}</h3>
          <span className="text-zinc-400 text-sm whitespace-nowrap">
            ${property.basePrice}<span className="text-zinc-600">/night</span>
          </span>
        </div>

        <p className="text-blue-400 text-sm font-medium mb-3">{headline}</p>
        <p className="text-zinc-400 text-sm leading-relaxed mb-4">{explanation}</p>

        {quotes.length > 0 && (
          <div className="space-y-2">
            {quotes.map((q, i) => (
              <blockquote
                key={i}
                className="border-l-2 border-zinc-700 pl-3 text-zinc-500 text-xs italic leading-relaxed"
              >
                &ldquo;{q}&rdquo;
              </blockquote>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-zinc-800 text-xs text-zinc-600">
          <span>Sleeps {property.sleeps}</span>
          <span>·</span>
          <span>{property.location}</span>
        </div>
      </div>
    </motion.div>
  );
}
