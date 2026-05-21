'use client';

import { motion } from 'framer-motion';
import type { RankedProperty } from '@/lib/types';

interface Props {
  property: RankedProperty;
  index: number;
  featured?: boolean;
}

function getPropertyPhoto(location: string, name: string): string {
  const loc = location.toLowerCase();
  const n = name.toLowerCase();
  if (loc.includes('saranda') || loc.includes('beach') || n.includes('sea')) {
    return 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80';
  }
  if (loc.includes('berat') || loc.includes('gjirokastër') || n.includes('castle') || n.includes('stone')) {
    return 'https://images.unsplash.com/photo-1585543805890-6051f7829f98?auto=format&fit=crop&w=800&q=80';
  }
  if (loc.includes('valbona') || loc.includes('theth') || n.includes('cabin')) {
    return 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80';
  }
  return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
}

export default function PropertyCard({ property: rp, index, featured = false }: Props) {
  const { property, vibeMatchPercent, headline, explanation, quotes } = rp;
  const photoUrl = property.photoUrl || getPropertyPhoto(property.location, property.name);
  const isBestMatch = index === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 }}
      className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(26,26,26,0.03)] hover:shadow-[0_12px_32px_rgba(26,26,26,0.06)] hover:-translate-y-1 transition-all duration-300"
    >
      {/* Photo */}
      <div className={`relative overflow-hidden m-4 rounded-[2rem] bg-surface-container-low group ${featured ? 'h-80' : 'h-60'}`}>
        <img
          src={photoUrl}
          alt={property.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          onError={(e) => { (e.target as HTMLImageElement).src = getPropertyPhoto(property.location, property.name); }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Match % badge */}
        <div className="absolute top-4 right-4 bg-secondary-container/95 backdrop-blur-md rounded-full px-4 py-1.5 border border-outline-variant/20 flex items-center shadow-sm">
          <span className="font-bold text-on-secondary-container text-base">{vibeMatchPercent}%</span>
          <span className="text-on-secondary-container/80 text-[10px] font-bold ml-1.5 uppercase tracking-wider">Match</span>
        </div>

        {/* Best Match ribbon */}
        {isBestMatch && (
          <div className="absolute top-4 left-4 bg-primary text-on-primary text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-md flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: '"FILL" 1' }}>stars</span>
            Best Match
          </div>
        )}
      </div>

      <div className="p-6 pt-2">
        {/* Name + Price / Category badge */}
        <div className="flex items-start justify-between gap-4 mb-1">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                property.category === 'accommodation' ? 'bg-blue-50 text-blue-600' :
                property.category === 'restaurant' ? 'bg-orange-50 text-orange-600' :
                property.category === 'bar' ? 'bg-purple-50 text-purple-600' :
                property.category === 'cafe' ? 'bg-green-50 text-green-700' :
                'bg-amber-50 text-amber-700'
              }`}>
                {property.category === 'accommodation' ? '🏨 Stay' :
                 property.category === 'restaurant' ? '🍽 Eat' :
                 property.category === 'bar' ? '🍸 Drink' :
                 property.category === 'cafe' ? '☕ Work & Coffee' :
                 '🗺 Experience'}
              </span>
            </div>
            <h3 className="text-headline-md font-bold text-primary tracking-tight leading-tight truncate">{property.name}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {property.totalScore && (
                <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
                  ★ {property.totalScore}
                  <span className="text-on-surface-variant/50 font-normal">({property.reviewsCount?.toLocaleString()})</span>
                </span>
              )}
              {property.hotelStars && (
                <span className="text-[10px] text-on-surface-variant/50 uppercase tracking-wide border border-outline-variant/40 rounded px-1.5 py-0.5 whitespace-nowrap">
                  {property.hotelStars}
                </span>
              )}
            </div>
          </div>
          {property.category === 'accommodation' && property.basePrice > 0 && (
            <div className="text-right shrink-0">
              <span className="font-serif text-secondary font-bold text-xl">${property.basePrice}</span>
              <span className="text-on-surface-variant/60 text-xs block uppercase tracking-wider">/night</span>
            </div>
          )}
        </div>

        {/* AI Headline */}
        <div className="flex items-center gap-1.5 my-3 bg-secondary-container/30 px-3 py-1.5 rounded-full w-fit max-w-full overflow-hidden">
          <span className="material-symbols-outlined text-[15px] text-on-secondary-container shrink-0">auto_awesome</span>
          <p className="text-on-secondary-container text-xs font-bold uppercase tracking-wider truncate">{headline}</p>
        </div>

        {/* AI Explanation */}
        <p className="text-on-surface-variant text-sm leading-relaxed mb-4">{explanation}</p>

        {/* Review quotes */}
        {quotes.length > 0 && (
          <div className="space-y-2.5 mb-4 bg-surface-container-low/60 rounded-2xl p-4 border border-outline-variant/20">
            <div className="flex items-center gap-1.5 mb-2">
              <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-on-surface-variant/50 text-[10px] font-bold uppercase tracking-widest">Verified guest reviews</span>
            </div>
            {quotes.map((q, i) => (
              <blockquote key={i} className="border-l-2 border-secondary/50 pl-3 text-on-surface-variant text-sm italic leading-relaxed">
                &ldquo;{q}&rdquo;
              </blockquote>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-outline-variant/20 space-y-2">
          <div className="flex items-center justify-between text-xs text-on-surface-variant/60 font-semibold">
            <div className="flex items-center gap-1 min-w-0">
              <span className="material-symbols-outlined text-[15px] shrink-0">pin_drop</span>
              <span className="truncate">{property.address ?? property.location}</span>
            </div>
            {property.lat !== 0 && (
              <a
                href={`https://www.google.com/maps?q=${property.lat},${property.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-secondary hover:text-primary transition-colors shrink-0 ml-2"
              >
                <span className="material-symbols-outlined text-[15px]">map</span>
                <span>Maps</span>
              </a>
            )}
          </div>
          {(property.phone || property.website) && (
            <div className="flex items-center gap-3 text-[11px] text-on-surface-variant/50 flex-wrap">
              {property.phone && (
                <a href={`tel:${property.phone}`} className="flex items-center gap-1 hover:text-secondary transition-colors">
                  <span className="material-symbols-outlined text-[13px]">call</span>
                  {property.phone}
                </a>
              )}
              {property.website && (
                <a href={property.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-secondary transition-colors truncate max-w-[160px]">
                  <span className="material-symbols-outlined text-[13px]">language</span>
                  {property.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
