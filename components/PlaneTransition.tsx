'use client';

import { useEffect, useState } from 'react';

export default function PlaneTransition() {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Prevent body scroll during animation
    document.body.style.overflow = 'hidden';
    
    // Start animation after a tiny delay to ensure smooth render
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    });

    // Remove the transition after animation completes
    const timer = setTimeout(() => {
      setIsVisible(false);
      document.body.style.overflow = '';
    }, 2800);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`plane-transition-wrapper ${isAnimating ? 'animating' : ''}`}>
      <div className={`plane-container ${isAnimating ? 'animating' : ''}`}>
        {/* DETAILED REALISTIC BOEING 777 SVG */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%" className="plane-svg">
          <defs>
            {/* 3D Metallic Gradients for wings and body */}
            <linearGradient id="fuselage" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#b0bec5" />
              <stop offset="25%" stopColor="#ffffff" />
              <stop offset="75%" stopColor="#eceff1" />
              <stop offset="100%" stopColor="#90a4ae" />
            </linearGradient>
            <linearGradient id="wing-left" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#90a4ae" />
              <stop offset="50%" stopColor="#eceff1" />
              <stop offset="100%" stopColor="#78909c" />
            </linearGradient>
            <linearGradient id="wing-right" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#90a4ae" />
              <stop offset="50%" stopColor="#eceff1" />
              <stop offset="100%" stopColor="#78909c" />
            </linearGradient>
            <linearGradient id="engine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#37474f" />
              <stop offset="50%" stopColor="#90a4ae" />
              <stop offset="100%" stopColor="#263238" />
            </linearGradient>
            {/* Soft shadow under the plane for depth */}
            <filter id="plane-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="18" stdDeviation="15" floodColor="#1a1a1a" floodOpacity="0.25" />
            </filter>
          </defs>
          <g filter="url(#plane-shadow)">
            {/* Main Swept Wings */}
            {/* Left Wing */}
            <path d="M 285 220 L 70 380 L 60 395 L 85 390 L 285 270 Z" fill="url(#wing-left)" stroke="#546e7a" strokeWidth="0.5" />
            {/* Right Wing */}
            <path d="M 315 220 L 530 380 L 540 395 L 515 390 L 315 270 Z" fill="url(#wing-right)" stroke="#546e7a" strokeWidth="0.5" />
            {/* Flap Panels & Trim lines */}
            <path d="M 120 345 L 75 380 L 80 388 L 125 352 Z" fill="#546e7a" opacity="0.4"/>
            <path d="M 210 295 L 140 338 L 145 345 L 215 302 Z" fill="#546e7a" opacity="0.4"/>
            <path d="M 480 345 L 525 380 L 520 388 L 475 352 Z" fill="#546e7a" opacity="0.4"/>
            <path d="M 390 295 L 460 338 L 455 345 L 385 302 Z" fill="#546e7a" opacity="0.4"/>
            {/* Left Engine */}
            <rect x="175" y="270" width="28" height="65" rx="14" fill="url(#engine)" stroke="#263238" strokeWidth="0.5" />
            <ellipse cx="189" cy="270" rx="14" ry="6" fill="#1a1a1a" />
            <path d="M 183 335 L 189 350 L 195 335 Z" fill="#37474f" />
            <path d="M 189 280 L 189 310" stroke="#455a64" strokeWidth="3" />
            {/* Right Engine */}
            <rect x="397" y="270" width="28" height="65" rx="14" fill="url(#engine)" stroke="#263238" strokeWidth="0.5" />
            <ellipse cx="411" cy="270" rx="14" ry="6" fill="#1a1a1a" />
            <path d="M 405 335 L 411 350 L 417 335 Z" fill="#37474f" />
            <path d="M 411 280 L 411 310" stroke="#455a64" strokeWidth="3" />
            {/* Rear Tail Horizontal Stabilizers */}
            <path d="M 290 510 L 190 550 L 195 560 L 290 535 Z" fill="url(#wing-left)" stroke="#546e7a" strokeWidth="0.5" />
            <path d="M 310 510 L 410 550 L 405 560 L 310 535 Z" fill="url(#wing-right)" stroke="#546e7a" strokeWidth="0.5" />
            {/* Main Fuselage (Body) */}
            <path d="M 300 60 C 275 90, 280 140, 280 200 L 280 500 C 280 525, 290 550, 300 570 C 310 550, 320 525, 320 500 L 320 200 C 320 140, 325 90, 300 60 Z" fill="url(#fuselage)" stroke="#546e7a" strokeWidth="0.5" />
            {/* Detailed Cockpit Windows */}
            <path d="M 292 105 C 295 100, 305 100, 308 105 C 312 110, 288 110, 292 105 Z" fill="#1a1a1a" />
            <path d="M 292 106 L 296 103 L 299 104 L 298 107 Z" fill="#37474f" />
            <path d="M 308 106 L 304 103 L 301 104 L 302 107 Z" fill="#37474f" />
            {/* Navigation Lights on Wingtips (Red/Green) */}
            <circle cx="63" cy="387" r="4" fill="#ff1744" />
            <circle cx="537" cy="387" r="4" fill="#00e676" />
            {/* Vertical Tail Fin (Shadow overlay) */}
            <path d="M 300 480 L 297 565 L 300 568 L 303 565 Z" fill="#455a64" opacity="0.6" />
          </g>
        </svg>
      </div>
    </div>
  );
}
