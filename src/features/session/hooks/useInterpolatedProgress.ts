import { useEffect, useState } from 'react';

/**
 * 서버 진행률(폴링 + 워커의 창게 방출)을 화면용으로 보간한다 — 트리클 + 스냅.
 *
 * 배경: 전사 진행률은 워커가 (%, 단계) 체크포인트로 보고하고 웹이 폴링(~3s)해 표시한다.
 * 체크포인트가 성기거나 폴링 사이 정체가 있으면 진행바가 뚝뚝 끊겨 보인다. 이 훅은
 * 마지막 서버값을 향해(그리고 그보다 살짝 앞서) 부드럽게 기어오르는 표시값을 만든다.
 *
 * 규칙:
 * - 서버값이 오르면 즉시 그 값으로 스냅업(뒤로 가지 않는다).
 * - 처리 중(active)엔 폴링 사이에도 `실제값 + MARGIN`(상한 `CAP`)을 향해 천천히 트리클.
 * - 완료(real ≥ 100)면 100으로 스냅. real이 크게 떨어지면(재전사/새 세션) 리셋.
 */

const TRICKLE_INTERVAL_MS = 400;
const TRICKLE_MARGIN = 6; // 마지막 서버값보다 최대 +6%까지 선행
const TRICKLE_CAP = 97; // 완료 전 표시 상한
const EASE = 0.05; // 목표를 향한 접근 비율(작을수록 완만)
const RESET_DROP = 5; // real이 표시값보다 이만큼 낮으면 리셋으로 간주

function reconcile(display: number, real: number): number {
  if (real >= 100) return 100;
  if (real < display - RESET_DROP) return real; // 재전사/새 세션 → 리셋
  return Math.max(display, real); // 상승 스냅업(뒤로 안 감)
}

export function useInterpolatedProgress(real: number, active: boolean): number {
  const [display, setDisplay] = useState(real);
  const [prevReal, setPrevReal] = useState(real);

  // 서버값 변화 반영 — React 권장 "렌더 중 상태 조정" 패턴(effect 아님).
  if (real !== prevReal) {
    setPrevReal(real);
    setDisplay((d) => reconcile(d, real));
  }

  // 처리 중 트리클: 다음 값을 향해 완만히 접근(상한 CAP). real이 바뀌면 인터벌만 재설정.
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      setDisplay((d) => {
        const target = Math.min(real + TRICKLE_MARGIN, TRICKLE_CAP);
        if (d >= target) return d;
        return d + (target - d) * EASE;
      });
    }, TRICKLE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [active, real]);

  return Math.round(display);
}
