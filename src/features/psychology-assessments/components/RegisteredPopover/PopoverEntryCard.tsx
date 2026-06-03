import { cn } from '@/lib/cn';

interface PopoverEntryCardProps {
  /** 1줄 제목 (e.g. 파일명 또는 축어록 이름) */
  title: string;
  /** 2줄 메타 (e.g. '2026.04.14  |  12p  |  다면적 인성검사') */
  metaLabel?: string;
  className?: string;
}

export const PopoverEntryCard = ({
  title,
  metaLabel,
  className,
}: PopoverEntryCardProps) => {
  return (
    <div
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-lg bg-grey-10 px-4 py-3',
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-m font-emphasize text-grey-100">
          {title}
        </span>
        {metaLabel && (
          <span className="truncate text-sm text-grey-70">{metaLabel}</span>
        )}
      </div>
    </div>
  );
};
