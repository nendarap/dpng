import React from 'react';

interface UnpadLogoProps {
  variant?: 'dark' | 'light' | 'color' | 'monochrome';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
  subtitleText?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}

export const UnpadLogo: React.FC<UnpadLogoProps> = ({
  variant = 'color',
  size = 'md',
  className = '',
  showSubtitle = false,
  subtitleText = 'Universitas Padjadjaran',
  titleClassName = '',
  subtitleClassName = '',
}) => {
  // Determine size classes
  const sizeMap = {
    xs: 'h-6',
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
    xl: 'h-16',
  };

  const heightClass = sizeMap[size] || sizeMap.md;

  // Color configurations:
  // variant 'color' / 'dark': letters black/navy, flame golden amber
  // variant 'light': letters white, flame golden amber
  // variant 'monochrome': all currentColor
  const isLight = variant === 'light';
  const textFill = isLight ? '#FFFFFF' : variant === 'dark' ? '#0F172A' : '#111827';
  const flameGradientId = `unpad-flame-${variant}`;

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className={`relative ${heightClass} flex items-center shrink-0`}>
        <svg
          viewBox="0 0 500 135"
          className={`${heightClass} w-auto max-w-full drop-shadow-xs`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={flameGradientId} x1="0%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#EA580C" />
              <stop offset="35%" stopColor="#F59E0B" />
              <stop offset="75%" stopColor="#FDB913" />
              <stop offset="100%" stopColor="#FDE047" />
            </linearGradient>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#F59E0B" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Letter U */}
          <path
            d="M 22 18 L 47 18 L 47 68 C 47 80 54 86 65 86 C 76 86 83 80 83 68 L 83 18 L 108 18 L 108 69 C 108 93 92 105 65 105 C 38 105 22 93 22 69 Z"
            fill={textFill}
          />

          {/* Letter n */}
          <path
            d="M 128 35 L 152 35 L 152 47 C 158 38 168 33 182 33 C 201 33 213 44 213 63 L 213 104 L 189 104 L 189 67 C 189 56 183 51 173 51 C 162 51 152 57 152 69 L 152 104 L 128 104 Z"
            fill={textFill}
          />

          {/* Letter p (Stem and Bowl) */}
          <path
            d="M 233 35 L 257 35 L 257 46 C 263 38 274 33 288 33 C 310 33 326 49 326 69 C 326 90 310 105 288 105 C 274 105 263 100 257 92 L 257 132 L 233 132 Z M 279 52 C 267 52 257 60 257 69 C 257 80 267 87 279 87 C 292 87 302 79 302 69 C 302 59 292 52 279 52 Z"
            fill={textFill}
          />

          {/* Letter a */}
          <path
            d="M 342 69 C 342 49 359 33 380 33 C 393 33 403 38 408 47 L 408 35 L 431 35 L 431 104 L 409 104 L 409 92 C 403 100 393 105 380 105 C 359 105 342 89 342 69 Z M 387 52 C 374 52 366 60 366 69 C 366 80 374 87 387 87 C 399 87 409 79 409 69 C 409 59 399 52 387 52 Z"
            fill={textFill}
          />

          {/* Letter d */}
          <path
            d="M 449 69 C 449 49 465 33 486 33 C 499 33 509 38 514 47 L 514 14 L 538 14 L 538 104 L 515 104 L 515 92 C 509 100 499 105 486 105 C 465 105 449 89 449 69 Z M 493 52 C 481 52 473 60 473 69 C 473 80 481 87 493 87 C 505 87 515 79 515 69 C 515 59 505 52 493 52 Z"
            transform="translate(-22, 0)"
            fill={textFill}
          />

          {/* The Distinctive Unpad Golden Flame/Petal (Lidah Api) above letter 'p' */}
          <path
            d="M 257 36 C 246 23 236 12 243 2 C 247 -2 253 0 257 5 C 266 16 283 26 298 31 C 286 31 267 32 257 36 Z"
            fill={`url(#${flameGradientId})`}
            filter="url(#softGlow)"
          />
          <path
            d="M 245 4 C 255 17 272 28 288 32 C 274 31 261 25 252 14 C 249 9 247 6 245 4 Z"
            fill="#FDB913"
          />
        </svg>
      </div>

      {showSubtitle && (
        <div className="flex flex-col leading-tight">
          <span className={`font-bold text-xs sm:text-sm tracking-tight ${isLight ? 'text-white' : 'text-[#002B66]'} ${titleClassName}`}>
            {subtitleText}
          </span>
          <span className={`text-[10px] tracking-wide uppercase font-semibold ${isLight ? 'text-amber-300' : 'text-slate-500'} ${subtitleClassName}`}>
            Direktorat Pendidikan Non Gelar
          </span>
        </div>
      )}
    </div>
  );
};
