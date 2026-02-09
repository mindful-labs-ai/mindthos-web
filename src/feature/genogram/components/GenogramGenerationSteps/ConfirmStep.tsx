import { useCreditInfo } from '@/feature/settings/hooks/useCreditInfo';
import { cn } from '@/lib/cn';

import { CreditIcon, GenogramPreviewIllustration } from './illustrations';
import { CREDIT_COST } from './types';

interface ConfirmStepProps {
  onConfirm: () => void;
}

export function ConfirmStep({ onConfirm }: ConfirmStepProps) {
  const { creditInfo, isLoading: isLoadingCredits } = useCreditInfo();
  const remainingCredits = creditInfo?.plan?.remaining ?? 0;
  const hasEnoughCredits = remainingCredits >= CREDIT_COST;

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="border-primary/20 bg-primary/5 flex w-full max-w-[500px] flex-col items-center rounded-2xl border p-8">
        {/* 프리뷰 일러스트레이션 */}
        <div className="mb-6">
          <GenogramPreviewIllustration />
        </div>

        {/* 설명 텍스트 */}
        <p className="mb-6 text-center text-fg-muted">
          클릭 한 번으로 가계도를 생성할 수 있어요.
          <br />
          지금 바로 시작해보세요
        </p>

        {/* 크레딧 배지 + 버튼 */}
        <div className="flex flex-col items-center gap-3">
          <div className="bg-primary/10 flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-primary">
            <CreditIcon />
            <span>{CREDIT_COST}C 사용</span>
          </div>

          {isLoadingCredits ? (
            <button
              disabled
              className="bg-primary/50 rounded-lg px-8 py-3 font-medium text-white"
            >
              크레딧 확인 중...
            </button>
          ) : !hasEnoughCredits ? (
            <div className="flex flex-col items-center gap-2">
              <button
                disabled
                className="rounded-lg bg-gray-300 px-8 py-3 font-medium text-gray-500"
              >
                가계도 생성 시작하기
              </button>
              <span className="text-sm text-red-500">
                크레딧이 부족합니다 (현재: {remainingCredits}C)
              </span>
            </div>
          ) : (
            <button
              onClick={onConfirm}
              className={cn(
                'rounded-lg bg-primary px-8 py-3 font-medium text-white',
                'hover:bg-primary/90 transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
              )}
            >
              가계도 생성 시작하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
