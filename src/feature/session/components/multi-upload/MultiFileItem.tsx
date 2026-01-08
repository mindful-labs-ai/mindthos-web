import React from 'react';

import { Text } from '@/components/ui/atoms/Text';
import { cn } from '@/lib/cn';
import { XIcon } from '@/shared/icons';
import { formatDurationInTime, formatFileSize } from '@/shared/utils/format';

import type { MultiFileInfo } from '../../types';

interface MultiFileItemProps {
  file: MultiFileInfo;
  onRemove: (fileId: string) => void;
}

const StatusIcon: React.FC<{ status: MultiFileInfo['validationStatus'] }> = ({
  status,
}) => {
  switch (status) {
    case 'pending':
      return (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      );
    case 'valid':
      return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
          <svg
            width="12"
            height="12"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.6666 3.5L5.24998 9.91667L2.33331 7"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );
    case 'invalid_type':
    case 'size_exceeded':
      return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-danger">
          <svg
            width="12"
            height="12"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7 4V7.5M7 10V10.01"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );
    default:
      return null;
  }
};

export const MultiFileItem: React.FC<MultiFileItemProps> = ({
  file,
  onRemove,
}) => {
  const isError =
    file.validationStatus === 'invalid_type' ||
    file.validationStatus === 'size_exceeded';
  const isPending = file.validationStatus === 'pending';

  return (
    <div
      className={cn(
        'flex h-[82px] max-w-[440px] items-center gap-3 rounded-lg bg-surface px-4 py-3'
      )}
    >
      <StatusIcon status={file.validationStatus} />

      <div className="min-w-0 flex-1">
        <Text className="truncate font-medium text-fg">{file.name}</Text>
        {isPending ? (
          <Text className="text-sm text-fg-muted">파일 업로드 중</Text>
        ) : isError ? (
          <Text className="text-sm text-red-500">{file.errorMessage}</Text>
        ) : (
          <Text className="text-sm text-fg-muted">
            {formatFileSize(file.size)}
            {file.duration !== undefined && (
              <> | {formatDurationInTime(file.duration)}</>
            )}
          </Text>
        )}
      </div>

      <button
        type="button"
        onClick={() => onRemove(file.id)}
        className="flex-shrink-0 p-1 text-fg-muted transition-colors hover:text-fg"
        aria-label="파일 제거"
      >
        <XIcon size={16} />
      </button>
    </div>
  );
};
