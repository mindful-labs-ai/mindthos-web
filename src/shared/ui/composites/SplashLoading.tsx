/**
 * 전체 화면 스플래시 로딩 (오버레이 방식)
 *
 * 사용법: <SplashLoading visible={isLoading} />
 * - visible=true  → 스플래시 표시 (최소 MIN_DISPLAY_MS 보장)
 * - visible=false → 최소 시간 경과 후 fade-out → 언마운트
 *
 * 뒤의 실제 컴포넌트는 항상 렌더되며, 스플래시가 fixed 오버레이로 덮고 있다가
 * fade-out하면서 자연스럽게 서비스 화면이 드러납니다.
 */
import { useEffect, useRef, useState } from 'react';

const MIN_DISPLAY_MS = 2000;
const FADEOUT_MS = 700;

interface SplashLoadingProps {
  visible: boolean;
}

const SplashLoading = ({ visible }: SplashLoadingProps) => {
  const [phase, setPhase] = useState<'animate' | 'fadeout' | 'done'>('animate');
  const mountTime = useRef(0);
  useEffect(() => {
    mountTime.current = Date.now();
  }, []);

  // visible이 false로 바뀌면 → 최소 시간 보장 후 fade-out 시작
  useEffect(() => {
    if (visible || phase !== 'animate') return;

    const elapsed = Date.now() - mountTime.current;
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

    const timer = setTimeout(() => setPhase('fadeout'), remaining);
    return () => clearTimeout(timer);
  }, [visible, phase]);

  // fade-out 완료 후 언마운트
  useEffect(() => {
    if (phase !== 'fadeout') return;

    const timer = setTimeout(() => setPhase('done'), FADEOUT_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity ease-out ${
        phase === 'fadeout' ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ transitionDuration: `${FADEOUT_MS}ms` }}
    >
      <svg
        viewBox="0 0 600 400"
        fill="none"
        className="h-20 w-20 md:h-28 md:w-28"
        aria-label="마음토스"
      >
        <path
          d="M 75 345 L 75 130 C 75 35 205 35 205 130 L 205 270 C 205 365 335 365 335 270 L 335 200 C 335 120 445 120 445 200 L 445 250"
          stroke="#44ce4b"
          strokeWidth="62"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength="1"
          style={{ strokeDasharray: 1 }}
          className="animate-logo-draw"
        />
      </svg>
    </div>
  );
};

export { SplashLoading };
