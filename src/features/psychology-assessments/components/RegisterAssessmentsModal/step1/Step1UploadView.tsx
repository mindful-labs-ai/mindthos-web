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
  onChangeType,
  onRemove,
  className,
}: Step1UploadViewProps) => {
  return (
    <div className={cn('flex h-full min-h-0 flex-col gap-4', className)}>
      {substate === 'empty' && (
        <>
          <SecurityNotice />
          <UploadDropzone onSelectFiles={onSelectFiles} />
        </>
      )}

      {substate === 'reviewing' && (
        <UploadingProgress
          percent={reviewingPercent}
          className="flex-1"
        />
      )}

      {substate === 'list' && (
        <FileListView
          files={files}
          onChangeType={onChangeType}
          onRemove={onRemove}
          onAddMore={onAddMore}
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
