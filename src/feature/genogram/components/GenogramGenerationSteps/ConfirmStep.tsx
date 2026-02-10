import { Text } from '@/components/ui';
import { useCreditInfo } from '@/feature/settings/hooks/useCreditInfo';
import { cn } from '@/lib/cn';

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
      <div className="flex max-h-full w-full max-w-[768px] flex-col items-center rounded-2xl">
        {/* 프리뷰 일러스트레이션 - 유일하게 축소 가능 */}
        <div className="mb-6 aspect-[480/280] min-h-0 w-full flex-1">
          <img
            src="/genogram/genogram-intro.png"
            alt="고급 축어록 툴팁"
            className="h-full w-full object-contain"
          />
        </div>

        {/* 설명 텍스트 - 축소 불가 */}
        <p className="mb-6 shrink-0 text-center text-sm font-medium text-fg">
          클릭 한 번으로 가계도를 생성할 수 있어요.
          <br />
          지금 바로 시작해보세요
        </p>

        {/* 크레딧 배지 + 버튼 - 축소 불가 */}
        <div className="flex shrink-0 flex-col items-center gap-2 md:gap-3">
          <div className="flex items-center gap-1 rounded-lg bg-primary-100 px-3 py-1">
            <Text className="font-bold text-primary-600">50</Text>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-primary-600"
            >
              <g clipPath="url(#clip0_credit_modal)">
                <path
                  d="M7 14C10.866 14 14 10.866 14 7C14 3.134 10.866 0 7 0C3.134 0 0 3.134 0 7C0.00418359 10.8643 3.13573 13.9958 7 14ZM4.1125 4.1125C5.70836 2.52055 8.29164 2.52055 9.8875 4.1125C10.1113 4.34424 10.1049 4.71352 9.87317 4.93732C9.64712 5.15566 9.28873 5.15566 9.06268 4.93732C7.92351 3.79846 6.07677 3.79868 4.9379 4.93787C3.79903 6.07707 3.79925 7.92378 4.93845 9.06265C6.07742 10.2013 7.92373 10.2013 9.0627 9.06265C9.29444 8.83884 9.66372 8.84527 9.88753 9.07701C10.1058 9.30306 10.1058 9.66142 9.88753 9.8875C8.29281 11.4822 5.70724 11.4822 4.11253 9.8875C2.51779 8.29279 2.51779 5.70721 4.1125 4.1125Z"
                  fill="currentColor"
                />
              </g>
              <defs>
                <clipPath id="clip0_credit_modal">
                  <rect width="14" height="14" fill="white" />
                </clipPath>
              </defs>
            </svg>
            <Text className="text-primary-600">사용</Text>
          </div>

          <button
            onClick={
              hasEnoughCredits && !isLoadingCredits ? onConfirm : undefined
            }
            disabled={isLoadingCredits || !hasEnoughCredits}
            className={cn(
              'rounded-lg px-8 py-3 font-medium transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              isLoadingCredits
                ? 'bg-primary/50 text-white'
                : hasEnoughCredits
                  ? 'hover:bg-primary/90 bg-primary text-white'
                  : 'bg-gray-300 text-gray-500'
            )}
          >
            {isLoadingCredits ? '크레딧 확인 중...' : '가계도 생성 시작하기'}
          </button>
          {!isLoadingCredits && !hasEnoughCredits && (
            <span className="text-sm text-red-500">
              크레딧이 부족합니다 (현재: {remainingCredits}C)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
