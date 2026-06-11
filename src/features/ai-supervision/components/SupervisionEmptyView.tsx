import { CREDIT_COST } from '@/shared/constants/credit';
import { CreditIcon } from '@/shared/icons';

interface SupervisionEmptyViewProps {
  onCreateAnalysis: () => void;
}

/** 분석 기록이 없을 때의 빈 상태 — 슈퍼비전 받기 CTA */
export function SupervisionEmptyView({
  onCreateAnalysis,
}: SupervisionEmptyViewProps) {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-7 px-10 text-center">
      <p className="whitespace-pre-line text-xl font-medium leading-[150%] text-grey-100">
        {'다회기의 상담기록을 기반으로\n슈퍼비전을 받아보세요.'}
      </p>
      <button
        type="button"
        onClick={onCreateAnalysis}
        className="flex items-center gap-2 rounded-lg border border-green-80 bg-[#ECFAED] px-3.5 py-1.5 text-m font-medium text-green-80 transition-opacity lg:hover:opacity-80"
      >
        AI 슈퍼비전 받기
        <span className="flex items-center gap-0.5">
          {CREDIT_COST.CLIENT_ANALYSIS}
          <CreditIcon size={14} color="currentColor" />
        </span>
      </button>
    </div>
  );
}
