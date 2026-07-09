/**
 * contentEditable 기반 세그먼트 편집기
 * nv/deid 태그를 인라인 칩으로 렌더하고, 칩 클릭 시 라벨 편집 가능
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Move, Plus, Trash2 } from 'lucide-react';

import type { TranscribeSegment } from '@/features/session/types';
import { generateNvKey } from '@/features/session/utils/contentsEditor';

// ── 칩 스타일 ──

const NV_CHIP_STYLES: Record<string, string> = {
  S: 'bg-gray-100 text-gray-700 border-gray-300', // 침묵 - 회색
  A: 'bg-blue-100 text-blue-700 border-blue-300',
  E: 'bg-amber-100 text-amber-700 border-amber-300',
};

const DEID_CHIP_STYLE = 'bg-orange-100/10 text-orange-100 border-orange-100/30';
const DEID_INLINE_STYLE =
  'border-b border-dashed border-orange-100/50 text-orange-100';

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
    const nvMap = new Map<string, string>();
    for (const entry of nv) {
      const colonIdx = entry.indexOf(':');
      if (colonIdx !== -1) {
        nvMap.set(entry.slice(0, colonIdx), entry.slice(colonIdx + 1));
      }
    }
    html = html.replace(/⟪nv:([^⟫]+)⟫/g, (_, key) => {
      const label = nvMap.get(key) || key;
      // 접두: e→감정(E), s→침묵(S), 그 외→액션(A) (뷰 렌더와 동일 매핑)
      const tagType = key.startsWith('e')
        ? 'E'
        : key.startsWith('s')
          ? 'S'
          : 'A';
      const style = NV_CHIP_STYLES[tagType] || NV_CHIP_STYLES.A;
      return `<span data-chip="nv" data-nv-key="${escapeHtml(key)}" data-tag-type="${tagType}" contenteditable="false" class="mx-0.5 inline-flex cursor-pointer items-center rounded-md border px-1.5 py-0.5 align-middle text-xs font-medium ${style}">${escapeHtml(label)}</span>`;
    });
  }

  // 레거시 nv 태그 (gemini-3) → 칩: {%A%한숨%}, {%E%화남%}, {%S%}, {%O%}
  const LEGACY_TAG_LABELS: Record<string, string> = { S: '침묵', O: '겹침' };
  html = html.replace(
    /\{%([SAEO])%(?:([^%]+)%)?}/g,
    (_, tagType: string, content?: string) => {
      const label = content || LEGACY_TAG_LABELS[tagType] || '';
      if (!label) return '';
      const chipTagType = tagType === 'E' ? 'E' : 'A';
      const style = NV_CHIP_STYLES[chipTagType] || NV_CHIP_STYLES.A;
      return `<span data-chip="legacy-nv" data-legacy-tag="${tagType}" contenteditable="false" class="mx-0.5 inline-flex cursor-pointer items-center rounded-md border px-1.5 py-0.5 align-middle text-xs font-medium ${style}">${escapeHtml(label)}</span>`;
    }
  );

  // deid 태그
  if (deid) {
    html = html.replace(/⟪deid:(\w+)\|([^⟫]+)⟫/g, (_, key, original) => {
      if (showDeid) {
        // ON: 라벨 칩 (contenteditable=false, 클릭으로 편집)
        const label = deid[key] || key;
        return `<span data-chip="deid" data-deid-key="${escapeHtml(key)}" data-deid-original="${escapeHtml(original)}" contenteditable="false" class="mx-0.5 inline-flex cursor-pointer items-center rounded-md border px-1.5 py-0.5 align-middle text-xs font-headline ${DEID_CHIP_STYLE}">${escapeHtml(label)}</span>`;
      } else {
        // OFF: 원본 텍스트 인라인 편집 가능
        return `<span data-deid-key="${escapeHtml(key)}" data-deid-inline="" class="${DEID_INLINE_STYLE}">${escapeHtml(original)}</span>`;
      }
    });
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
      text += `⟪nv:${key}⟫`;
      nvUpdates.set(key, label);
      return;
    }

    if (el.dataset.chip === 'legacy-nv') {
      const tagType = el.dataset.legacyTag || 'A';
      const label = el.textContent || '';
      // S, O는 내용 없는 형태, A/E는 내용 있는 형태로 복원
      if (
        (tagType === 'S' || tagType === 'O') &&
        (label === '침묵' || label === '겹침')
      ) {
        text += `{%${tagType}%}`;
      } else {
        text += `{%${tagType}%${label}%}`;
      }
      return;
    }

    if (el.dataset.chip === 'deid') {
      // ON 모드 칩
      const key = el.dataset.deidKey!;
      const original = el.dataset.deidOriginal || '';
      const label = el.textContent || '';
      text += `⟪deid:${key}|${original}⟫`;
      deidMapUpdates[key] = label;
      return;
    }

    if (el.dataset.deidInline !== undefined) {
      // OFF 모드 인라인 - textContent가 수정된 원본
      const key = el.dataset.deidKey!;
      const newOriginal = el.textContent || '';
      text += `⟪deid:${key}|${newOriginal}⟫`;
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
    }) => {
      const editorRef = useRef<HTMLDivElement>(null);
      const isComposingRef = useRef(false);
      const initializedRef = useRef(false);
      const [chipEdit, setChipEdit] = useState<ChipEditState | null>(null);
      const chipInputRef = useRef<HTMLInputElement>(null);
      // 비언어 태그 삽입/이동
      const savedRangeRef = useRef<Range | null>(null);
      const nvLabelInputRef = useRef<HTMLInputElement>(null);
      const [nvAdd, setNvAdd] = useState<{
        type: 'S' | 'E' | 'A';
        label: string;
      } | null>(null);
      const [placingChip, setPlacingChip] = useState<HTMLSpanElement | null>(
        null
      );

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

      // 편집기 내 캐럿 위치 저장 (비언어 삽입 위치용)
      const saveSelection = useCallback(() => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && editorRef.current) {
          const range = sel.getRangeAt(0);
          if (editorRef.current.contains(range.commonAncestorContainer)) {
            savedRangeRef.current = range.cloneRange();
          }
        }
      }, []);

      // 비언어 태그 추가 피커 열기 (현재 캐럿 저장)
      const openNvAdd = useCallback(() => {
        saveSelection();
        setNvAdd({ type: 'S', label: '' });
      }, [saveSelection]);

      // 비언어 태그 삽입 확정
      const confirmNvAdd = useCallback(() => {
        if (!nvAdd || !editorRef.current) return;
        const label = nvAdd.label.trim() || (nvAdd.type === 'S' ? '침묵' : '');
        if (!label) {
          setNvAdd(null);
          return;
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

      // Enter 키: <br> 삽입 통일
      const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          document.execCommand('insertLineBreak');
        }
      }, []);

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
            className={`m-0 w-full border-0 bg-transparent p-0 text-sm leading-relaxed text-grey-100 outline-none md:text-m ${
              isActive ? 'font-emphasize' : ''
            }`}
          />

          {/* 칩 편집 팝오버 */}
          {chipEdit && (
            <div
              className="absolute z-20 flex items-center gap-1 rounded-lg border border-grey-30 bg-white p-1.5 shadow-lg"
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

          {/* 비언어 태그 추가 / 이동 배치 안내 */}
          {placingChip ? (
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
          ) : (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={openNvAdd}
              className="mt-1 inline-flex items-center gap-0.5 rounded-md border border-grey-30 px-2 py-0.5 text-xs text-grey-70 transition-colors lg:hover:bg-grey-10 lg:hover:text-grey-100"
            >
              <Plus size={12} /> 비언어
            </button>
          )}

          {/* 비언어 태그 추가 피커 */}
          {nvAdd && (
            <div className="absolute left-0 top-full z-20 mt-1 flex flex-wrap items-center gap-1 rounded-lg border border-grey-30 bg-white p-2 shadow-lg">
              {(['S', 'E', 'A'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setNvAdd((prev) => (prev ? { ...prev, type: t } : prev))}
                  className={`rounded border px-2 py-1 text-xs font-medium transition-colors ${
                    nvAdd.type === t
                      ? 'border-primary text-primary'
                      : 'border-grey-30 text-grey-70'
                  }`}
                >
                  {t === 'S' ? '침묵' : t === 'E' ? '감정' : '행동'}
                </button>
              ))}
              <input
                ref={nvLabelInputRef}
                type="text"
                value={nvAdd.label}
                onChange={(e) =>
                  setNvAdd((prev) => (prev ? { ...prev, label: e.target.value } : prev))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    confirmNvAdd();
                  }
                  if (e.key === 'Escape') setNvAdd(null);
                }}
                placeholder={nvAdd.type === 'S' ? '침묵(기본)' : '예: 한숨'}
                className="w-[100px] rounded border border-grey-30 bg-white px-2 py-1 text-sm text-fg outline-none focus:border-primary"
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
