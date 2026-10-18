"use client";

/** Ilustrasi roket oranye untuk banner beranda aplikasi. */
export function Rocket() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="rk-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E4E7EC" />
        </linearGradient>
        <linearGradient id="rk-red" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E8512A" />
          <stop offset="1" stopColor="#C73A12" />
        </linearGradient>
        <linearGradient id="rk-flame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFD84D" />
          <stop offset="1" stopColor="#FF7A1A" />
        </linearGradient>
      </defs>
      <g transform="rotate(40 60 60)">
        <path d="M60 104 C50 112 52 120 60 124 C68 120 70 112 60 104Z" fill="url(#rk-flame)" />
        <path d="M44 78 L28 98 L46 92Z" fill="url(#rk-red)" />
        <path d="M76 78 L92 98 L74 92Z" fill="url(#rk-red)" />
        <path d="M60 6 C80 22 84 56 76 96 L44 96 C36 56 40 22 60 6Z" fill="url(#rk-body)" />
        <path d="M60 6 C70 14 76 24 78 34 L42 34 C44 24 50 14 60 6Z" fill="url(#rk-red)" />
        <circle cx="60" cy="58" r="13" fill="#3B82F6" stroke="#E4E7EC" strokeWidth="5" />
        <circle cx="56" cy="54" r="4" fill="#fff" opacity="0.55" />
        <rect x="46" y="92" width="28" height="8" rx="3" fill="url(#rk-red)" />
      </g>
    </svg>
  );
}
