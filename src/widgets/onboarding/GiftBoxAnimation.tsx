import { cn } from '@/lib/cn';

export const GiftBoxAnimation = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        'relative flex h-[220px] w-full items-center justify-center overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-b from-primary-50 to-white/30 backdrop-blur-sm',
        className
      )}
    >
      {/* Background Glow */}
      <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-primary blur-[80px]" />

      {/* Floating Particles */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute animate-pulse rounded-full bg-primary"
          style={{
            width: '10px',
            height: '10px',
            left: '50%',
            top: '50%',
            animationDelay: '0s',
            animationDuration: '2s',
          }}
        />
      </div>

      {/* Gift Box Container */}
      <div className="animate-bounce-slow relative flex flex-col items-center">
        {/* SVG Gift Box for high quality */}
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-2xl"
        >
          {/* Box Body */}
          <rect
            x="20"
            y="45"
            width="80"
            height="65"
            rx="8"
            fill="url(#boxGradient)"
          />

          {/* Vertical Ribbon */}
          <rect
            x="52"
            y="45"
            width="16"
            height="65"
            fill="url(#ribbonGradient)"
          />

          {/* Box Lid */}
          <rect
            x="15"
            y="35"
            width="90"
            height="15"
            rx="4"
            fill="url(#lidGradient)"
          />

          {/* Lid Ribbon Overlay */}
          <rect
            x="52"
            y="35"
            width="16"
            height="15"
            fill="url(#ribbonGradientLight)"
          />

          {/* Bow - Left Loop */}
          <path
            d="M55 35C55 35 25 10 35 15C45 20 55 35 55 35Z"
            fill="url(#ribbonGradient)"
            stroke="white"
            strokeWidth="3"
          />
          {/* Bow - Right Loop */}
          <path
            d="M65 35C65 35 95 10 85 15C75 20 65 35 65 35Z"
            fill="url(#ribbonGradient)"
            stroke="white"
            strokeWidth="3"
          />

          {/* Bow Center Knot */}
          <rect x="52" y="32" width="16" height="8" rx="2" fill="#BAE6FD" />

          {/* Gradients */}
          <defs>
            <linearGradient
              id="boxGradient"
              x1="60"
              y1="45"
              x2="60"
              y2="110"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#22C55E" />
              <stop offset="1" stopColor="#16A34A" />
            </linearGradient>
            <linearGradient
              id="lidGradient"
              x1="60"
              y1="35"
              x2="60"
              y2="50"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#4ADE80" />
              <stop offset="1" stopColor="#22C55E" />
            </linearGradient>
            <linearGradient
              id="ribbonGradient"
              x1="60"
              y1="10"
              x2="60"
              y2="110"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#F0F9FF" />
              <stop offset="0.5" stopColor="#BAE6FD" />
              <stop offset="1" stopColor="#7DD3FC" />
            </linearGradient>
            <linearGradient
              id="ribbonGradientLight"
              x1="60"
              y1="35"
              x2="60"
              y2="50"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#F0F9FF" />
              <stop offset="1" stopColor="#BAE6FD" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Floating Star Icons */}
      <div className="pointer-events-none absolute inset-0 select-none">
        <span
          className="absolute right-1/4 top-1/4 animate-ping text-sm text-primary-400 duration-500"
          style={{ animationDelay: '0.8s' }}
        >
          ✦
        </span>
        <span
          className="absolute bottom-4 right-1/3 animate-ping text-sm text-primary"
          style={{ animationDelay: '1.2s' }}
        >
          ✦
        </span>
        <span
          className="absolute left-1/4 top-1/2 animate-ping text-base text-primary-300 duration-200"
          style={{ animationDelay: '1.5s' }}
        >
          ✦
        </span>
      </div>
    </div>
  );
};
