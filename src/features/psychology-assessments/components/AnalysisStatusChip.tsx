import { forwardRef } from 'react';

import { cn } from '@/lib/cn';
import { AnalysisStatusIcon } from '@/shared/icons';

export type AnalysisStatus =
  | 'no_assessments'
  | 'no_analysis'
  | 'analyzing'
  | 'analyzed';

interface AnalysisStatusChipProps {
  status: AnalysisStatus;
  /** analyzed 상태에서 표시할 결과지 개수 */
  fileCount?: number;
  /** 제공 시 클릭 가능한 button으로 렌더 */
  onClick?: () => void;
  /** popover open 상태 표시 (hover 강조) */
  active?: boolean;
  className?: string;
}

const STATIC_LABEL: Record<Exclude<AnalysisStatus, 'analyzed'>, string> = {
  no_assessments: '결과지 미등록',
  no_analysis: '분석 전',
  analyzing: '분석 중',
};

export const AnalysisStatusChip = forwardRef<
  HTMLButtonElement | HTMLSpanElement,
  AnalysisStatusChipProps
>(({ status, fileCount = 0, onClick, active, className }, ref) => {
  const label =
    status === 'analyzed' ? `${fileCount}개 결과지 등록` : STATIC_LABEL[status];

  const baseClass =
    'inline-flex items-center gap-2 rounded-md border border-grey-40 bg-grey-20 px-3 py-2 text-m font-medium';

  if (onClick) {
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        onClick={onClick}
        className={cn(
          baseClass,
          'text-grey-100 transition-colors lg:hover:bg-grey-10',
          active && 'bg-grey-10',
          status === 'analyzed' || 'text-grey-80',
          className
        )}
      >
        <AnalysisStatusIcon className="text-grey-60" size={24} />
        {label}
      </button>
    );
  }

  return (
    <span
      ref={ref as React.Ref<HTMLSpanElement>}
      className={cn(baseClass, className, 'text-grey-80')}
    >
      <AnalysisStatusIcon className="text-grey-60" size={24} />
      {label}
    </span>
  );
});

AnalysisStatusChip.displayName = 'AnalysisStatusChip';
