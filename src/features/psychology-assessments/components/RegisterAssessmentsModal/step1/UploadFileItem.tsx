import { cn } from '@/lib/cn';
import { XIcon } from '@/shared/icons';

import { StatusCircle } from '../shared/StatusBadge';
import type { UploadedFile } from '../types';

import { AssessmentTypeDropdown } from './AssessmentTypeDropdown';

interface UploadFileItemProps {
  file: UploadedFile;
  onChangeType: (
    fileId: string,
    typeId: NonNullable<UploadedFile['assessmentType']>
  ) => void;
  onRemove: (fileId: string) => void;
  className?: string;
}

export const UploadFileItem = ({
  file,
  onChangeType,
  onRemove,
  className,
}: UploadFileItemProps) => {
  const isMissingType = file.status === 'missing-type';
  const hasSize = file.sizeMB > 0;
  const hasPageCount =
    file.pageCount !== undefined &&
    file.pageCount !== null &&
    file.pageCount > 0;

  return (
    <div
      className={cn(
        'relative flex items-center justify-between gap-5 rounded-xl bg-surface px-5 py-4',
        className
      )}
    >
      <div className="flex flex-shrink-0 items-center">
        {isMissingType ? (
          <StatusCircle tone="warning" symbol="exclaim" size={28} />
        ) : (
          <StatusCircle tone="success" symbol="check" size={28} />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="truncate text-l font-emphasize text-grey-100">
          {file.fileName}
        </p>

        {/* 메타 줄 — 사이즈/페이지수 + 검사 종류 dropdown (상태 무관 항상 노출) */}
        <div className="flex items-center gap-2 text-sm font-sub text-grey-80">
          {hasSize && (
            <>
              <span>{file.sizeMB.toFixed(1)}MB</span>
              <span>|</span>
            </>
          )}
          {hasPageCount && (
            <>
              <span>{file.pageCount}p</span>
              <span>|</span>
            </>
          )}
          <AssessmentTypeDropdown
            value={file.assessmentType}
            onChange={(typeId) => onChangeType(file.id, typeId)}
            emphasizeMissing={isMissingType}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => onRemove(file.id)}
        className="absolute right-3 top-2.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-grey-40 transition-colors lg:hover:bg-grey-20 lg:hover:text-grey-100"
        aria-label="파일 제거"
      >
        <XIcon size={24} />
      </button>
    </div>
  );
};
