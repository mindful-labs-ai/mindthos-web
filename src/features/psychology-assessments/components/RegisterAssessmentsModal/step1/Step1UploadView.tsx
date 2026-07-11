import { useRef, useState, type DragEvent } from 'react';

import { cn } from '@/lib/cn';

import type { AssessmentTypeId, UploadedFile } from '../types';

import { FileCountIndicator } from './FileCountIndicator';
import { FileListView } from './FileListView';
import { SecurityNotice } from './SecurityNotice';
import { UploadDropzone } from './UploadDropzone';
import { UploadingProgress } from './UploadingProgress';

export type Step1Substate = 'empty' | 'reviewing' | 'list';

interface Step1UploadViewProps {
  substate: Step1Substate;
  files: UploadedFile[];
  /** reviewing 상태일 때 진행률 (0~100) */
  reviewingPercent?: number;
  onSelectFiles?: () => void;
  onAddMore?: () => void;
  onDropFiles?: (files: FileList) => void;
  onChangeType: (fileId: string, typeId: AssessmentTypeId) => void;
  onRemove: (fileId: string) => void;
  className?: string;
}

export const Step1UploadView = ({
  substate,
  files,
  reviewingPercent = 0,
  onSelectFiles,
  onAddMore,
  onDropFiles,
  onChangeType,
  onRemove,
  className,
}: Step1UploadViewProps) => {
  const dragDepthRef = useRef(0);
  const [dragActive, setDragActive] = useState(false);
  const dropEnabled = substate !== 'reviewing' && onDropFiles !== undefined;

  const hasDraggedFiles = (event: DragEvent<HTMLDivElement>) =>
    Array.from(event.dataTransfer.types).includes('Files');

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    if (!hasDraggedFiles(event)) return;
    event.preventDefault();
    if (!dropEnabled) return;
    dragDepthRef.current += 1;
    setDragActive(true);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!hasDraggedFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = dropEnabled ? 'copy' : 'none';
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!hasDraggedFiles(event)) return;
    event.preventDefault();
    if (!dropEnabled) return;
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setDragActive(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!hasDraggedFiles(event)) return;
    event.preventDefault();
    dragDepthRef.current = 0;
    setDragActive(false);
    if (dropEnabled && event.dataTransfer.files.length > 0) {
      onDropFiles(event.dataTransfer.files);
    }
  };

  return (
    <div
      className={cn('flex h-full min-h-0 flex-col gap-4', className)}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <SecurityNotice className="shrink-0" />

      {substate === 'empty' && (
        <UploadDropzone onSelectFiles={onSelectFiles} dragActive={dragActive} />
      )}

      {substate === 'reviewing' && (
        <UploadingProgress percent={reviewingPercent} className="flex-1" />
      )}

      {substate === 'list' && (
        <FileListView
          files={files}
          onChangeType={onChangeType}
          onRemove={onRemove}
          onAddMore={onAddMore}
          dragActive={dragActive}
          className="min-h-0 flex-1"
        />
      )}

      {/* 인디케이터는 스크롤 영역 바깥에 고정 — list 박스 아래에 항상 자리 */}
      {substate !== 'reviewing' && (
        <FileCountIndicator count={files.length} className="mt-auto pt-1" />
      )}
    </div>
  );
};
