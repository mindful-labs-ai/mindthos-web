// TODO: 삭제 예정 - 어디에서도 import되지 않음, 컨페티 효과 미사용
import React, { useEffect, useState } from 'react';

import ConfettiLib from 'react-confetti';

interface ConfettiProps {
  /** 활성화 여부 */
  active?: boolean;
  /** 컨페티 개수 (기본값: 200) */
  numberOfPieces?: number;
  /** 중력 (기본값: 0.1) */
  gravity?: number;
  /** 마찰력 (기본값: 0.99) */
  friction?: number;
  /** 초기 속도 기울기 (기본값: 10) */
  initialVelocityY?: number;
  /** 초기 속도 편차 (기본값: 10) */
  initialVelocityX?: number;
  /** 지속 시간 (ms, 기본값: 5000) */
  duration?: number;
  /** 색상 배열 */
  colors?: string[];
  /** 종료 시 콜백 */
  onComplete?: () => void;
  /** 불투명도 (0~1) */
  opacity?: number;
  /** 윈도우 크기 자동 감지 여부 (기본값: true) */
  recycle?: boolean;
}

/**
 * 프로젝트 내에서 축하 효과를 위해 사용하는 커스텀 컨페티 컴포넌트
 */
export const Confetti: React.FC<ConfettiProps> = ({
  active = false,
  numberOfPieces = 200,
  gravity = 0.5,
  friction = 0.99,
  initialVelocityY = 10,
  initialVelocityX = 10,
  duration = 5000,
  colors = ['#44CE4B', '#FFD700', '#FF4D4D', '#4D96FF', '#FF8C00', '#9B51E0'],
  opacity = 1,
  recycle = false,
  onComplete,
}) => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // active가 true일 때만 타이머를 시작하고, 시간이 다 되면 부모의 onComplete를 호출합니다.
    if (active && duration > 0) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [active, duration, onComplete]);

  // 부모의 active 상태를 직접 렌더링 조건으로 사용하여 불필요한 내부 setState를 방지합니다.
  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      <ConfettiLib
        width={windowSize.width}
        height={windowSize.height}
        numberOfPieces={numberOfPieces}
        gravity={gravity}
        friction={friction}
        initialVelocityY={initialVelocityY}
        initialVelocityX={initialVelocityX}
        colors={colors}
        opacity={opacity}
        recycle={recycle}
      />
    </div>
  );
};
