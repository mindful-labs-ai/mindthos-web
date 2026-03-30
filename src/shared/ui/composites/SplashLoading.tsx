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
  const [phase, setPhase] = useState<'animate' | 'fadeout' | 'done'>(
    'animate'
  );
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
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-white transition-opacity ease-out ${
        phase === 'fadeout' ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ transitionDuration: `${FADEOUT_MS}ms` }}
    >
      {/* 원형 확산 배경 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-0 w-0 animate-splash-circle rounded-full bg-green-80" />
      </div>

      {/* 로고 드롭 */}
      <img
        src="/loading_logo.png"
        alt="마음토스"
        className="relative z-10 animate-logo-drop object-contain opacity-0"
      />
    </div>
  );
};

export { SplashLoading };
