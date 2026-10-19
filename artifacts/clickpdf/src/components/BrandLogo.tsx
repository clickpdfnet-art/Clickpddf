import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
}

/**
 * Official ClickPDF Brand Logo
 * Features: High-prestige black-and-gold shield, deep jet onyx background,
 * 3D red rounded PDF document with folded corner, bold white 'PDF',
 * and vibrant electric yellow lightning bolt.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = 'h-8 w-8 sm:h-9 sm:w-9 aspect-square shrink-0',
  size
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        {/* Jet Onyx Black Background Gradient */}
        <radialGradient id="shieldOnyxGrad" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#222226" />
          <stop offset="45%" stopColor="#121216" />
          <stop offset="100%" stopColor="#050508" />
        </radialGradient>

        {/* Premium Metallic Gold Gradient for Outer Shield */}
        <linearGradient id="goldMetallicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF3A8" />
          <stop offset="25%" stopColor="#FACC15" />
          <stop offset="50%" stopColor="#D97706" />
          <stop offset="75%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#854D0E" />
        </linearGradient>

        {/* Inner Gold Crest Outline */}
        <linearGradient id="goldInnerGrad" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#A16207" />
        </linearGradient>

        {/* Warm Golden Shield Glow Filter */}
        <filter id="goldShieldGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#EAB308" floodOpacity="0.75" />
          <feDropShadow dx="0" dy="0" stdDeviation="22" floodColor="#CA8A04" floodOpacity="0.4" />
        </filter>

        {/* Yellow Lightning Electric Glow Filter */}
        <filter id="yellowBoltGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#FACC15" floodOpacity="0.95" />
          <feDropShadow dx="0" dy="0" stdDeviation="18" floodColor="#EAB308" floodOpacity="0.75" />
        </filter>

        {/* Red Document Gradient */}
        <linearGradient id="redDocGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="45%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>

        {/* Red Document Folded Corner Gradient */}
        <linearGradient id="redFoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="50%" stopColor="#f87171" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>

        {/* Document 3D Drop Shadow */}
        <filter id="docShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="16" stdDeviation="16" floodColor="#000000" floodOpacity="0.75" />
        </filter>

        {/* 3D Text Shadow */}
        <filter id="text3DShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="3" floodColor="#7f1d1d" floodOpacity="0.8" />
          <feDropShadow dx="0" dy="10" stdDeviation="6" floodColor="#450a0a" floodOpacity="0.6" />
        </filter>

        {/* Yellow Lightning Gradient */}
        <linearGradient id="yellowBoltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="40%" stopColor="#FACC15" />
          <stop offset="80%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>
      </defs>

      {/* 1. Black Shield Base with Shadow */}
      <path
        d="M 256 36 C 324 40 404 68 444 92 C 452 184 436 308 380 392 C 340 448 284 488 256 500 C 228 488 172 448 132 392 C 76 308 60 184 68 92 C 108 68 188 40 256 36 Z"
        fill="url(#shieldOnyxGrad)"
      />

      {/* Subtle Gold Texture / Geometric Accent Lines inside shield */}
      <g opacity="0.12" stroke="#FACC15" strokeWidth="1.5">
        <line x1="120" y1="120" x2="392" y2="120" />
        <line x1="90" y1="220" x2="422" y2="220" />
        <line x1="100" y1="320" x2="412" y2="320" />
        <line x1="180" y1="60" x2="180" y2="440" />
        <line x1="256" y1="40" x2="256" y2="490" />
        <line x1="332" y1="60" x2="332" y2="440" />
      </g>

      {/* 2. Outer Bold Metallic Gold Shield Border */}
      <path
        d="M 256 42 C 320 46 396 72 434 96 C 442 182 426 300 374 380 C 334 434 282 472 256 486 C 230 472 178 434 138 380 C 86 300 70 182 78 96 C 116 72 192 46 256 42 Z"
        stroke="url(#goldMetallicGrad)"
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#goldShieldGlow)"
      />

      {/* 3. Secondary Inner Fine Gold Shield Contour */}
      <path
        d="M 256 62 C 314 66 382 88 416 110 C 424 184 410 288 362 362 C 326 412 280 446 256 460 C 232 446 186 412 150 362 C 102 288 88 184 96 110 C 130 88 198 66 256 62 Z"
        stroke="url(#goldInnerGrad)"
        strokeWidth="4"
        strokeOpacity="0.85"
        strokeLinecap="round"
      />

      {/* 4. Red 3D Rounded PDF Document Icon with Folded Corner */}
      <g filter="url(#docShadow)">
        {/* Main Document Body */}
        <path
          d="M 168 114 H 316 L 380 178 V 358 C 380 378 364 394 344 394 H 168 C 148 394 132 378 132 358 V 150 C 132 130 148 114 168 114 Z"
          fill="url(#redDocGrad)"
        />

        {/* Subtle 3D Top Highlight Border */}
        <path
          d="M 172 117 H 314"
          stroke="#fca5a5"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* Folded Corner Dark Shadow Area */}
        <path
          d="M 314 114 V 178 H 380 Z"
          fill="#7f1d1d"
          opacity="0.4"
        />

        {/* 3D Folded Page Corner Flap */}
        <path
          d="M 316 114 C 316 142 318 174 348 176 C 362 177 380 178 380 178 Z"
          fill="url(#redFoldGrad)"
          filter="url(#docShadow)"
        />

        {/* Bold 3D White 'PDF' Text on Red Document */}
        <text
          x="256"
          y="298"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="112"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="1px"
          filter="url(#text3DShadow)"
        >
          PDF
        </text>
      </g>

      {/* 5. Electric Yellow Lightning Bolt Striking Through */}
      <g filter="url(#yellowBoltGlow)">
        {/* Outer Radiant Yellow Energy Bolt */}
        <polygon
          points="310,24 238,198 296,204 186,494 284,242 228,236"
          fill="url(#yellowBoltGrad)"
        />
        {/* Intense Pure White-Warm Center Core */}
        <polygon
          points="308,34 244,196 290,202 198,474 278,244 234,238"
          fill="#FFFFF0"
        />
      </g>
    </svg>
  );
};
