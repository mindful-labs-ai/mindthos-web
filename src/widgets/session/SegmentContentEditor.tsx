/**
 * contentEditable 기반 세그먼트 편집기
 * nv/deid 태그를 인라인 칩으로 렌더하고, 칩 클릭 시 라벨 편집 가능
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Move, Trash2 } from 'lucide-react';

import type { Speaker, TranscribeSegment } from '@/features/session/types';
import { generateNvKey } from '@/features/session/utils/contentsEditor';
import {
  getSpeakerDisplayName,
  resolveSpeakerSelection,
  type SpeakerSelection,
} from '@/features/session/utils/getSpeakerInfo';
import {
  buildAdvancedNvTag,
  buildDeidTag,
  buildLegacyNvTag,
  createAdvancedNvRegex,
  createDeidRegex,
  createLegacyNvRegex,
  NONVERBAL_DEFAULT_LABELS,
  nvKeyToTagType,
  parseNvEntries,
  type NonverbalTagType,
} from '@/features/session/utils/transcriptTags';

import {
  DEID_CHIP_CLASS,
  DEID_INLINE_CLASS,
  NV_CHIP_COLORS,
} from './transcriptChipStyles';

// ── HTML 빌드 ──

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildSegmentHtml(
  text: string,
  nv?: string[],
  deid?: Record<string, string>,
  showDeid?: boolean
): string {
  let html = escapeHtml(text);

  // 신규 nv 태그 (advanced) → 칩
  if (nv && nv.length > 0) {
    const nvMap = parseNvEntries(nv);
    html = html.replace(createAdvancedNvRegex(), (_, key: string) => {
      const label = nvMap.get(key)?.label || key;
      const tagType = nvKeyToTagType(key);
      const style = NV_CHIP_COLORS[tagType] || NV_CHIP_COLORS.A;
      return `<span data-chip="nv" data-nv-key="${escapeHtml(key)}" data-tag-type="${tagType}" contenteditable="false" class="mx-0.5 inline-flex cursor-pointer items-center rounded-md border px-1.5 py-0.5 align-middle text-xs font-medium ${style}">${escapeHtml(label)}</span>`;
    });
  }

  // 레거시 nv 태그 (gemini-3) → 칩: {%A%한숨%}, {%E%화남%}, {%S%}, {%O%}
  html = html.replace(
    createLegacyNvRegex(),
    (_, tagType: string, content?: string) => {
      const label =
        content || NONVERBAL_DEFAULT_LABELS[tagType as NonverbalTagType];
      if (!label) return '';
      const chipTagType = tagType === 'E' ? 'E' : 'A';
      const style = NV_CHIP_COLORS[chipTagType] || NV_CHIP_COLORS.A;
      return `<span data-chip="legacy-nv" data-legacy-tag="${tagType}" contenteditable="false" class="mx-0.5 inline-flex cursor-pointer items-center rounded-md border px-1.5 py-0.5 align-middle text-xs font-medium ${style}">${escapeHtml(label)}</span>`;
    }
  );

  // deid 태그
  if (deid) {
    html = html.replace(
      createDeidRegex(),
      (_, key: string, original: string) => {
        if (showDeid) {
          // ON: 라벨 칩 (contenteditable=false, 클릭으로 편집)
          const label = deid[key] || key;
          return `<span data-chip="deid" data-deid-key="${escapeHtml(key)}" data-deid-original="${escapeHtml(original)}" contenteditable="false" class="mx-0.5 inline-flex cursor-pointer items-center rounded-md border px-1.5 py-0.5 align-middle text-xs font-headline ${DEID_CHIP_CLASS}">${escapeHtml(label)}</span>`;
        } else {
          // OFF: 원본 텍스트 인라인 편집 가능
          return `<span data-deid-key="${escapeHtml(key)}" data-deid-inline="" class="${DEID_INLINE_CLASS}">${escapeHtml(original)}</span>`;
        }
      }
    );
  }

  return html;
}

// ── 칩 DOM 노드 생성 (삽입/이동용) ──

const NV_CHIP_CLASS =
  'mx-0.5 inline-flex cursor-pointer items-center rounded-md border px-1.5 py-0.5 align-middle text-xs font-medium';

/** nv 키 접두로 태그 타입 결정 (뷰 렌더와 동일 매핑) */
function nvTagTypeFromKey(key: string): 'S' | 'E' | 'A' {
  return key.startsWith('e') ? 'E' : key.startsWith('s') ? 'S' : 'A';
}

/** 신규 nv 칩 노드 (extractFromDom 호환: data-chip=nv + data-nv-key) */
function createNvChipElement(key: string, label: string): HTMLSpanElement {
  const tagType = nvTagTypeFromKey(key);
  const span = document.createElement('span');
  span.dataset.chip = 'nv';
  span.dataset.nvKey = key;
  span.dataset.tagType = tagType;
  span.setAttribute('contenteditable', 'false');
  span.className = `${NV_CHIP_CLASS} ${NV_CHIP_STYLES[tagType] || NV_CHIP_STYLES.A}`;
  span.textContent = label;
  return span;
}

/** 클릭 좌표의 caret Range (Chrome/Safari + Firefox 폴백) */
function caretRangeAtPoint(x: number, y: number): Range | null {
  const doc = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
    caretPositionFromPoint?: (
      x: number,
      y: number
    ) => { offsetNode: Node; offset: number } | null;
  };
  if (typeof doc.caretRangeFromPoint === 'function') {
    return doc.caretRangeFromPoint(x, y);
  }
  const pos = doc.caretPositionFromPoint?.(x, y);
  if (pos) {
    const range = document.createRange();
    range.setStart(pos.offsetNode, pos.offset);
    range.collapse(true);
    return range;
  }
  return null;
}

/** 칩 노드를 Range 위치에 삽입하고 캐럿을 칩 뒤로 이동 (범위 없으면 끝에 append) */
function insertChipAtRange(
  chip: HTMLElement,
  range: Range | null,
  editor: HTMLElement
): void {
  if (range && editor.contains(range.startContainer)) {
    range.collapse(true);
    range.insertNode(chip);
    range.setStartAfter(chip);
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  } else {
    editor.appendChild(chip);
  }
}

// ── DOM → 데이터 추출 ──

interface ExtractedData {
  text: string;
  nv?: string[];
  deid?: Record<string, string>;
}

function extractFromDom(
  container: HTMLElement,
  originalNv?: string[],
  originalDeid?: Record<string, string>,
  showDeid?: boolean
): ExtractedData {
  let text = '';
  const nvUpdates = new Map<string, string>();
  const deidMapUpdates: Record<string, string> = {};

  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent || '';
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as HTMLElement;

    if (el.dataset.chip === 'nv') {
      const key = el.dataset.nvKey!;
      const label = el.textContent || '';
      text += buildAdvancedNvTag(key);
      nvUpdates.set(key, label);
      return;
    }

    if (el.dataset.chip === 'legacy-nv') {
      const tagType = (el.dataset.legacyTag || 'A') as NonverbalTagType;
      const label = el.textContent || '';
      // S, O는 내용 없는 형태, A/E는 내용 있는 형태로 복원
      const isDefaultLabel =
        (tagType === 'S' || tagType === 'O') &&
        (label === '침묵' || label === '겹침');
      text += buildLegacyNvTag(tagType, isDefaultLabel ? undefined : label);
      return;
    }

    if (el.dataset.chip === 'deid') {
      // ON 모드 칩
      const key = el.dataset.deidKey!;
      const original = el.dataset.deidOriginal || '';
      const label = el.textContent || '';
      text += buildDeidTag(key, original);
      deidMapUpdates[key] = label;
      return;
    }

    if (el.dataset.deidInline !== undefined) {
      // OFF 모드 인라인 - textContent가 수정된 원본
      const key = el.dataset.deidKey!;
      const newOriginal = el.textContent || '';
      text += buildDeidTag(key, newOriginal);
      return;
    }

    if (el.tagName === 'BR') {
      text += '\n';
      return;
    }

    // 기타 요소는 자식 순회
    el.childNodes.forEach(walk);
  }

  container.childNodes.forEach(walk);

  // nv 배열을 DOM에 실제 존재하는 칩 기준으로 재구성
  // (라벨 갱신·삭제뿐 아니라 신규 삽입/이동도 반영. 순서 = DOM 등장 순)
  let updatedNv: string[] | undefined;
  const orig = originalNv ?? [];
  if (orig.length > 0 || nvUpdates.size > 0) {
    const rebuilt = Array.from(nvUpdates.entries()).map(
      ([key, label]) => `${key}:${label}`
    );
    if (
      rebuilt.length !== orig.length ||
      rebuilt.some((e, i) => e !== orig[i])
    ) {
      updatedNv = rebuilt;
    }
  }

  // deid 맵 업데이트 (ON 모드에서 라벨 편집 시)
  let updatedDeid: Record<string, string> | undefined;
  if (showDeid && originalDeid && Object.keys(deidMapUpdates).length > 0) {
    updatedDeid = { ...originalDeid, ...deidMapUpdates };
  }

  return { text, nv: updatedNv, deid: updatedDeid };
}

// ── 캐럿 → 저장텍스트 오프셋 (분리용) ──

/** deid-inline(showDeid OFF에서 편집가능한 deid 원문) 안이면 그 span 뒤 경계로 스냅 */
function snapPastDeid(node: Node, offset: number): { node: Node; offset: number } {
  const el =
    node.nodeType === Node.TEXT_NODE
      ? node.parentElement
      : (node as Element);
  const host = el?.closest<HTMLElement>('[data-deid-inline],[data-deid-key]');
  if (host && host.parentNode) {
    const parent = host.parentNode;
    const idx = Array.prototype.indexOf.call(parent.childNodes, host);
    return { node: parent, offset: idx + 1 };
  }
  return { node, offset };
}

/**
 * (node,offset)까지의 저장텍스트 오프셋 = [container start..caret] clone에 extractFromDom
 * 재사용 → 토큰 공간 오프셋 정합 보장(중첩/BR/경계/deid 자동 처리)
 */
function getStoredOffset(
  container: HTMLElement,
  node: Node,
  offset: number
): number {
  const snapped = snapPastDeid(node, offset);
  const pre = document.createRange();
  pre.setStart(container, 0);
  pre.setEnd(snapped.node, snapped.offset);
  const tmp = document.createElement('div');
  tmp.appendChild(pre.cloneContents());
  return extractFromDom(tmp).text.length;
}

// ── 칩 편집 팝오버 ──

interface ChipEditState {
  key: string;
  type: 'nv' | 'deid' | 'legacy-nv';
  value: string;
  rect: { top: number; left: number; width: number };
  chipEl: HTMLSpanElement;
}

// ── 컴포넌트 ──

interface SegmentContentEditorProps {
  segment: TranscribeSegment;
  showDeid: boolean;
  isActive: boolean;
  onTextChange: (text: string) => void;
  onNvChange?: (nv: string[]) => void;
  onDeidChange?: (deid: Record<string, string>) => void;
  /** 화자 목록 (화자 전환 인라인 선택용) */
  speakers?: Speaker[];
  /** 세그먼트 분리/화자 전환 콜백 */
  onSplitSegment?: (
    segmentId: number,
    boundaries: number[],
    sliceSpeakers: number[],
    speakerDefinitions?: Speaker[]
  ) => void;
}

export const SegmentContentEditor: React.FC<SegmentContentEditorProps> =
  React.memo(
    ({
      segment,
      showDeid,
      isActive,
      onTextChange,
      onNvChange,
      onDeidChange,
      speakers,
      onSplitSegment,
    }) => {
      const editorRef = useRef<HTMLDivElement>(null);
      const isComposingRef = useRef(false);
      const initializedRef = useRef(false);
      const [chipEdit, setChipEdit] = useState<ChipEditState | null>(null);
      const chipInputRef = useRef<HTMLInputElement>(null);
      // 비언어 태그 삽입/이동 + 캐럿 메뉴
      const savedRangeRef = useRef<Range | null>(null);
      const nvLabelInputRef = useRef<HTMLInputElement>(null);
      // 캐럿/선택 위치(에디터 기준) — 액션 메뉴 앵커
      const [caretPos, setCaretPos] = useState<{
        top: number;
        left: number;
      } | null>(null);
      const [hasSelection, setHasSelection] = useState(false);
      // 현재 위치에서 분리가 의미 있는지 (선택 or 캐럿이 양끝 아님)
      const [canSplitHere, setCanSplitHere] = useState(false);
      // Enter 분리 쓰로틀 (연속 Enter 방지)
      const lastSplitAtRef = useRef(0);
      const [nvAdd, setNvAdd] = useState<{
        type: 'S' | 'E' | 'A';
        label: string;
        top: number;
        left: number;
      } | null>(null);
      const nvAddRef = useRef<HTMLDivElement>(null);
      // 화자 분리 인라인 목록
      const [speakerPick, setSpeakerPick] = useState<{
        customName: string;
        top: number;
        left: number;
      } | null>(null);
      const speakerPickRef = useRef<HTMLDivElement>(null);
      const [placingChip, setPlacingChip] = useState<HTMLSpanElement | null>(
        null
      );
      const canSplit = !!onSplitSegment && !!speakers;

      // 편집 모드 진입 시 한 번만 HTML 빌드
      useEffect(() => {
        if (!editorRef.current || initializedRef.current) return;
        editorRef.current.innerHTML = buildSegmentHtml(
          segment.text,
          segment.nv,
          segment.deid,
          showDeid
        );
        initializedRef.current = true;
      }, [segment.text, segment.nv, segment.deid, showDeid]);

      // 변경 감지 → 데이터 추출
      const emitChanges = useCallback(() => {
        if (!editorRef.current || isComposingRef.current) return;
        const { text, nv, deid } = extractFromDom(
          editorRef.current,
          segment.nv,
          segment.deid,
          showDeid
        );
        onTextChange(text);
        if (nv) onNvChange?.(nv);
        if (deid) onDeidChange?.(deid);
      }, [
        segment.nv,
        segment.deid,
        showDeid,
        onTextChange,
        onNvChange,
        onDeidChange,
      ]);

      const handleInput = useCallback(() => {
        emitChanges();
      }, [emitChanges]);

      // 편집기 내 캐럿/선택 저장 + 메뉴 앵커 계산
      // 이 range에서 분리가 의미 있는지: 선택은 항상, 캐럿은 앞뒤 모두 내용이 있을 때만
      // (맨 앞/맨 끝 분리는 빈 세그먼트만 생겨 무의미)
      const rangeCanSplit = useCallback((range: Range | null): boolean => {
        const editor = editorRef.current;
        if (!range || !editor || !editor.contains(range.startContainer))
          return false;
        if (!range.collapsed) return true;
        const before = document.createRange();
        before.selectNodeContents(editor);
        before.setEnd(range.startContainer, range.startOffset);
        const after = document.createRange();
        after.selectNodeContents(editor);
        after.setStart(range.startContainer, range.startOffset);
        return (
          before.toString().trim() !== '' && after.toString().trim() !== ''
        );
      }, []);

      const saveSelection = useCallback(() => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && editorRef.current) {
          const range = sel.getRangeAt(0);
          if (editorRef.current.contains(range.commonAncestorContainer)) {
            savedRangeRef.current = range.cloneRange();
            const rects = range.getClientRects();
            const rect =
              rects.length > 0
                ? rects[rects.length - 1]
                : range.getBoundingClientRect();
            const editorRect = editorRef.current.getBoundingClientRect();
            setCaretPos({
              top: rect.bottom - editorRect.top,
              left: Math.max(0, rect.left - editorRect.left),
            });
            setHasSelection(!range.collapsed);
            setCanSplitHere(rangeCanSplit(range));
            return;
          }
        }
        setCaretPos(null);
        setHasSelection(false);
        setCanSplitHere(false);
      }, [rangeCanSplit]);

      // 저장된 range → 저장텍스트 분리 경계 계산
      const computeOffsets = useCallback((): {
        boundaries: number[];
        isSelection: boolean;
      } | null => {
        const range = savedRangeRef.current;
        const editor = editorRef.current;
        if (
          !range ||
          !editor ||
          isComposingRef.current ||
          !editor.contains(range.startContainer)
        )
          return null;
        const start = getStoredOffset(
          editor,
          range.startContainer,
          range.startOffset
        );
        if (range.collapsed) return { boundaries: [start], isSelection: false };
        const end = getStoredOffset(
          editor,
          range.endContainer,
          range.endOffset
        );
        return { boundaries: [start, end], isSelection: true };
      }, []);

      const resetMenu = useCallback(() => {
        setCaretPos(null);
        setHasSelection(false);
        setSpeakerPick(null);
      }, []);

      // 세그먼트 분리 (같은 화자)
      const doSplitSame = useCallback(() => {
        const o = computeOffsets();
        if (!o) return;
        onSplitSegment?.(
          segment.id,
          [o.boundaries[0]],
          [segment.speaker, segment.speaker]
        );
        resetMenu();
      }, [computeOffsets, onSplitSegment, segment.id, segment.speaker, resetMenu]);

      // 화자 전환 (선택=[A,B,A] 3분할 / 캐럿=[A,B] 2분할)
      const doSpeakerSwitch = useCallback(
        (sel: SpeakerSelection) => {
          const o = computeOffsets();
          if (!o || !speakers) return;
          const { speakerId: b, speakers: updated } = resolveSpeakerSelection(
            speakers,
            sel
          );
          const defs = updated !== speakers ? updated : undefined;
          const A = segment.speaker;
          if (o.isSelection) {
            onSplitSegment?.(
              segment.id,
              [o.boundaries[0], o.boundaries[1]],
              [A, b, A],
              defs
            );
          } else {
            onSplitSegment?.(segment.id, [o.boundaries[0]], [A, b], defs);
          }
          resetMenu();
        },
        [computeOffsets, speakers, onSplitSegment, segment.id, segment.speaker, resetMenu]
      );

      // 비언어 태그 추가 피커 열기 (캐럿 위치에 표시)
      const openNvAdd = useCallback(() => {
        saveSelection();
        setNvAdd({
          type: 'S',
          label: '',
          top: caretPos?.top ?? 0,
          left: caretPos?.left ?? 0,
        });
      }, [saveSelection, caretPos]);

      // 비언어 태그 삽입 확정
      const confirmNvAdd = useCallback(() => {
        if (!nvAdd || !editorRef.current) return;
        const raw = nvAdd.label.trim();
        let label: string;
        if (nvAdd.type === 'S') {
          // 침묵: 숫자(초)만 입력 → "침묵 N초"로 칩화
          const n = parseInt(raw, 10);
          label = Number.isFinite(n) && n > 0 ? `침묵 ${n}초` : '침묵';
        } else {
          label = raw;
          if (!label) {
            setNvAdd(null);
            return;
          }
        }
        const { nv: liveNv } = extractFromDom(
          editorRef.current,
          segment.nv,
          segment.deid,
          showDeid
        );
        const key = generateNvKey(liveNv ?? segment.nv, nvAdd.type);
        const chip = createNvChipElement(key, label);
        insertChipAtRange(chip, savedRangeRef.current, editorRef.current);
        savedRangeRef.current = null;
        setNvAdd(null);
        emitChanges();
      }, [nvAdd, segment.nv, segment.deid, showDeid, emitChanges]);

      // 비언어 태그 추가 피커 열리면 라벨 입력에 포커스
      useEffect(() => {
        if (nvAdd && nvLabelInputRef.current) {
          nvLabelInputRef.current.focus();
        }
      }, [nvAdd]);

      // 비언어 추가 피커: 바깥 클릭 시 닫기
      useEffect(() => {
        if (!nvAdd) return;
        const handler = (e: MouseEvent) => {
          if (
            nvAddRef.current &&
            !nvAddRef.current.contains(e.target as Node)
          ) {
            setNvAdd(null);
          }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
      }, [nvAdd]);

      // 화자 분리 목록: 바깥 클릭 시 닫기
      useEffect(() => {
        if (!speakerPick) return;
        const handler = (e: MouseEvent) => {
          if (
            speakerPickRef.current &&
            !speakerPickRef.current.contains(e.target as Node)
          ) {
            setSpeakerPick(null);
          }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
      }, [speakerPick]);

      // 한글 IME 조합 처리
      const handleCompositionStart = useCallback(() => {
        isComposingRef.current = true;
      }, []);

      const handleCompositionEnd = useCallback(() => {
        isComposingRef.current = false;
        emitChanges();
      }, [emitChanges]);

      // 붙여넣기: plain text만
      const handlePaste = useCallback((e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
      }, []);

      // Enter 키: 발화 분리(같은 화자, 캐럿 위치에서 2분할)
      // Shift+Enter: 줄바꿈. 연속 Enter로 여러 번 분리되는 건 쓰로틀(400ms)로 방지
      const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
          if (e.key !== 'Enter') return;
          // IME 조합 확정 Enter는 무시
          if (e.nativeEvent.isComposing || isComposingRef.current) return;
          e.preventDefault();
          // Shift+Enter: 줄바꿈
          if (e.shiftKey) {
            document.execCommand('insertLineBreak');
            return;
          }
          if (!canSplit) return;
          const now = e.timeStamp;
          if (now - lastSplitAtRef.current < 400) return;
          saveSelection(); // 현재 캐럿을 savedRangeRef에 반영
          // 맨 끝/맨 앞 등 분리가 no-op이면 remount(포커스 유실)만 남으므로 건너뜀
          if (!rangeCanSplit(savedRangeRef.current)) return;
          lastSplitAtRef.current = now;
          doSplitSame();
        },
        [canSplit, saveSelection, rangeCanSplit, doSplitSame]
      );

      // 칩 클릭 → 편집 팝오버 (이동 배치 모드면 클릭 위치로 칩 이동)
      const handleClick = useCallback(
        (e: React.MouseEvent) => {
          e.stopPropagation();
          if (!editorRef.current) return;

          if (placingChip) {
            const range = caretRangeAtPoint(e.clientX, e.clientY);
            if (
              range &&
              editorRef.current.contains(range.startContainer) &&
              !placingChip.contains(range.startContainer)
            ) {
              placingChip.remove();
              range.collapse(true);
              range.insertNode(placingChip);
            }
            setPlacingChip(null);
            emitChanges();
            return;
          }

          const target = e.target as HTMLElement;
          const chip = target.closest<HTMLSpanElement>('[data-chip]');
          if (!chip) return;

        const chipType = chip.dataset.chip as 'nv' | 'deid' | 'legacy-nv';
        const key =
          chipType === 'nv'
            ? chip.dataset.nvKey!
            : chipType === 'legacy-nv'
              ? `legacy_${chip.dataset.legacyTag}`
              : chip.dataset.deidKey!;
        const currentValue = chip.textContent || '';

        const editorRect = editorRef.current.getBoundingClientRect();
        const chipRect = chip.getBoundingClientRect();

        const popoverWidth = 200; // input(120) + label + delete + padding 추정
        let left = chipRect.left - editorRect.left;
        const maxLeft = editorRect.width - popoverWidth;
        if (left > maxLeft) left = Math.max(0, maxLeft);

        setChipEdit({
          key,
          type: chipType,
          value: currentValue,
          rect: {
            top: chipRect.bottom - editorRect.top + 4,
            left,
            width: Math.max(chipRect.width, 80),
          },
          chipEl: chip,
        });
        },
        [placingChip, emitChanges]
      );

      // 칩 편집 확인
      const handleChipEditConfirm = useCallback(() => {
        if (!chipEdit || !editorRef.current) return;

        const newValue = chipInputRef.current?.value.trim();
        if (!newValue) {
          setChipEdit(null);
          return;
        }

        // DOM 업데이트 (DOM 노드 참조 자체의 mutation, React state는 건드리지 않음)
        // eslint-disable-next-line react-hooks/immutability
        chipEdit.chipEl.textContent = newValue;
        setChipEdit(null);

        // 데이터 추출 및 전파
        emitChanges();
      }, [chipEdit, emitChanges]);

      // nv/legacy-nv 칩 삭제
      const handleChipDelete = useCallback(() => {
        if (
          !chipEdit ||
          (chipEdit.type !== 'nv' && chipEdit.type !== 'legacy-nv') ||
          !editorRef.current
        )
          return;

        // DOM에서 칩 제거
        chipEdit.chipEl.remove();
        setChipEdit(null);

        // 데이터 추출 및 전파 (칩이 제거된 DOM에서 추출하면 nv 키도 자동 누락)
        emitChanges();
      }, [chipEdit, emitChanges]);

      // 칩 이동: 배치 모드 진입 (다음 클릭 위치로 칩 노드 이동)
      const handleMoveChip = useCallback(() => {
        if (!chipEdit) return;
        setPlacingChip(chipEdit.chipEl);
        setChipEdit(null);
      }, [chipEdit]);

      // 칩 편집 input 키보드
      const handleChipInputKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleChipEditConfirm();
          }
          if (e.key === 'Escape') {
            setChipEdit(null);
          }
        },
        [handleChipEditConfirm]
      );

      // 칩 편집 팝오버 열리면 자동 포커스
      useEffect(() => {
        if (chipEdit && chipInputRef.current) {
          chipInputRef.current.focus();
          chipInputRef.current.select();
        }
      }, [chipEdit]);

      return (
        <div className="relative">
          <div
            ref={editorRef}
            role="textbox"
            tabIndex={0}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            onKeyUp={saveSelection}
            onMouseUp={saveSelection}
            onClick={handleClick}
            onBlur={() => {
              setCaretPos(null);
              setHasSelection(false);
            }}
            className={`m-0 w-full border-0 bg-transparent p-0 text-sm leading-relaxed text-grey-100 outline-none md:text-m ${
              isActive ? 'font-emphasize' : ''
            }`}
          />

          {/* 칩 편집 팝오버 */}
          {chipEdit && (
            <div
              className="absolute z-30 flex items-center gap-1 rounded-lg border border-grey-30 bg-white p-1.5 shadow-lg"
              style={{
                top: chipEdit.rect.top,
                left: chipEdit.rect.left,
              }}
            >
              <input
                ref={chipInputRef}
                type="text"
                defaultValue={chipEdit.value}
                onKeyDown={handleChipInputKeyDown}
                onBlur={handleChipEditConfirm}
                className="w-[120px] rounded border border-grey-30 bg-white px-2 py-1 text-sm text-fg outline-none focus:border-primary"
              />
              <span className="text-xs text-grey-60">
                {chipEdit.type === 'nv' || chipEdit.type === 'legacy-nv'
                  ? '비언어'
                  : '비식별화'}
              </span>
              {(chipEdit.type === 'nv' || chipEdit.type === 'legacy-nv') && (
                <>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleMoveChip}
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-grey-70 transition-colors hover:bg-grey-10"
                    aria-label="태그 이동"
                    title="이동"
                  >
                    <Move size={14} />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleChipDelete}
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-red-500 transition-colors hover:bg-red-50"
                    aria-label="태그 삭제"
                    title="삭제"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          )}

          {/* 이동 배치 안내 */}
          {placingChip && (
            <div className="mt-1 flex items-center gap-2 text-xs text-primary">
              <span>표시할 위치를 클릭하세요</span>
              <button
                type="button"
                onClick={() => setPlacingChip(null)}
                className="rounded px-1 text-grey-60 lg:hover:text-grey-100"
              >
                취소
              </button>
            </div>
          )}

          {/* 캐럿/선택 액션 메뉴 */}
          {caretPos &&
            !nvAdd &&
            !placingChip &&
            !speakerPick &&
            (!hasSelection || canSplit) && (
              <div
                className="absolute z-30 flex flex-col overflow-hidden rounded-lg border border-grey-30 bg-white text-xs shadow-md"
                style={{ top: caretPos.top + 6, left: caretPos.left }}
              >
                {!hasSelection && (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={openNvAdd}
                    className="whitespace-nowrap px-3 py-1.5 text-left text-grey-70 transition-colors lg:hover:bg-grey-10 lg:hover:text-grey-100"
                  >
                    비언어적 표현
                  </button>
                )}
                {canSplit && canSplitHere && (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() =>
                      setSpeakerPick({
                        customName: '',
                        top: caretPos.top,
                        left: caretPos.left,
                      })
                    }
                    className="whitespace-nowrap px-3 py-1.5 text-left text-grey-70 transition-colors lg:hover:bg-grey-10 lg:hover:text-grey-100"
                  >
                    화자 분리
                  </button>
                )}
              </div>
            )}

          {/* 화자 분리 인라인 목록 */}
          {speakerPick && !nvAdd && !placingChip && speakers && (
            <div
              ref={speakerPickRef}
              className="absolute z-30 flex max-h-[200px] flex-col overflow-y-auto rounded-lg border border-grey-30 bg-white text-xs shadow-lg"
              style={{ top: speakerPick.top + 6, left: speakerPick.left }}
            >
              {/* 본인(현재 세그먼트) 화자는 제외 — 같은 화자 분리는 Enter(발화 분리) */}
              {speakers
                .filter((s) => s.id !== segment.speaker)
                .map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() =>
                      doSpeakerSwitch({ kind: 'existing', id: s.id })
                    }
                    className="whitespace-nowrap px-3 py-1.5 text-left text-grey-70 transition-colors lg:hover:bg-grey-10 lg:hover:text-grey-100"
                  >
                    {getSpeakerDisplayName(s)}
                  </button>
                ))}
              <div className="flex items-center gap-1 border-t border-grey-20 px-2 py-1">
                <input
                  type="text"
                  value={speakerPick.customName}
                  onChange={(e) =>
                    setSpeakerPick((p) =>
                      p ? { ...p, customName: e.target.value } : p
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && speakerPick.customName.trim()) {
                      e.preventDefault();
                      doSpeakerSwitch({
                        kind: 'name',
                        name: speakerPick.customName,
                      });
                    }
                    if (e.key === 'Escape') setSpeakerPick(null);
                  }}
                  placeholder="직접 입력"
                  className="w-[84px] rounded border border-grey-30 bg-white px-2 py-1 text-xs text-fg outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() =>
                    speakerPick.customName.trim() &&
                    doSpeakerSwitch({
                      kind: 'name',
                      name: speakerPick.customName,
                    })
                  }
                  className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-fg lg:hover:opacity-80"
                >
                  추가
                </button>
              </div>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setSpeakerPick(null)}
                className="whitespace-nowrap px-3 py-1 text-left text-grey-60 transition-colors lg:hover:bg-grey-10"
              >
                취소
              </button>
            </div>
          )}

          {/* 비언어 태그 추가 피커 (캐럿 위치) */}
          {nvAdd && (
            <div
              ref={nvAddRef}
              className="absolute z-30 mt-1 flex flex-wrap items-center gap-1 rounded-lg border border-grey-30 bg-white p-2 shadow-lg"
              style={{ top: nvAdd.top + 8, left: Math.max(0, nvAdd.left) }}
            >
              {(['S', 'A'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() =>
                    setNvAdd((prev) =>
                      prev ? { ...prev, type: t, label: '' } : prev
                    )
                  }
                  className={`rounded border px-2 py-1 text-xs font-medium transition-colors ${
                    nvAdd.type === t
                      ? 'border-primary text-primary'
                      : 'border-grey-30 text-grey-70'
                  }`}
                >
                  {t === 'S' ? '침묵' : '행동'}
                </button>
              ))}
              <input
                ref={nvLabelInputRef}
                type="text"
                inputMode={nvAdd.type === 'S' ? 'numeric' : 'text'}
                value={nvAdd.label}
                onChange={(e) => {
                  const v =
                    nvAdd.type === 'S'
                      ? e.target.value.replace(/[^0-9]/g, '')
                      : e.target.value;
                  setNvAdd((prev) => (prev ? { ...prev, label: v } : prev));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    confirmNvAdd();
                  }
                  if (e.key === 'Escape') setNvAdd(null);
                }}
                placeholder={nvAdd.type === 'S' ? '초 (숫자)' : '예: 웃음'}
                className="w-[90px] rounded border border-grey-30 bg-white px-2 py-1 text-sm text-fg outline-none focus:border-primary"
              />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={confirmNvAdd}
                className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-fg lg:hover:opacity-80"
              >
                추가
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setNvAdd(null)}
                className="rounded px-1 py-1 text-xs text-grey-60 lg:hover:text-grey-100"
              >
                취소
              </button>
            </div>
          )}
        </div>
      );
    }
  );

SegmentContentEditor.displayName = 'SegmentContentEditor';
