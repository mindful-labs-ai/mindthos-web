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
  /** 클립 박스 가장자리 여백 */
  margin?: number;
}

/**
 * 트리거의 가장 가까운 스크롤/클립 조상의 가시 영역(뷰포트와 교집합). 없으면 뷰포트.
 * 드롭다운이 패널 본문(overflow-y-auto) 안에 있을 때, 뷰포트가 아니라 이 본문 박스를 기준으로
 * 방향/보정을 잡아야 화면은 길어도 본문이 CTA 위에서 끝나는 경우 아래로 넘쳐 가려지지 않는다.
 */
function clipBounds(el: HTMLElement): {
  top: number;
  bottom: number;
  left: number;
  right: number;
} {
  let box = {
    top: 0,
    bottom: window.innerHeight,
    left: 0,
    right: window.innerWidth,
  };
  for (let node = el.parentElement; node; node = node.parentElement) {
    const s = getComputedStyle(node);
    if (
      /(auto|scroll|hidden)/.test(s.overflowY) ||
      /(auto|scroll|hidden)/.test(s.overflowX)
    ) {
      const r = node.getBoundingClientRect();
      box = { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
      break;
    }
  }
  return {
    top: Math.max(box.top, 0),
    bottom: Math.min(box.bottom, window.innerHeight),
    left: Math.max(box.left, 0),
    right: Math.min(box.right, window.innerWidth),
  };
}

/**
 * 드롭다운이 클립 박스(가장 가까운 스크롤 조상, 없으면 뷰포트) 밖으로 나가지 않게 두 단계로 잡는다.
 *  1) **방향**: 트리거 아래(클립 박스 기준) 공간이 부족하고 위가 더 넓으면 위로 펼친다.
 *  2) **보정**: 그래도 클립 박스를 벗어나면, 벗어난 좌표만큼 translate로 끌어들인다(상하좌우).
 *
 * 열릴 때 1회 계산(짧게 떴다 닫히는 드롭다운이라 스크롤/리사이즈 추적은 생략).
 * 패널 본문(overflow-y-auto) 안의 드롭다운은 그 본문 박스가 기준이라, 화면이 길어도 본문이
 * CTA 푸터 위에서 끝나면 하단 필드에서 위로 플립돼 푸터에 가리거나 본문이 스크롤되지 않는다.
 *
 * TODO(드롭다운 위치 보정 — 전체 적용 계획):
 *  - 적용 완료: TimeSelect, CounselMethodSelect, AddEventPanel(카테고리·날짜),
 *    RepeatSelect(주기·종료일), DatePopoverCalendar(ref/direction/offset 수신),
 *    FieldTypeDropdown, ScoreRangeSelect.
 *  - 후속 적용 대상:
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

  // 1) 방향 — 트리거 위치 기준(드롭다운 렌더 전에 결정 가능). 클립 박스(스크롤 본문) 기준.
  useLayoutEffect(() => {
    const trigger = triggerRef.current;
    if (!open || !trigger) return;
    const decide = () => {
      const rect = trigger.getBoundingClientRect();
      const clip = clipBounds(trigger);
      const spaceBelow = clip.bottom - rect.bottom;
      const spaceAbove = rect.top - clip.top;
      setDirection(
        spaceBelow < estimatedHeight && spaceAbove > spaceBelow ? 'up' : 'down'
      );
    };
    decide();
  }, [open, triggerRef, estimatedHeight]);

  // 2) 보정 — 렌더된 드롭다운의 클립 박스 침범량만큼 translate
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
      const clip = clipBounds(triggerRef.current ?? dropdown);

      let x = 0;
      if (right > clip.right - margin) x = clip.right - margin - right; // 오른쪽 침범 → 왼쪽으로
      if (left + x < clip.left + margin) x = clip.left + margin - left; // 왼쪽 침범 → 오른쪽으로(우선)

      let y = 0;
      if (bottom > clip.bottom - margin) y = clip.bottom - margin - bottom; // 아래 침범 → 위로
      if (top + y < clip.top + margin) y = clip.top + margin - top; // 위 침범 → 아래로(우선)

      const next = { x: Math.round(x), y: Math.round(y) };
      offsetRef.current = next;
      setOffset(next);
    };
    correct();
  }, [open, direction, dropdownRef, triggerRef, margin]);

  return { direction, offset };
}
