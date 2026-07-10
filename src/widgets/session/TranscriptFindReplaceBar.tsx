/**
 * 축어록 찾기·바꾸기 바 (편집 모드 전용)
 * - 찾기/바꾸기 입력을 항상 함께 표시. 포커스된 input이 모드를 결정:
 *   찾기 input에서 Enter=다음 매치로 이동, 바꾸기 input에서 Enter=하나씩 치환
 * - 매치 개수 표시(N/총계), 화살표로 이동, '모두 바꾸기'로 일괄 치환
 * 이 축어록 텍스트에서만 치환하며 태그(비언어/비식별) 안은 보호한다.
 */
import React from 'react';

import { ChevronDown, ChevronUp, X } from 'lucide-react';

import { Button } from '@/shared/ui/atoms/Button';
import { Input } from '@/shared/ui/atoms/Input';
import { useToast } from '@/shared/ui/composites/Toast';

interface Match {
  segmentId: number;
  occ: number;
}

interface TranscriptFindReplaceBarProps {
  /** 매치 목록(세그먼트+occ) 조회 */
  getMatchList: (find: string) => Match[];
  /** occ번째 매치 하나 치환 — 성공 여부 반환 */
  onReplaceOne: (
    segmentId: number,
    occ: number,
    find: string,
    replaceWith: string
  ) => boolean;
  /** 모두 바꾸기 — 총 치환 횟수 반환 */
  onReplaceAll: (find: string, replaceWith: string) => number;
  /** 치환/undo 등으로 내용이 바뀌면 매치 재계산용 (editorVersion) */
  matchRefreshKey: number;
  onClose: () => void;
}

const HIGHLIGHT_CLASSES = ['ring-2', 'ring-primary', 'ring-offset-2'];

export const TranscriptFindReplaceBar: React.FC<
  TranscriptFindReplaceBarProps
> = ({
  getMatchList,
  onReplaceOne,
  onReplaceAll,
  matchRefreshKey,
  onClose,
}) => {
  const { toast } = useToast();
  const [find, setFind] = React.useState('');
  const [replaceWith, setReplaceWith] = React.useState('');
  const [currentIndex, setCurrentIndex] = React.useState(-1);
  const [scrollNonce, setScrollNonce] = React.useState(0);
  const scrollTargetRef = React.useRef<number | null>(null);

  const matches = React.useMemo(() => {
    void matchRefreshKey; // 치환/undo 후 재계산 트리거
    return find ? getMatchList(find) : [];
  }, [find, getMatchList, matchRefreshKey]);
  const count = matches.length;

  // 검색어가 바뀌면 위치 초기화
  React.useEffect(() => {
    setCurrentIndex(-1);
  }, [find]);

  // 대상 세그먼트로 스크롤 + 잠깐 하이라이트 (remount 이후 실행되도록 effect에서)
  React.useEffect(() => {
    const id = scrollTargetRef.current;
    if (id == null) return;
    const el = document.querySelector<HTMLElement>(`[data-segment-id="${id}"]`);
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el.classList.add(...HIGHLIGHT_CLASSES);
    const timer = window.setTimeout(() => {
      el.classList.remove(...HIGHLIGHT_CLASSES);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [scrollNonce]);

  const scrollToSegment = (segmentId: number) => {
    scrollTargetRef.current = segmentId;
    setScrollNonce((n) => n + 1);
  };

  // 하이라이트 스타일 주입: 나머지=green-40, 현재 매치=green-80
  // 팔레트 hex 하드코딩 회피 위해 런타임에 CSS 토큰값을 읽음.
  // HMR로 <style>이 남아 있어도 매번 textContent를 갱신(예전 색 잔존 방지).
  React.useEffect(() => {
    const id = 'transcript-find-highlight-style';
    let style = document.getElementById(id) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = id;
      document.head.appendChild(style);
    }
    const root = getComputedStyle(document.documentElement);
    const other = root.getPropertyValue('--color-green-40').trim() || '#cfe5d0';
    const current =
      root.getPropertyValue('--color-green-80').trim() || '#44ce4b';
    style.textContent =
      `::highlight(transcript-find){background-color:${other};color:inherit;}` +
      // 현재(포커싱된) 매치: 진한 초록 배경 위 흰 텍스트로 강조
      `::highlight(transcript-find-current){background-color:${current};color:#fff;}`;
  }, []);

  // 찾은 단어 하이라이트 (CSS Custom Highlight API, 미지원 브라우저는 무시)
  // 나머지 매치=transcript-find(green-40), 현재 매치(currentIndex)=transcript-find-current(green-80)
  React.useEffect(() => {
    void matchRefreshKey; // 치환/undo 후 재계산
    const cssHighlights = (
      window.CSS as unknown as {
        highlights?: {
          set: (name: string, h: unknown) => void;
          delete: (name: string) => void;
        };
      }
    )?.highlights;
    const HighlightCtor = (
      window as unknown as { Highlight?: new (...ranges: Range[]) => unknown }
    ).Highlight;
    if (!cssHighlights || !HighlightCtor) return;
    const clear = () => {
      cssHighlights.delete('transcript-find');
      cssHighlights.delete('transcript-find-current');
    };
    if (!find) {
      clear();
      return;
    }

    const otherRanges: Range[] = [];
    const currentRanges: Range[] = [];
    const lc = find.toLowerCase();
    // 전역 매치 순번 = matches 리스트 인덱스와 정합(세그먼트·occ 순서 동일)
    let globalIdx = 0;
    document.querySelectorAll('[data-segment-id]').forEach((seg) => {
      const walker = document.createTreeWalker(seg, NodeFilter.SHOW_TEXT, {
        // 칩(nv/deid ON) + deid 인라인(showDeid OFF) 텍스트는 제외 → 저장 검색과 정합
        acceptNode: (n) =>
          (n as Text).parentElement?.closest(
            '[contenteditable="false"],[data-deid-inline]'
          )
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT,
      });
      let node = walker.nextNode();
      while (node) {
        const lower = (node.textContent || '').toLowerCase();
        let idx = lower.indexOf(lc);
        while (idx !== -1) {
          const r = document.createRange();
          r.setStart(node, idx);
          r.setEnd(node, idx + find.length);
          if (globalIdx === currentIndex) currentRanges.push(r);
          else otherRanges.push(r);
          globalIdx += 1;
          idx = lower.indexOf(lc, idx + find.length);
        }
        node = walker.nextNode();
      }
    });

    if (otherRanges.length > 0)
      cssHighlights.set('transcript-find', new HighlightCtor(...otherRanges));
    else cssHighlights.delete('transcript-find');
    if (currentRanges.length > 0)
      cssHighlights.set(
        'transcript-find-current',
        new HighlightCtor(...currentRanges)
      );
    else cssHighlights.delete('transcript-find-current');

    return clear;
  }, [find, matchRefreshKey, currentIndex]);

  // 다음 매치로 이동 (Enter)
  const goToNext = () => {
    const list = getMatchList(find);
    if (list.length === 0) return;
    const next = (currentIndex + 1) % list.length;
    setCurrentIndex(next);
    scrollToSegment(list[next].segmentId);
  };

  const goToPrev = () => {
    const list = getMatchList(find);
    if (list.length === 0) return;
    const prev = (currentIndex - 1 + list.length) % list.length;
    setCurrentIndex(prev);
    scrollToSegment(list[prev].segmentId);
  };

  // 현재 위치 하나 치환 후 다음으로 (Enter, 바꾸기 모드)
  const handleReplaceOne = () => {
    const list = getMatchList(find);
    if (list.length === 0) return;
    const idx = currentIndex < 0 ? 0 : Math.min(currentIndex, list.length - 1);
    const { segmentId, occ } = list[idx];
    const ok = onReplaceOne(segmentId, occ, find, replaceWith);
    if (!ok) return;
    // onReplaceOne이 editingContents를 동기 갱신하므로 즉시 최신 목록 조회 가능
    const after = getMatchList(find);
    if (after.length === 0) {
      setCurrentIndex(-1);
      return;
    }
    const nextIdx = Math.min(idx, after.length - 1);
    setCurrentIndex(nextIdx);
    scrollToSegment(after[nextIdx].segmentId);
  };

  const handleReplaceAll = () => {
    if (!find) return;
    const replaced = onReplaceAll(find, replaceWith);
    toast({
      title: replaced > 0 ? '바꾸기 완료' : '결과 없음',
      description:
        replaced > 0
          ? `${replaced}곳을 바꿨어요.`
          : '바꿀 내용을 찾지 못했어요.',
      duration: 3000,
    });
    setCurrentIndex(-1);
  };

  const countLabel = !find
    ? ''
    : count === 0
      ? '결과 없음'
      : currentIndex >= 0
        ? `${currentIndex + 1}/${count}`
        : `${count}개`;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-grey-30 bg-white px-3 py-2 shadow-sm">
      {/* 1행: 찾기 */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          size="sm"
          value={find}
          onChange={(e) => setFind(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              goToNext();
            }
          }}
          placeholder="찾기 (예: 정민)"
          className="w-40"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
        <span className="typo-sm min-w-[3.5rem] text-grey-70">
          {countLabel}
        </span>
        <button
          type="button"
          onClick={goToPrev}
          disabled={count === 0}
          aria-label="이전 찾기"
          className="rounded-md p-1 text-grey-60 transition-colors disabled:opacity-40 lg:hover:bg-grey-10 lg:hover:text-grey-100"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={goToNext}
          disabled={count === 0}
          aria-label="다음 찾기"
          className="rounded-md p-1 text-grey-60 transition-colors disabled:opacity-40 lg:hover:bg-grey-10 lg:hover:text-grey-100"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="찾기 바꾸기 닫기"
          className="ml-auto rounded-md p-1 text-grey-60 transition-colors lg:hover:bg-grey-10 lg:hover:text-grey-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 2행: 바꾸기 (항상 표시 — 포커스된 input이 찾기/바꾸기 모드를 결정) */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          size="sm"
          value={replaceWith}
          onChange={(e) => setReplaceWith(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleReplaceOne();
            }
          }}
          placeholder="바꾸기 (예: 경민)"
          className="w-40"
        />
        <Button
          size="sm"
          variant="outline"
          tone="neutral"
          onClick={handleReplaceOne}
          disabled={count === 0}
          className="border-grey-100 bg-white text-grey-100 lg:hover:bg-grey-10"
        >
          바꾸기
        </Button>
        <Button
          size="sm"
          variant="solid"
          tone="primary"
          onClick={handleReplaceAll}
          disabled={count === 0}
        >
          모두 바꾸기
        </Button>
      </div>
    </div>
  );
};
