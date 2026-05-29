import { cn } from '@/lib/cn';

import type { UploadedFile, AssessmentTypeId } from '../types';

import { AddMoreButton } from './AddMoreButton';
import { UploadFileItem } from './UploadFileItem';

interface FileListViewProps {
  files: UploadedFile[];
  onChangeType: (fileId: string, typeId: AssessmentTypeId) => void;
  onRemove: (fileId: string) => void;
  onAddMore?: () => void;
  className?: string;
}

export const FileListView = ({
  files,
  onChangeType,
  onRemove,
  onAddMore,
  className,
}: FileListViewProps) => {
  return (
    <div
      className={cn(
        // 회색 박스 자체가 flex container — 내부 스크롤 영역과 추가 버튼을 묶음
        'flex flex-col rounded-xl bg-grey-20 p-4',
        className
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
        {files.map((file) => (
          <UploadFileItem
            key={file.id}
            file={file}
            onChangeType={onChangeType}
            onRemove={onRemove}
          />
        ))}
        <AddMoreButton onClick={onAddMore} />
      </div>
    </div>
  );
};
