import { cn } from '@/lib/cn';

interface ScrollIndicatorProps {
  isVisible: boolean;
  className?: string;
}

/**
 * 튜토리얼에서 스크롤이 필요할 때 표시되는 인디케이터
 * "아래로 스크롤" 텍스트와 화살표 애니메이션을 포함
 */
export const ScrollIndicator = ({
  isVisible,
  className,
}: ScrollIndicatorProps) => {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'pointer-events-none absolute z-50 flex flex-col items-center justify-start gap-2 py-6',
        className
      )}
    >
      <span className="rounded-xl bg-primary px-4 py-2 text-lg font-bold text-surface">
        아래로 스크롤
      </span>
      <div className="animate-bounce-slow flex flex-col items-center">
        <svg
          width="48"
          height="120"
          viewBox="0 0 48 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id="arrowGradient"
              x1="24"
              y1="0"
              x2="24"
              y2="80"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="rgba(34, 197, 94, 0.1)" />
              <stop offset="1" stopColor="#22c55e" />
            </linearGradient>
          </defs>
          {/* Arrow body */}
          <rect
            x="18"
            y="0"
            width="12"
            height="90"
            fill="url(#arrowGradient)"
          />
          {/* Arrow head */}
          <polygon
            points="24,120 4,85 18,85 18,90 30,90 30,85 44,85"
            fill="#22c55e"
          />
        </svg>
      </div>
    </div>
  );
};

export default ScrollIndicator;
