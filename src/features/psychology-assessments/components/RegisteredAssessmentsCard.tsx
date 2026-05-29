import { cn } from '@/lib/cn';

import { AddAssessmentButton } from './AddAssessmentButton';
import { AssessmentFileItem, type AssessmentFile } from './AssessmentFileItem';

interface RegisteredAssessmentsCardProps {
  files: AssessmentFile[];
  /** 콜백 제공 시 카드 하단에 + 추가 버튼 노출 (단, files.length < maxFiles일 때만) */
  onAddFile?: () => void;
  onRemoveFile?: (id: string) => void;
  /** 최대 등록 가능 개수 — 도달 시 + 버튼 자동 숨김 (default 3) */
  maxFiles?: number;
  className?: string;
}

export const RegisteredAssessmentsCard = ({
  files,
  onAddFile,
  onRemoveFile,
  maxFiles = 3,
  className,
}: RegisteredAssessmentsCardProps) => {
  const canAdd = !!onAddFile && files.length < maxFiles;

  return (
    <div
      className={cn(
        'w-full rounded-2xl bg-grey-20 px-5 py-6 md:max-w-[376px]',
        className
      )}
    >
      <h2 className="mb-5 text-center text-l font-emphasize text-grey-100">
        등록된 심리검사 결과지
      </h2>
      <div className="flex flex-col gap-2">
        {files.map((file) => (
          <AssessmentFileItem
            key={file.id}
            file={file}
            onRemove={onRemoveFile}
          />
        ))}
        {canAdd && <AddAssessmentButton onClick={onAddFile} />}
      </div>
    </div>
  );
};
