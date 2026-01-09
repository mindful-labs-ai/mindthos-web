import React from 'react';

import { Text } from '@/components/ui/atoms/Text';
import type { MultiFileInfo } from '@/feature/session/types';
import { cn } from '@/lib/cn';
import { XIcon } from '@/shared/icons';
import { formatDurationInTime, formatFileSize } from '@/shared/utils/format';

interface MobileFileItemProps {
  file: MultiFileInfo;
  onRemove: (fileId: string) => void;
}

// 원형 프로그레스 바 컴포넌트
const CircularProgress: React.FC<{
  progress: number;
  size?: number;
  strokeWidth?: number;
}> = ({ progress, size = 40, strokeWidth = 4 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      {/* 배경 원 */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-surface-strong"
      />
      {/* 진행 원 */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-primary transition-all duration-300"
      />
    </svg>
  );
};

const StatusIcon: React.FC<{ status: MultiFileInfo['validationStatus'] }> = ({
  status,
}) => {
  switch (status) {
    case 'pending':
      return <CircularProgress progress={30} size={40} strokeWidth={4} />;
    case 'valid':
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
          <svg
            width="16"
            height="16"
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
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-danger">
          <svg
            width="16"
            height="16"
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

export const MobileFileItem: React.FC<MobileFileItemProps> = ({
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
        'flex w-full items-center gap-3 overflow-hidden rounded-xl bg-surface px-4 py-4',
        isError && 'border border-red-300 bg-red-50'
      )}
    >
      <div className="flex-shrink-0">
        <StatusIcon status={file.validationStatus} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-fg">{file.name}</p>
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
        className="flex-shrink-0 p-2 text-fg-muted transition-colors hover:text-fg"
        aria-label="파일 제거"
      >
        <XIcon size={20} />
      </button>
    </div>
  );
};
