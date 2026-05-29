import { cn } from '@/lib/cn';

import type { VerificationResult } from '../types';

import { AssessmentVerifyCard } from './AssessmentVerifyCard';
import { VerificationSummaryBar } from './VerificationSummaryBar';

export type Step2Substate = 'list' | 'filling';

interface Step2VerifyViewProps {
  substate: Step2Substate;
  verifiedCount: number;
  missingCount: number;
  totalCount: number;
  results: VerificationResult[];
  /** invalid 항목의 인라인 삭제 핸들러. 주어지면 invalid 카드에 삭제 버튼 노출. */
  onDeleteInvalid?: (fileId: string) => void;
  /** 삭제 진행 중인 fileId */
  deletingFileId?: string | null;
  /** filling 모드에서 폼 children 직접 주입 (검사별 폼은 외부 구성) */
  fillingForm?: React.ReactNode;
  className?: string;
}

export const Step2VerifyView = ({
  substate,
  verifiedCount,
  missingCount,
  totalCount,
  results,
  onDeleteInvalid,
  deletingFileId,
  fillingForm,
  className,
}: Step2VerifyViewProps) => {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <VerificationSummaryBar
        verifiedCount={verifiedCount}
        missingCount={missingCount}
        totalCount={totalCount}
      />

      {substate === 'list' ? (
        <div className="flex flex-col gap-3">
          {results.map((result) => (
            <AssessmentVerifyCard
              key={result.fileId}
              result={result}
              onDelete={
                onDeleteInvalid && result.status === 'invalid'
                  ? () => onDeleteInvalid(result.fileId)
                  : undefined
              }
              deleting={deletingFileId === result.fileId}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">{fillingForm}</div>
      )}
    </div>
  );
};
