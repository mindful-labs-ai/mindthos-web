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
        'flex h-[82px] items-center gap-3 rounded-lg bg-surface px-4 py-3',
        className
      )}
    >
      <div className="flex flex-shrink-0 items-center">
        {isMissingType ? (
          <StatusCircle tone="warning" symbol="exclaim" size={20} />
        ) : (
          <StatusCircle tone="success" symbol="check" size={20} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-fg">{file.fileName}</p>

        {/* 메타 줄 — 사이즈/페이지수 + 검사 종류 dropdown (상태 무관 항상 노출) */}
        <div className="typo-sm flex items-center gap-2 text-fg-muted">
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
        className="flex-shrink-0 p-1 text-fg-muted transition-colors lg:hover:text-fg"
        aria-label="파일 제거"
      >
        <XIcon size={16} />
      </button>
    </div>
  );
};
