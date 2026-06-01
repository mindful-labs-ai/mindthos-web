import { cn } from '@/lib/cn';

import { formatAssessmentDisplayText } from '../../utils/assessmentDisplay';
import { StatusCircle } from '../RegisterAssessmentsModal/shared/StatusBadge';

interface PopoverEntryCardProps {
  /** 1줄 제목 (e.g. 파일명 또는 축어록 이름) */
  title: string;
  /** 2줄 메타 (e.g. '2026.04.14  |  12p  |  다면적 인성검사') */
  metaLabel?: string;
  /** 토글 가능 시 우측 체크 표시 */
  selected?: boolean;
  onToggle?: () => void;
  className?: string;
}

export const PopoverEntryCard = ({
  title,
  metaLabel,
  selected,
  onToggle,
  className,
}: PopoverEntryCardProps) => {
  const interactive = !!onToggle;

  const inner = (
    <>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-m font-emphasize text-grey-100">
          {formatAssessmentDisplayText(title)}
        </span>
        {metaLabel && (
          <span className="truncate text-sm text-grey-70">
            {formatAssessmentDisplayText(metaLabel)}
          </span>
        )}
      </div>
      {interactive && selected && (
        <StatusCircle tone="success" symbol="check" size={20} />
      )}
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'flex w-full items-center justify-between gap-3 rounded-md bg-grey-20 px-4 py-3 text-left transition-colors lg:hover:opacity-90',
          selected && 'bg-grey-30',
          className
        )}
      >
        {inner}
      </button>
    );
  }

  return (
    <div
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-lg bg-grey-10 px-4 py-3',
        className
      )}
    >
      {inner}
    </div>
  );
};
