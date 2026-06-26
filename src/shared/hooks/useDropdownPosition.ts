import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

export interface DropdownPosition {
  /** 펼침 방향 — 위/아래 */
  direction: 'up' | 'down';
  /** 뷰포트 침범 보정용 translate(px). 0,0이면 보정 없음. */
  offset: { x: number; y: number };
}

interface Options {
  /** 방향 결정용 예상 높이(드롭다운 렌더 전 사용) */
  estimatedHeight?: number;
  /** 뷰포트 가장자리 여백 */
  margin?: number;
}

/**
 * 드롭다운이 화면 밖으로 나가지 않게 두 단계로 위치를 잡는다.
 *  1) **방향**: 트리거 아래 공간이 부족하고 위가 더 넓으면 위로 펼친다.
 *  2) **보정**: 그 상태로도 뷰포트를 벗어나면, 벗어난 좌표만큼 translate로 끌어들인다(상하좌우).
 *
 * 열릴 때 1회 계산(짧게 떴다 닫히는 드롭다운이라 스크롤/리사이즈 추적은 생략).
 * absolute 드롭다운이라 부모 overflow 박스 ≈ 패널(=뷰포트 높이)이므로 뷰포트 기준 보정이
 * 컨테이너 클리핑도 함께 완화한다.
 *
 * TODO(드롭다운 위치 보정 — 전체 적용 계획):
 *  - 적용 완료: TimeSelect, CounselMethodSelect, AddEventPanel(카테고리),
 *    RepeatSelect(주기), QuestionTypeDropdown, ScoreRangeSelect.
 *  - 후속 적용 대상:
 *      · DatePopoverCalendar(날짜 팝오버) — AddEventPanel 날짜필드 + RepeatSelect 종료일에서
 *        공용. 부모가 트리거 ref/open을 가지므로 ref·direction·offset 전달 리팩터 필요.
 *      · CategorySettingsMenu(사이드바 카테고리 설정 ⋯)
 *      · MyDocumentCard(내 문서 ⋯ 케밥), SendDocumentModal(문서 선택 등)
 *      · 이후 신규로 추가되는 absolute 드롭다운은 기본적으로 이 훅을 적용.
 *  - 제외: ClientSelector 등 PopUp(floating) 기반 컴포넌트는 자체 충돌 처리하므로 불필요.
 *  - 개선 여지: 긴 목록은 스크롤/리사이즈 추적(현재 미적용) + maxHeight 동적 캡 고려.
 */
export function useDropdownPosition<
  T extends HTMLElement,
  D extends HTMLElement,
>(
  triggerRef: RefObject<T | null>,
  dropdownRef: RefObject<D | null>,
  open: boolean,
  { estimatedHeight = 240, margin = 8 }: Options = {}
): DropdownPosition {
  const [direction, setDirection] = useState<'up' | 'down'>('down');
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  // setOffset과 항상 동기. 측정 rect에서 '적용된 transform'을 빼 자연 위치를 얻는 데 쓴다.
  const offsetRef = useRef({ x: 0, y: 0 });

  // 1) 방향 — 트리거 위치 기준(드롭다운 렌더 전에 결정 가능)
  useLayoutEffect(() => {
    const trigger = triggerRef.current;
    if (!open || !trigger) return;
    const decide = () => {
      const rect = trigger.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDirection(
        spaceBelow < estimatedHeight && rect.top > spaceBelow ? 'up' : 'down'
      );
    };
    decide();
  }, [open, triggerRef, estimatedHeight]);

  // 2) 보정 — 최종 방향으로 렌더된 드롭다운의 뷰포트 침범량만큼 translate
  useLayoutEffect(() => {
    const dropdown = dropdownRef.current;
    if (!open || !dropdown) return;
    const correct = () => {
      const rect = dropdown.getBoundingClientRect();
      const prev = offsetRef.current;
      // 이미 적용된 transform 제거한 '자연 위치'
      const left = rect.left - prev.x;
      const right = rect.right - prev.x;
      const top = rect.top - prev.y;
      const bottom = rect.bottom - prev.y;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let x = 0;
      if (right > vw - margin) x = vw - margin - right; // 오른쪽 침범 → 왼쪽으로
      if (left + x < margin) x = margin - left; // 왼쪽 침범 → 오른쪽으로(우선)

      let y = 0;
      if (bottom > vh - margin) y = vh - margin - bottom; // 아래 침범 → 위로
      if (top + y < margin) y = margin - top; // 위 침범 → 아래로(우선)

      const next = { x: Math.round(x), y: Math.round(y) };
      offsetRef.current = next;
      setOffset(next);
    };
    correct();
  }, [open, direction, dropdownRef, margin]);

  return { direction, offset };
}
