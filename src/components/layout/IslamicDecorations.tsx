import React from 'react';

// 1. Siluet Masjid untuk Bagian Bawah Sidebar
export function SidebarMosqueSilhouette() {
  return (
    <div className="relative w-full h-24 pointer-events-none overflow-hidden select-none mt-auto">
      <svg
        viewBox="0 0 320 110"
        className="absolute bottom-0 inset-x-0 w-full h-full text-emerald-400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <ellipse cx="160" cy="80" rx="100" ry="40" fill="currentColor" fillOpacity="0.05" />
        <path
          d="M 0 100 Q 80 82 160 92 T 320 86 L 320 110 L 0 110 Z"
          fill="#047857"
          fillOpacity="0.4"
        />
        <g stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.4" fill="currentColor" fillOpacity="0.08">
          <path
            d="M 120 90 C 120 62, 138 48, 155 36 C 158 33, 160 30, 160 26 C 160 30, 162 33, 165 36 C 182 48, 200 62, 200 90 Z"
          />
          <line x1="160" y1="26" x2="160" y2="16" strokeWidth="1.5" />
          <path
            d="M 157 14 A 4.5 4.5 0 1 1 163 14 A 3.2 3.2 0 1 0 157 14"
            fill="currentColor"
            fillOpacity="0.8"
          />
          <path d="M 148 90 C 148 78, 160 72, 160 72 C 160 72, 172 78, 172 90" strokeOpacity="0.3" fill="none" />
          <path
            d="M 215 95 L 217 32 L 213 32 L 219 16 L 225 32 L 221 32 L 223 95 Z"
          />
          <line x1="219" y1="16" x2="219" y2="10" strokeWidth="1.5" />
          <path
            d="M 217 9 A 3.5 3.5 0 1 1 221 9 A 2.5 2.5 0 1 0 217 9"
            fill="currentColor"
            fillOpacity="0.8"
          />
          <line x1="214" y1="46" x2="224" y2="46" strokeWidth="1.8" strokeOpacity="0.5" />
          <line x1="215" y1="68" x2="223" y2="68" strokeWidth="1.8" strokeOpacity="0.5" />
          <path
            d="M 85 95 C 85 78, 98 68, 110 60 C 112 58, 114 60, 115 62 C 122 70, 125 80, 125 95 Z"
            fillOpacity="0.05"
          />
          <line x1="110" y1="60" x2="110" y2="52" strokeWidth="1.2" />
          <circle cx="110" cy="50" r="1.5" fill="currentColor" />
        </g>
        <path
          d="M 0 96 Q 90 76 180 90 T 320 84 L 320 110 L 0 110 Z"
          fill="#065f46"
          fillOpacity="0.6"
        />
        <path
          d="M 0 104 Q 100 88 200 100 T 320 94 L 320 110 L 0 110 Z"
          fill="#064e3b"
          fillOpacity="0.9"
        />
        <path
          d="M 0 96 Q 90 76 180 90 T 320 84"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeOpacity="0.25"
          fill="none"
        />
      </svg>
    </div>
  );
}

// 2. Ornamen Geometri Islami Tipis untuk Header
export function HeaderIslamicPattern() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.06] text-emerald-800 select-none">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="islamicLatticePattern" width="44" height="44" patternUnits="userSpaceOnUse">
            <g stroke="currentColor" strokeWidth="0.8" fill="none">
              <rect x="12" y="12" width="20" height="20" />
              <rect x="12" y="12" width="20" height="20" transform="rotate(45 22 22)" />
              <line x1="0" y1="22" x2="12" y2="22" />
              <line x1="32" y1="22" x2="44" y2="22" />
              <line x1="22" y1="0" x2="22" y2="12" />
              <line x1="22" y1="32" x2="22" y2="44" />
              <circle cx="22" cy="22" r="2.5" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#islamicLatticePattern)" />
      </svg>
    </div>
  );
}

// 3. Ornamen Lengkungan Mihrab Islami untuk Sudut Dashboard
export function MihrabArchMotif() {
  return (
    <div className="absolute top-0 right-0 pointer-events-none select-none opacity-[0.06] text-emerald-800 overflow-hidden w-64 h-64 z-0">
      <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" stroke="currentColor">
        <path
          d="M 200 0 L 110 0 C 110 45, 135 85, 170 105 C 190 115, 200 130, 200 155 Z"
          strokeWidth="1.5"
          fill="currentColor"
          fillOpacity="0.03"
        />
        <path
          d="M 200 20 C 165 20, 130 50, 130 95 C 130 125, 155 150, 200 165"
          strokeWidth="1.2"
          strokeDasharray="4 2"
        />
        <path
          d="M 200 40 C 175 40, 150 65, 150 100 C 150 125, 175 145, 200 150"
          strokeWidth="1"
        />
        <line x1="200" y1="0" x2="140" y2="60" strokeWidth="0.8" />
        <line x1="200" y1="0" x2="160" y2="100" strokeWidth="0.8" />
        <line x1="200" y1="0" x2="185" y2="140" strokeWidth="0.8" />
        <circle cx="200" cy="0" r="35" strokeWidth="1" />
        <circle cx="200" cy="0" r="65" strokeWidth="0.8" strokeDasharray="3 3" />
        <circle cx="200" cy="0" r="100" strokeWidth="1.2" />
      </svg>
    </div>
  );
}

// 4. Ornamen Mushaf Al-Qur'an Transparan untuk Bagian Bawah Konten
export function MushafWatermark() {
  return (
    <div className="flex items-center justify-center py-6 pointer-events-none select-none opacity-[0.05] text-emerald-900 mt-6">
      <svg viewBox="0 0 120 75" className="w-20 h-12" fill="none" stroke="currentColor">
        <line x1="30" y1="65" x2="90" y2="35" strokeWidth="2" strokeLinecap="round" />
        <line x1="90" y1="65" x2="30" y2="35" strokeWidth="2" strokeLinecap="round" />
        <line x1="38" y1="65" x2="82" y2="65" strokeWidth="1.5" />
        <path
          d="M 60 38 Q 45 42 22 36 Q 20 54 36 56 Q 50 54 60 40"
          strokeWidth="1.5"
          fill="currentColor"
          fillOpacity="0.05"
        />
        <path
          d="M 60 38 Q 75 42 98 36 Q 100 54 84 56 Q 70 54 60 40"
          strokeWidth="1.5"
          fill="currentColor"
          fillOpacity="0.05"
        />
        <line x1="28" y1="42" x2="52" y2="44" strokeWidth="0.8" />
        <line x1="29" y1="46" x2="53" y2="48" strokeWidth="0.8" />
        <line x1="31" y1="50" x2="53" y2="52" strokeWidth="0.8" />
        <line x1="68" y1="44" x2="92" y2="42" strokeWidth="0.8" />
        <line x1="67" y1="48" x2="91" y2="46" strokeWidth="0.8" />
        <line x1="67" y1="52" x2="89" y2="50" strokeWidth="0.8" />
        <path d="M 60 38 L 60 52" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// 5. Ornamen Motif Batik Kawung Nusantara & Geometri Islami
export function BatikKawungPattern({
  opacity = 0.08,
  className = ''
}: {
  opacity?: number;
  className?: string;
}) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none text-amber-300 ${className}`}
      style={{ opacity }}
    >
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="batikKawungIslamicPattern" width="60" height="60" patternUnits="userSpaceOnUse">
            {/* Kawung Petals (4 Oval Mengelilingi Titik Pusat) */}
            <g stroke="currentColor" strokeWidth="1" fill="none">
              <ellipse cx="30" cy="15" rx="10" ry="14" />
              <ellipse cx="30" cy="45" rx="10" ry="14" />
              <ellipse cx="15" cy="30" rx="14" ry="10" />
              <ellipse cx="45" cy="30" rx="14" ry="10" />
              <circle cx="30" cy="30" r="3" fill="currentColor" fillOpacity="0.4" />
              <circle cx="0" cy="0" r="4" fill="currentColor" fillOpacity="0.3" />
              <circle cx="60" cy="0" r="4" fill="currentColor" fillOpacity="0.3" />
              <circle cx="0" cy="60" r="4" fill="currentColor" fillOpacity="0.3" />
              <circle cx="60" cy="60" r="4" fill="currentColor" fillOpacity="0.3" />
              {/* Bintang Geometri Islami 8 Sudut Tipis di Sudut Grid */}
              <rect x="-4" y="-4" width="8" height="8" strokeWidth="0.6" />
              <rect x="-4" y="-4" width="8" height="8" strokeWidth="0.6" transform="rotate(45 0 0)" />
              <rect x="56" y="-4" width="8" height="8" strokeWidth="0.6" />
              <rect x="56" y="-4" width="8" height="8" strokeWidth="0.6" transform="rotate(45 60 0)" />
              <rect x="-4" y="56" width="8" height="8" strokeWidth="0.6" />
              <rect x="-4" y="56" width="8" height="8" strokeWidth="0.6" transform="rotate(45 0 60)" />
              <rect x="56" y="56" width="8" height="8" strokeWidth="0.6" />
              <rect x="56" y="56" width="8" height="8" strokeWidth="0.6" transform="rotate(45 60 60)" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#batikKawungIslamicPattern)" />
      </svg>
    </div>
  );
}

// 6. Pita Ornamen Pembatas Batik Emas
export function BatikGoldBorder() {
  return (
    <div className="w-full h-2 bg-gradient-to-r from-emerald-700 via-amber-400 to-emerald-700 flex items-center justify-center overflow-hidden shadow-xs">
      <div className="flex gap-2 text-emerald-900/60 font-mono text-[8px] select-none tracking-widest font-black">
        ✦ ❖ ✦ ❖ ✦ ❖ ✦ ❖ ✦ ❖ ✦ ❖ ✦
      </div>
    </div>
  );
}
