'use client';

import { motion } from 'framer-motion';
import type { RankedProperty } from '@/lib/types';

interface Props {
  property: RankedProperty;
  index: number;
}

// Breathtaking editorial luxury estate photography mapped to locations
function getPropertyPhoto(location: string, name: string): string {
  const loc = location.toLowerCase();
  const n = name.toLowerCase();
  if (loc.includes('saranda') || loc.includes('beach') || loc.includes('coast') || n.includes('beach') || n.includes('sea')) {
    return 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80'; // Beachfront luxury
  }
  if (loc.includes('berat') || loc.includes('gjirokastër') || loc.includes('castle') || n.includes('castle') || n.includes('stone') || n.includes('historic')) {
    return 'https://images.unsplash.com/photo-1585543805890-6051f7829f98?auto=format&fit=crop&w=800&q=80'; // Ottoman stone boutique
  }
  if (loc.includes('mountain') || loc.includes('valbona') || loc.includes('theth') || n.includes('cabin') || n.includes('chalet')) {
    return 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80'; // Alpine luxury cabin
  }
  return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'; // Classic luxury villa
}

export default function PropertyCard({ property: rp, index }: Props) {
  const { property, vibeMatchPercent, headline, explanation, quotes } = rp;

  const photoUrl = getPropertyPhoto(property.location, property.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 }}
      className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(26,26,26,0.03)] hover:shadow-[0_12px_32px_rgba(26,26,26,0.06)] hover:-translate-y-1 transition-all duration-300"
    >
      {/* Floating image container */}
      <div className="h-60 relative overflow-hidden m-4 rounded-[2rem] bg-surface-container-low group">
        <img 
          src={photoUrl} 
          alt={property.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
        <div className="absolute top-4 right-4 bg-secondary-container/95 backdrop-blur-md rounded-full px-4 py-1.5 border border-outline-variant/20 flex items-center shadow-sm">
          <span className="font-bold text-headline-md text-on-secondary-container text-base">{vibeMatchPercent}%</span>
          <span className="text-on-secondary-container/90 text-[10px] font-bold ml-1.5 uppercase tracking-wider">Match</span>
        </div>
      </div>

      <div className="p-6 pt-2">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="text-headline-md font-bold text-primary tracking-tight font-headline-md leading-tight">
            {property.name}
          </h3>
          <div className="text-right shrink-0">
            <span className="font-serif text-secondary font-bold text-xl">${property.basePrice}</span>
            <span className="text-on-surface-variant/60 text-xs block uppercase tracking-wider">/night</span>
          </div>
        </div>

        {/* Headline / Vibe Indicator */}
        <div className="flex items-center gap-1.5 mb-4 bg-secondary-container/30 px-3 py-1.5 rounded-full w-fit">
          <span className="material-symbols-outlined text-[16px] text-on-secondary-container">auto_awesome</span>
          <p className="text-on-secondary-container text-xs font-bold uppercase tracking-wider">{headline}</p>
        </div>

        {/* Detailed explanation */}
        <p className="text-on-surface-variant font-body-md leading-relaxed mb-6">
          {explanation}
        </p>

        {/* Quotes block */}
        {quotes.length > 0 && (
          <div className="space-y-3 mb-6 bg-surface-container-low/60 rounded-2xl p-4 border border-outline-variant/20">
            {quotes.map((q, i) => (
              <blockquote
                key={i}
                className="border-l-2 border-secondary/50 pl-3 text-on-surface-variant text-sm italic leading-relaxed"
              >
                &ldquo;{q}&rdquo;
              </blockquote>
            ))}
          </div>
        )}

        {/* Metadata Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-outline-variant/20 text-xs text-on-surface-variant/70 font-semibold uppercase tracking-wider">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">group</span>
            <span>Sleeps {property.sleeps}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">pin_drop</span>
            <span>{property.location}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

