import { useEffect, useRef } from 'react';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Copy, Trash2, X } from 'lucide-react';

import { cn } from '@/lib/cn';
import { DragHandleIcon } from '@/shared/icons';

import { createOption } from '../../constants/formField';
import type { FormField, FormFieldOption } from '../../types';
import { FieldContent } from '../FieldContent';

import { ConsentEditor } from './ConsentEditor';
import { QuestionTypeDropdown } from './QuestionTypeDropdown';
import { ScoreRangeSelect } from './ScoreRangeSelect';

/** 점수 범위 전체 한계 — 1~10 */
const SCORE_LIMIT_MIN = 1;
const SCORE_LIMIT_MAX = 10;

/** from~to 정수 목록 */
function scoreRange(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

interface FieldCardProps {
  field: FormField;
  /** 활성(편집 중) 카드 — 초록 보더 */
  isActive: boolean;
  onActivate: () => void;
  onChange: (patch: Partial<FormField>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

/**
 * 양식 필드 카드 — 9개 유형(section/richtext/short/long/single/multiple/score/consent/signature)을 편집.
 * 활성(선택된) 항목만 입력 UI + 복제/삭제/유형 드롭다운을 보여주고,
 * 비활성 항목은 정적 콘텐츠로 표시 — 클릭하면 활성화된다.
 */
export function QuestionCard({
  field,
  isActive,
  onActivate,
  onChange,
  onDuplicate,
  onDelete,
}: FieldCardProps) {
  // 옵션 input Tab 이동/추가용 — 새로 만든 옵션은 렌더 후 포커스
  const optionInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pendingFocusIndex = useRef<number | null>(null);

  useEffect(() => {
    if (pendingFocusIndex.current !== null) {
      optionInputRefs.current[pendingFocusIndex.current]?.focus();
      pendingFocusIndex.current = null;
    }
  });

  // 항목 순서 변경(드래그) — 핸들에서만 시작
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.key });
  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const dragHandle = (
    <div className="mb-2 flex justify-center">
      <button
        type="button"
        aria-label="항목 순서 변경"
        className="cursor-grab touch-none px-3 py-1 text-grey-60 active:cursor-grabbing lg:hover:text-grey-80"
        {...attributes}
        {...listeners}
      >
        <DragHandleIcon size={18} />
      </button>
    </div>
  );

  if (!isActive) {
    return (
      <div
        ref={setNodeRef}
        style={sortableStyle}
        className={cn(
          'rounded-2xl border border-grey-40 bg-white p-4 lg:p-7',
          isDragging && 'relative z-50 opacity-50'
        )}
      >
        {dragHandle}
        <button
          type="button"
          onClick={onActivate}
          className="w-full text-left"
        >
          <FieldContent field={field} />
        </button>
      </div>
    );
  }

  // 선택형(single/multiple) 옵션 헬퍼 — value는 안정 식별자(유지), label만 편집
  const options: FormFieldOption[] =
    field.type === 'single' || field.type === 'multiple' ? field.options : [];

  const patchOptions = (next: FormFieldOption[]) => {
    onChange({ options: next } as Partial<FormField>);
  };

  const handleOptionLabelChange = (index: number, label: string) => {
    patchOptions(options.map((o, i) => (i === index ? { ...o, label } : o)));
  };

  const handleRemoveOption = (index: number) => {
    patchOptions(options.filter((_, i) => i !== index));
  };

  const handleAddOption = () => {
    patchOptions([...options, createOption()]);
  };

  // Tab: 다음 옵션으로 이동, 마지막 옵션이면 새 옵션 추가 후 이동
  const handleOptionKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key !== 'Tab' || e.shiftKey) return;
    e.preventDefault();
    if (index < options.length - 1) {
      optionInputRefs.current[index + 1]?.focus();
    } else {
      pendingFocusIndex.current = index + 1;
      handleAddOption();
    }
  };

  // 옵션 마커 — 단일 선택은 원형, 다중 선택은 사각(체크박스)
  const markerClass = `h-6 w-6 flex-shrink-0 border-2 border-grey-40 ${
    field.type === 'multiple' ? 'rounded-[4px]' : 'rounded-full'
  }`;

  // 상단 라벨 입력 — section은 title, richtext는 입력 없음, 그 외는 label
  const headerInput =
    field.type === 'richtext' ? null : (
      <input
        type="text"
        value={field.type === 'section' ? field.title : field.label}
        onChange={(e) =>
          onChange(
            field.type === 'section'
              ? ({ title: e.target.value } as Partial<FormField>)
              : ({ label: e.target.value } as Partial<FormField>)
          )
        }
        placeholder={field.type === 'section' ? '제목' : '질문'}
        aria-label="질문 입력"
        className="h-[41px] w-full rounded-lg bg-grey-20 px-3 text-xl font-emphasize text-grey-100 placeholder:text-grey-80 focus:outline-none"
      />
    );

  return (
    <div
      ref={setNodeRef}
      style={sortableStyle}
      onFocusCapture={onActivate}
      className={cn(
        'rounded-2xl border border-green-80 bg-white p-4 lg:p-7',
        isDragging && 'relative z-50 opacity-50'
      )}
    >
      {dragHandle}
      {headerInput}

      {/* 본문 — 선택형(단일/다중) */}
      {(field.type === 'single' || field.type === 'multiple') && (
        <div className="mt-5 flex flex-col gap-3">
          {options.map((option, i) => (
            <div key={option.value} className="flex items-center gap-3">
              <span className={markerClass} />
              <input
                ref={(el) => {
                  optionInputRefs.current[i] = el;
                }}
                type="text"
                value={option.label}
                onChange={(e) => handleOptionLabelChange(i, e.target.value)}
                onKeyDown={(e) => handleOptionKeyDown(e, i)}
                placeholder={`옵션 ${i + 1}`}
                aria-label={`옵션 ${i + 1}`}
                className="h-[34px] min-w-0 flex-1 rounded-lg bg-grey-20 px-3 text-m font-medium text-grey-100 placeholder:text-grey-80 focus:outline-none"
              />
              {/* 첫 옵션은 삭제 불가 — X 자리 비움 */}
              {i > 0 ? (
                <button
                  type="button"
                  aria-label={`옵션 ${i + 1} 삭제`}
                  onClick={() => handleRemoveOption(i)}
                  className="flex-shrink-0 text-grey-80 transition-colors lg:hover:text-grey-100"
                >
                  <X size={24} />
                </button>
              ) : (
                <span className="w-6 flex-shrink-0" />
              )}
            </div>
          ))}

          {/* 옵션 추가 */}
          <div className="ml-9 flex items-center gap-3 text-m font-medium">
            <button
              type="button"
              onClick={handleAddOption}
              className="text-green-80 transition-opacity lg:hover:opacity-80"
            >
              옵션 추가
            </button>
          </div>
        </div>
      )}

      {/* 본문 — 단답형/장문형: 응답 자리 미리보기 */}
      {field.type === 'short' && (
        <div className="mt-5 flex h-[34px] items-center rounded-lg bg-grey-20 px-3 text-m font-medium text-grey-80">
          답변
        </div>
      )}

      {field.type === 'long' && (
        <div className="mt-5 h-[100px] rounded-lg bg-grey-20 px-3 py-[5px] text-m font-medium text-grey-80">
          답변
        </div>
      )}

      {/* 본문 — 점수: 범위 선택 + 최소/최대 라벨 */}
      {field.type === 'score' && (
        <div className="mt-5 flex flex-col gap-3">
          {/* 범위 — 1~10 드롭다운, 최소<최대가 되도록 선택지 제한 */}
          <div className="flex items-center gap-6">
            <ScoreRangeSelect
              value={field.min}
              options={scoreRange(SCORE_LIMIT_MIN, field.max - 1)}
              ariaLabel="점수 최소값"
              onChange={(min) => onChange({ min } as Partial<FormField>)}
            />
            <span className="text-xl font-medium text-grey-100">~</span>
            <ScoreRangeSelect
              value={field.max}
              options={scoreRange(field.min + 1, SCORE_LIMIT_MAX)}
              ariaLabel="점수 최대값"
              onChange={(max) => onChange({ max } as Partial<FormField>)}
            />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <span className="h-6 w-6 flex-shrink-0 rounded-full border-2 border-grey-40" />
            <span className="w-7 flex-shrink-0 text-center text-xl font-medium text-grey-100">
              {field.min}
            </span>
            <input
              type="text"
              value={field.minLabel ?? ''}
              onChange={(e) =>
                onChange({ minLabel: e.target.value } as Partial<FormField>)
              }
              placeholder="라벨 (선택 사항)"
              aria-label="점수 최소값 라벨"
              className="h-[34px] min-w-0 flex-1 rounded-lg bg-grey-20 px-2 text-m font-medium text-grey-100 placeholder:text-grey-80 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="h-6 w-6 flex-shrink-0 rounded-full border-2 border-grey-40" />
            <span className="w-7 flex-shrink-0 text-center text-xl font-medium text-grey-100">
              {field.max}
            </span>
            <input
              type="text"
              value={field.maxLabel ?? ''}
              onChange={(e) =>
                onChange({ maxLabel: e.target.value } as Partial<FormField>)
              }
              placeholder="라벨 (선택 사항)"
              aria-label="점수 최대값 라벨"
              className="h-[34px] min-w-0 flex-1 rounded-lg bg-grey-20 px-2 text-m font-medium text-grey-100 placeholder:text-grey-80 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* 본문 — 제목 및 설명 */}
      {field.type === 'section' && (
        <textarea
          value={field.description ?? ''}
          onChange={(e) =>
            onChange({ description: e.target.value } as Partial<FormField>)
          }
          placeholder="설명"
          aria-label="설명 입력"
          className="mt-5 block h-[100px] w-full resize-none rounded-lg bg-grey-20 px-3 py-[5px] text-m font-medium text-grey-100 placeholder:text-grey-80 focus:outline-none"
        />
      )}

      {/* 본문 — 안내문(리치 HTML): 기존 동의서 에디터 재사용 */}
      {field.type === 'richtext' && (
        <ConsentEditor
          key={field.key}
          initialHtml={field.html || undefined}
          onContentChange={(html) =>
            onChange({ html } as Partial<FormField>)
          }
        />
      )}

      {/* 본문 — 동의 항목: 민감정보(개보법 §23) 토글 */}
      {field.type === 'consent' && (
        <label className="mt-5 flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={field.sensitive}
            onChange={(e) =>
              onChange({ sensitive: e.target.checked } as Partial<FormField>)
            }
            className="h-5 w-5 flex-shrink-0 accent-green-80"
          />
          <span className="text-m font-medium text-grey-100">
            민감정보 동의 항목 (개인정보 보호법 별도 동의)
          </span>
        </label>
      )}

      {/* 본문 — 서명: 안내 문구(선택 사항) */}
      {field.type === 'signature' && (
        <input
          type="text"
          value={field.helpText ?? ''}
          onChange={(e) =>
            onChange({ helpText: e.target.value } as Partial<FormField>)
          }
          placeholder="안내 문구 (선택 사항)"
          aria-label="서명 안내 문구"
          className="mt-5 h-[34px] w-full rounded-lg bg-grey-20 px-3 text-m font-medium text-grey-100 placeholder:text-grey-80 focus:outline-none"
        />
      )}

      {/* 하단 액션: 복제 · 삭제 · 유형 드롭다운 */}
      <div className="mt-6 flex flex-wrap items-center justify-end gap-4 lg:gap-10">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={onDuplicate}
            className="flex items-center gap-1 text-m font-medium text-grey-80 transition-colors lg:hover:text-grey-100"
          >
            <Copy size={20} />
            복제
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-1 text-m font-medium text-grey-80 transition-colors lg:hover:text-grey-100"
          >
            <Trash2 size={20} />
            삭제
          </button>
        </div>
        <QuestionTypeDropdown
          type={field.type}
          onChange={(type) => onChange({ type } as Partial<FormField>)}
        />
      </div>
    </div>
  );
}
