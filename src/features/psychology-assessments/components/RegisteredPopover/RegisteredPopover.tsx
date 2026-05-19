import { useEffect, useMemo, useRef } from 'react';

import { cn } from '@/lib/cn';
import { useDevice } from '@/shared/hooks/useDevice';

import { PopoverEntryCard } from './PopoverEntryCard';
import { PopoverResetButton } from './PopoverResetButton';
import { PopoverSection } from './PopoverSection';
import type { RegisteredAssessmentEntry, TranscriptEntry } from './types';

interface RegisteredPopoverProps {
  open: boolean;
  onClose: () => void;
  /** chip 트리거 ref — 외부 클릭 시 트리거는 무시 */
  triggerRef?: React.RefObject<HTMLElement>;

  transcripts: TranscriptEntry[];
  assessments: RegisteredAssessmentEntry[];

  /** 선택된 ID set (assessment 기준) */
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;

  /** 초기화 버튼 클릭 (확인 모달 트리거) */
  onReset: () => void;

  className?: string;
}

export const RegisteredPopover = ({
  open,
  onClose,
  triggerRef,
  transcripts,
  assessments,
  selectedIds,
  onToggleSelect,
  onReset,
  className,
}: RegisteredPopoverProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;

  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (triggerRef?.current?.contains(target)) return;
      onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose, triggerRef]);

  // 라벨: 선택이 있으면 "선택 초기화", 없으면 "결과지 초기화"
  const resetLabel = useMemo(
    () => (selectedIds.size > 0 ? '문서 초기화' : '결과지 초기화'),
    [selectedIds.size]
  );

  if (!open) return null;

  const body = (
    <>
      {transcripts.length > 0 && (
        <PopoverSection title="축어록 및 분석">
          {transcripts.map((t) => (
            <PopoverEntryCard
              key={t.id}
              title={t.title}
              metaLabel={t.metaLabel}
              selected={selectedIds.has(t.id)}
              onToggle={() => onToggleSelect(t.id)}
            />
          ))}
        </PopoverSection>
      )}

      {assessments.length > 0 && (
        <PopoverSection title="심리검사 결과지">
          {assessments.map((a) => (
            <PopoverEntryCard
              key={a.id}
              title={a.fileName}
              metaLabel={`${a.testDate}  |  ${a.pageCount}p  |  ${a.categoryLabel}`}
              selected={selectedIds.has(a.id)}
              onToggle={() => onToggleSelect(a.id)}
            />
          ))}
        </PopoverSection>
      )}

      <PopoverResetButton label={resetLabel} onClick={onReset} />
    </>
  );

  // 모바일: 하단 시트 형태로 풀너비 노출 (overlay + slide up)
  if (isMobileView) {
    return (
      <div
        className="fixed inset-0 z-popover flex items-end bg-black/40"
        onClick={onClose}
      >
        <div
          ref={rootRef}
          className={cn(
            'flex max-h-[80vh] w-full flex-col gap-5 overflow-y-auto rounded-t-2xl bg-surface p-5',
            className
          )}
          role="dialog"
          onClick={(e) => e.stopPropagation()}
        >
          {body}
        </div>
      </div>
    );
  }

  // 데스크탑: chip 우하단 absolute popover
  return (
    <div
      ref={rootRef}
      className={cn(
        'absolute right-0 top-full z-popover mt-2 flex w-[320px] flex-col gap-5 rounded-2xl border border-grey-20 bg-surface p-5 shadow-elevated',
        className
      )}
      role="dialog"
    >
      {body}
    </div>
  );
};
