import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/cn';

export interface WaveRotatingTextProps {
  /** 위로 돌아가며 무한 반복 표시할 문구 배열 */
  texts: string[];
  /** 각 문구가 머무는 시간(ms). 기본 2200ms */
  interval?: number;
  /** 내부 텍스트(p)에 추가로 적용할 클래스 */
  textClassName?: string;
  className?: string;
}

/**
 * WaveRotatingText - 문구 배열을 세로 캐러셀로 무한 순환 표시하는 로딩 텍스트.
 *
 * - 전환 시 이전 문구는 위로 밀려 나가고(slideUpOut) 새 문구는 아래에서 올라온다(slideUpFull).
 * - 표시 중인 문구에는 '답변 중' 상태와 동일한 물결 그라데이션(.thinking-text-wave)을 입힌다.
 * - 슬라이드(래퍼)와 물결(내부 p)은 둘 다 CSS animation 단축 속성을 쓰므로 엘리먼트를 분리한다.
 * - prefers-reduced-motion 환경에선 .thinking-text-wave가 자동으로 정적 텍스트로 폴백한다.
 *
 * @example
 * <WaveRotatingText texts={['확인하고 있어요', '거의 다 됐어요']} />
 */
export const WaveRotatingText = ({
  texts,
  interval = 2200,
  textClassName,
  className,
}: WaveRotatingTextProps) => {
  const count = texts.length;
  const [index, setIndex] = useState(0);
  // 위로 밀려 나가는 중인(이전) 문구 인덱스. 애니메이션이 끝나면 null로 정리.
  const [leaving, setLeaving] = useState<number | null>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(() => {
      const prev = indexRef.current;
      const next = (prev + 1) % count;
      indexRef.current = next;
      setLeaving(prev);
      setIndex(next);
    }, interval);
    return () => clearInterval(timer);
  }, [count, interval]);

  if (count === 0) return null;

  // 전환 중 컨테이너 너비/높이가 흔들리지 않도록 가장 긴 문구로 레이아웃을 고정한다.
  const widest = texts.reduce(
    (longest, text) => (text.length > longest.length ? text : longest),
    texts[0]
  );

  const waveText = (text: string) => (
    <p
      className={cn(
        'thinking-text-wave whitespace-nowrap text-center text-m font-medium',
        textClassName
      )}
    >
      {text}
    </p>
  );

  return (
    <div className={cn('relative overflow-hidden', className)} aria-live="polite">
      {/* 레이아웃 높이/너비 확보용(보이지 않음) */}
      <p
        className="invisible whitespace-nowrap text-center text-m font-medium"
        aria-hidden
      >
        {widest}
      </p>

      {/* 들어오는 현재 문구: 아래 → 위 */}
      <div
        key={`in-${index}`}
        className="animate-slideUpFull absolute inset-0 flex items-center justify-center"
      >
        {waveText(texts[index % count])}
      </div>

      {/* 나가는 이전 문구: 위로 밀려 사라짐 */}
      {leaving !== null && leaving !== index && (
        <div
          key={`out-${leaving}`}
          className="animate-slideUpOut absolute inset-0 flex items-center justify-center"
          onAnimationEnd={() => setLeaving(null)}
        >
          {waveText(texts[leaving % count])}
        </div>
      )}
    </div>
  );
};

WaveRotatingText.displayName = 'WaveRotatingText';
