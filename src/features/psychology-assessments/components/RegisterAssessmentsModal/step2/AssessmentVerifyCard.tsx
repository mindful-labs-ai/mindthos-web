import { cn } from '@/lib/cn';

import { StatusCircle } from '../shared/StatusBadge';
import type { VerificationResult } from '../types';

interface AssessmentVerifyCardProps {
  result: VerificationResult;
  /** invalid 상태일 때 삭제 버튼 노출. 누르면 서버에서 해당 드래프트를 제거한다. */
  onDelete?: () => void;
  /** 삭제 진행 중 표시. */
  deleting?: boolean;
  className?: string;
}

const statusBorderClass: Record<VerificationResult['status'], string> = {
  complete: 'border-green-80',
  missing: 'border-yellow-80',
  invalid: 'border-red-80',
};

const statusLabelText: Record<VerificationResult['status'], string> = {
  complete: '확인 완료',
  missing: '항목 누락됨',
  invalid: '등록 불가',
};

const statusLabelColor: Record<VerificationResult['status'], string> = {
  complete: 'text-green-80',
  missing: 'text-yellow-80',
  invalid: 'text-red-80',
};

export const AssessmentVerifyCard = ({
  result,
  onDelete,
  deleting,
  className,
}: AssessmentVerifyCardProps) => {
  const { status, itemsVerified, itemsTotal } = result;

  const itemSummary =
    itemsTotal === null || itemsVerified === null
      ? '결과지 확인됨'
      : `${itemsVerified}/${itemsTotal} 항목 확인됨`;

  const isInvalid = status === 'invalid';

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-2xl border bg-white py-3 pl-4 pr-6',
        statusBorderClass[status],
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-m font-emphasize text-grey-100">
          {result.categoryLabel}
        </p>
        <p className="truncate text-sm text-grey-80">{result.fileName}</p>
        <p
          className={cn(
            'mt-2 text-sm font-emphasize',
            statusLabelColor[status]
          )}
        >
          {statusLabelText[status]}
        </p>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        <StatusCircle
          tone={
            status === 'complete'
              ? 'success'
              : status === 'missing'
                ? 'warning'
                : 'danger'
          }
          symbol={status === 'complete' ? 'check' : 'exclaim'}
          size={20}
        />
        <span
          className={cn('text-sm', isInvalid ? 'text-red-80' : 'text-grey-100')}
        >
          {isInvalid
            ? (result.invalidReason ?? '알 수 없는 검사 종류')
            : itemSummary}
        </span>
        {isInvalid && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className={cn(
              'ml-2 rounded-md border border-red-80 px-2 py-1 text-xs font-medium text-red-80 transition-colors lg:hover:bg-red-10',
              deleting && 'cursor-not-allowed opacity-50'
            )}
          >
            {deleting ? '삭제 중…' : '삭제'}
          </button>
        )}
      </div>
    </div>
  );
};
