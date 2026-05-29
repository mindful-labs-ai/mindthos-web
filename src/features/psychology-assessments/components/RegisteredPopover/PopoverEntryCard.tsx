import { cn } from '@/lib/cn';
import { XIcon } from '@/shared/icons';

import { StatusCircle } from '../RegisterAssessmentsModal/shared/StatusBadge';

interface PopoverEntryCardProps {
  /** 1줄 제목 (e.g. 파일명 또는 축어록 이름) */
  title: string;
  /** 2줄 메타 (e.g. '2026.04.14  |  12p  |  다면적 인성검사') */
  metaLabel?: string;
  /** 토글 가능 시 우측 체크 표시 */
  selected?: boolean;
  onToggle?: () => void;
  /** 우측 삭제(X) 버튼. 있으면 서버 DELETE 트리거. */
  onDelete?: () => void;
  /** 삭제 진행 중 (버튼 비활성) */
  deleting?: boolean;
  className?: string;
}

export const PopoverEntryCard = ({
  title,
  metaLabel,
  selected,
  onToggle,
  onDelete,
  deleting,
  className,
}: PopoverEntryCardProps) => {
  // onDelete가 있으면 카드를 div로 구성(버튼 중첩 회피) + 삭제 버튼 별도 노출.
  if (onDelete) {
    return (
      <div
        className={cn(
          'flex w-full items-center justify-between gap-3 rounded-md bg-grey-20 px-4 py-3',
          className
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-m font-emphasize text-grey-100">
            {title}
          </span>
          {metaLabel && (
            <span className="truncate text-sm text-grey-70">{metaLabel}</span>
          )}
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          aria-label="결과지 삭제"
          className="flex-shrink-0 text-grey-70 transition-colors disabled:opacity-40 lg:hover:text-grey-100"
        >
          <XIcon size={20} />
        </button>
      </div>
    );
  }

  const interactive = !!onToggle;

  const inner = (
    <>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-m font-emphasize text-grey-100">
          {title}
        </span>
        {metaLabel && (
          <span className="truncate text-sm text-grey-70">{metaLabel}</span>
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
