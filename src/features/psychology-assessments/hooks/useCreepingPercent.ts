import { useEffect, useState } from 'react';

// creep 속도 파라미터. tick마다 남은 거리(cap까지)의 EASE 비율만큼 접근한다.
// 점근식이라 cap에 가까울수록 느려져 자연스럽게 둔화되고, 실제 진행보다 앞서지 않는다.
const CREEP_TICK_MS = 300;
const CREEP_EASE = 0.015;

/**
 * 단계 기반 진행률을 시간에 따라 부드럽게 채우는 표시 퍼센트.
 *
 * - floor: 서버가 확인한 현재 단계값. 이 아래로는 내려가지 않는다(되돌아가지 않음).
 * - ceiling: 다음 단계값(상한). 여기엔 '도달'하지 않고 점근만 해, 실제 단계가
 *   완료되기 전에 진행률이 앞서가지 않는다.
 *
 * 단계가 적은 경우(예: 결과지 1개 → 단계 2개)에도 floor에서 멈춰 보이지 않고
 * ceiling을 향해 천천히 차오른다. floor가 오르면 렌더에서 즉시 따라 올라가 끊김 없이 이어진다.
 */
export function useCreepingPercent(floor: number, ceiling: number): number {
  const cap = Math.max(floor, ceiling);
  // creep 진행분만 state로 둔다. floor 점프/완료는 렌더 시점에 합성한다.
  const [creep, setCreep] = useState(floor);

  useEffect(() => {
    if (floor >= 100) return; // 완료: creep 불필요(렌더에서 100 반환)
    const timer = setInterval(() => {
      setCreep((prev) => {
        const base = Math.max(prev, floor); // floor 점프 흡수
        const next = Math.min(base + (cap - base) * CREEP_EASE, cap);
        // 미세 변화는 동일 값 반환으로 리렌더 생략
        return next - prev < 0.05 ? prev : next;
      });
    }, CREEP_TICK_MS);
    return () => clearInterval(timer);
  }, [floor, cap]);

  if (floor >= 100) return 100;
  // floor 아래로 내려가지 않고 cap을 넘지 않도록 합성한 표시값
  return Math.min(Math.max(creep, floor), cap);
}
