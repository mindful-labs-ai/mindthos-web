import { cn } from '@/lib/cn';
import { XIcon } from '@/shared/icons';

export interface AssessmentFile {
  id: string;
  /** 검사 종류 라벨 (e.g. '다면적 인성 검사') */
  title: string;
  /** 실제 파일명 */
  fileName: string;
}

interface AssessmentFileItemProps {
  file: AssessmentFile;
  onRemove?: (id: string) => void;
  className?: string;
}

export const AssessmentFileItem = ({
  file,
  onRemove,
  className,
}: AssessmentFileItemProps) => {
  return (
    <div
      className={cn(
        'relative flex items-center justify-between gap-3 rounded-lg border border-grey-40 bg-white px-5 py-3.5',
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-m font-emphasize text-grey-100">
          {file.title}
        </span>
        <span className="truncate text-sm text-grey-60">{file.fileName}</span>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(file.id)}
          className="absolute right-2 top-2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-grey-40 transition-colors lg:hover:bg-grey-10 lg:hover:text-grey-100"
          aria-label="결과지 삭제"
        >
          <XIcon size={24} />
        </button>
      )}
    </div>
  );
};
