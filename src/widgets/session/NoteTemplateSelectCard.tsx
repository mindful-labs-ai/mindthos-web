import { Check } from 'lucide-react';

import type { TemplateListItem } from '@/features/template/types';
import { cn } from '@/lib/cn';

interface NoteTemplateSelectCardProps {
  template: TemplateListItem;
  isSelected: boolean;
  /** 이미 이 양식으로 노트를 만든 경우 — 비활성 + '이미 생성된 노트' */
  isUsed: boolean;
  /** 축어록 없음 등 선택 불가 */
  disabled?: boolean;
  onSelect: (template: TemplateListItem) => void;
}

/**
 * 상담 기록 '빈 노트' 탭의 양식 선택 카드.
 * 양식 페이지 카드(별·기본노트 변경)와 달리 선택 체크 + 기본노트/이미생성 배지만 가진다.
 */
export function NoteTemplateSelectCard({
  template,
  isSelected,
  isUsed,
  disabled,
  onSelect,
}: NoteTemplateSelectCardProps) {
  const inactive = isUsed || disabled;

  return (
    <button
      type="button"
      disabled={inactive}
      onClick={() => onSelect(template)}
      aria-label={`${template.title} 노트 양식 ${isSelected ? '선택됨' : '선택하기'}`}
      className={cn(
        'relative h-[195px] w-full rounded-2xl border bg-white p-7 text-left transition-all',
        inactive
          ? 'cursor-not-allowed border-grey-40 opacity-60'
          : isSelected
            ? 'border-green-80 ring-1 ring-green-80'
            : 'border-grey-40 lg:hover:border-grey-60'
      )}
    >
      <h3 className="line-clamp-1 pr-8 text-l font-headline text-grey-100">
        {template.title}
      </h3>
      <p className="mt-4 line-clamp-3 text-m font-medium text-grey-100">
        {template.description}
      </p>

      {/* 좌하단: 이미 생성됨 / 기본 노트 배지 */}
      {isUsed ? (
        <span className="absolute bottom-6 left-7 inline-flex items-center rounded-lg bg-grey-20 px-[19px] py-1.5 text-m font-headline text-grey-60">
          이미 생성된 노트
        </span>
      ) : template.is_default ? (
        <span className="absolute bottom-6 left-7 inline-flex items-center rounded-lg bg-green-20 px-[19px] py-1.5 text-m font-headline text-green-80">
          기본 노트
        </span>
      ) : null}

      {/* 우하단: 선택 체크 (이미 생성된 노트는 숨김) */}
      {!isUsed && (
        <span
          className={cn(
            'absolute bottom-3 right-3 flex h-6 w-6 items-center justify-center rounded-full transition-colors',
            isSelected ? 'bg-green-80' : 'bg-grey-40'
          )}
        >
          <Check size={14} strokeWidth={3} className="text-white" />
        </span>
      )}
    </button>
  );
}
