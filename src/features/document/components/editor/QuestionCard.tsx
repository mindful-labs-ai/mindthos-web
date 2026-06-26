import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Copy, Trash2 } from 'lucide-react';

import { cn } from '@/lib/cn';
import { DragHandleIcon } from '@/shared/icons';

import type { FormField, FormFieldType } from '../../types';
import { FieldContent } from '../FieldContent';

import { FieldBody } from './FieldEditors';
import { QuestionTypeDropdown } from './QuestionTypeDropdown';

interface FieldCardProps {
  field: FormField;
  /** 활성(편집 중) 카드 — 초록 보더 */
  isActive: boolean;
  onActivate: () => void;
  /** 편집된 완성 필드 — 변형별 에디터(FieldBody)가 타입 안전하게 구성해 전달. */
  onChange: (updated: FormField) => void;
  /** 유형 변경 — 판별자 변경은 patch가 아니라 재구성이라 별도 경로. */
  onTypeChange: (type: FormFieldType) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

/**
 * 양식 필드 카드 — 셸(드래그·활성보더·하단 액션·비활성 미리보기)만 담당하고,
 * 활성 편집 본문은 유형별 에디터(FieldBody)에 위임한다. 9개 유형
 * (section/richtext/short/long/single/multiple/score/consent/signature) 편집.
 */
export function QuestionCard({
  field,
  isActive,
  onActivate,
  onChange,
  onTypeChange,
  onDuplicate,
  onDelete,
}: FieldCardProps) {
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
      <FieldBody field={field} onChange={onChange} />

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
        <QuestionTypeDropdown type={field.type} onChange={onTypeChange} />
      </div>
    </div>
  );
}
