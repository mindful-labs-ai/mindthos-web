import { cn } from '@/lib/cn';

interface ReviewLoadingAnimationProps {
  className?: string;
}

/**
 * 결과지 검토 로딩 일러스트.
 * 선 차트가 반복적으로 그려지고(stroke-dashoffset, pathLength 정규화), 그 위를 돋보기가
 * 천천히 자유롭게 떠도는 SVG 애니메이션. 돋보기 이동은 SMIL animateMotion(폐곡선),
 * 라인 드로잉/글린트는 CSS 키프레임.
 */
export const ReviewLoadingAnimation = ({
  className,
}: ReviewLoadingAnimationProps) => {
  return (
    <svg
      viewBox="0 0 144 128"
      className={cn('h-32 w-36', className)}
      role="img"
      aria-label="결과지를 검토하는 중"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>{`
        @keyframes rla-draw {
          0%   { stroke-dashoffset: 100; opacity: 1; }
          55%  { stroke-dashoffset: 0;   opacity: 1; }
          85%  { stroke-dashoffset: 0;   opacity: 1; }
          100% { stroke-dashoffset: 0;   opacity: 0; }
        }
        @keyframes rla-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2.5px); }
        }
        @keyframes rla-glint {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.7; }
        }
        .rla-line {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: rla-draw 2.8s ease-in-out infinite;
        }
        .rla-bob { animation: rla-bob 2.4s ease-in-out infinite; }
        .rla-glint { animation: rla-glint 2.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .rla-line { animation: none; stroke-dashoffset: 0; opacity: 1; }
          .rla-bob, .rla-glint, .rla-motion { animation: none; }
        }
      `}</style>

      {/* 배경 카드 */}
      <rect x="0" y="0" width="144" height="128" rx="24" fill="#E8F5EC" />

      {/* 기준선 + 보조 그리드 */}
      <line x1="18" y1="104" x2="126" y2="104" stroke="#CFE5D0" strokeWidth="2" strokeLinecap="round" />
      <line x1="18" y1="80" x2="126" y2="80" stroke="#CFE5D0" strokeWidth="1.5" strokeDasharray="3 5" strokeLinecap="round" opacity="0.7" />

      {/* 돋보기 이동 경로 — 차트 영역을 자유롭게 떠도는 폐곡선 (비표시, seamless loop) */}
      <path
        id="rla-motion-path"
        d="M40 58 C 28 40, 58 28, 80 38 C 104 48, 118 40, 112 62 C 108 84, 74 90, 56 80 C 40 72, 46 92, 40 58 Z"
      />

      {/* 선 차트 — pathLength=100 정규화로 dash 길이 보장, 반복 드로잉 */}
      <path
        className="rla-line"
        pathLength={100}
        d="M22 94 L48 62 L72 76 L98 44 L122 58"
        stroke="#44CE4B"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 돋보기 — 차트 영역을 천천히 자유롭게 떠돌며 위아래로 흔들림 */}
      <g>
        <animateMotion
          className="rla-motion"
          dur="14s"
          repeatCount="indefinite"
          rotate="0"
        >
          <mpath href="#rla-motion-path" />
        </animateMotion>
        <g className="rla-bob">
          {/* 손잡이 */}
          <line x1="8" y1="8" x2="15" y2="15" stroke="#1A1A1A" strokeWidth="3.5" strokeLinecap="round" />
          {/* 렌즈 */}
          <circle cx="0" cy="0" r="11" fill="#FFFFFF" fillOpacity="0.55" stroke="#1A1A1A" strokeWidth="3" />
          {/* 글린트 */}
          <path className="rla-glint" d="M-4 -6 A8 8 0 0 1 6 -4" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </g>
      </g>
    </svg>
  );
};
