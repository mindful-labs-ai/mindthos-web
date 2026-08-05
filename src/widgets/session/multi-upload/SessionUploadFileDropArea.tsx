import React from 'react';

import type { MultiFileInfo } from '@/features/session/types';
import { cn } from '@/lib/cn';
import { getAcceptString, MULTI_UPLOAD_LIMITS } from '@/shared/constants/fileUpload';
import { CloudUploadIcon, SecurityShieldIcon } from '@/shared/icons';
import { Button } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Text';

import { MultiFileItem } from './MultiFileItem';

export const SessionUploadAiGuardNotice = ({
  className,
}: {
  className?: string;
}) => (
  <div
    className={cn(
      'flex flex-col items-center gap-3 rounded-lg bg-grey-100 py-5 text-center text-white',
      className
    )}
  >
    <SecurityShieldIcon size={32} className="text-white" />
    <p className="text-m font-emphasize">
      마음토스에 올리는 모든 내담자 정보는
      <br />
      철저하게 암호화되며 AI 학습에 이용되지 않아요.
    </p>
  </div>
);

interface SessionUploadFileDropAreaProps {
  files: MultiFileInfo[];
  isMobile: boolean;
  isTablet: boolean;
  isDragging: boolean;
  canAddMore: boolean;
  allowFileSelection?: boolean;
  maxFiles?: number;
  emptyStateHint?: React.ReactNode;
  emptyStateContent?: React.ReactNode;
  onFilesSelected?: (files: File[]) => void;
  onRemoveFile: (fileId: string) => void;
  onDragOver?: React.DragEventHandler<HTMLDivElement>;
  onDragLeave?: React.DragEventHandler<HTMLDivElement>;
  onDrop?: React.DragEventHandler<HTMLDivElement>;
}

/** 녹음 파일로 상담 기록 추가하기 모달과 튜토리얼이 공유하는 파일 박스 */
export const SessionUploadFileDropArea: React.FC<
  SessionUploadFileDropAreaProps
> = ({
  files,
  isMobile,
  isTablet,
  isDragging,
  canAddMore,
  allowFileSelection = true,
  maxFiles = MULTI_UPLOAD_LIMITS.MAX_FILES,
  emptyStateHint,
  emptyStateContent,
  onFilesSelected,
  onRemoveFile,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const canSelectFiles = allowFileSelection && Boolean(onFilesSelected);
  const canAddFile = canSelectFiles && canAddMore;

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      onFilesSelected?.(Array.from(selectedFiles).slice(0, maxFiles));
    }
    event.target.value = '';
  };

  return (
    <>
      {canSelectFiles && (
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptString('audio')}
          multiple={maxFiles > 1}
          onChange={handleFileInputChange}
          className="hidden"
        />
      )}
      <div
        onDragOver={canAddFile ? onDragOver : undefined}
        onDragLeave={canAddFile ? onDragLeave : undefined}
        onDrop={canAddFile ? onDrop : undefined}
        className={cn(
          'bg-surface-contrast p-4 transition-colors',
          isMobile && 'h-[28vh] min-h-[160px]',
          isTablet && 'h-[24vh] min-h-[160px]',
          !isMobile && !isTablet && 'h-[313px] rounded-lg',
          isDragging && canAddFile
            ? 'border-primary bg-primary-subtle'
            : 'border-surface-strong'
        )}
      >
        {files.length === 0 ? (
          <div
            className={cn(
              'flex h-full flex-col items-center justify-center gap-4 break-keep',
              !isMobile && !isTablet && 'min-h-[160px]'
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-contrast">
              <CloudUploadIcon className="h-6 w-6 text-fg-muted" />
            </div>
            <div className="space-y-2 text-center">
              <Text className="text-fg">
                {isMobile || isTablet
                  ? '오디오 파일을 추가해 주세요'
                  : '오디오 파일을 여기에 끌어다 놓으세요'}
              </Text>
              <Text className="text-fg-muted">
                {emptyStateHint ??
                  (canSelectFiles
                    ? `최대 ${MULTI_UPLOAD_LIMITS.MAX_FILES}개 파일`
                    : '준비된 파일을 바로 올려주세요')}
              </Text>
            </div>
            {canSelectFiles && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                + 파일 선택하기
              </Button>
            )}
            {emptyStateContent}
          </div>
        ) : (
          <div
            className={cn(
              'h-full w-full space-y-2 overflow-y-auto overscroll-contain',
              !isMobile && !isTablet && 'max-w-[488px]'
            )}
          >
            {files.map((file) => (
              <MultiFileItem
                key={file.id}
                file={file}
                onRemove={onRemoveFile}
              />
            ))}
            {canAddFile && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-[82px] w-full rounded-lg border-2 border-surface-strong text-center text-5xl font-thin text-fg-muted"
              >
                +
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};
