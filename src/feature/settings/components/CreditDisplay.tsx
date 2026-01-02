import React from 'react';

import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui';
import { ProgressCircle } from '@/components/ui/atoms/ProgressCircle';
import { Text } from '@/components/ui/atoms/Text';
import { ROUTES } from '@/router/constants';

import { CreditPricingTooltip } from './CreditPricingTooltip';
import { PlanChangeModal } from './PlanChangeModal';

interface CreditDisplayProps {
  totalCredit: number;
  usedCredit: number;
  planLabel: string;
  planType: string;
  daysUntilReset?: number;
  variant?: 'sidebar' | 'detailed';
}

export const CreditDisplay: React.FC<CreditDisplayProps> = ({
  totalCredit,
  usedCredit,
  planLabel,
  planType,
  daysUntilReset,
  variant = 'sidebar',
}) => {
  const remaining = totalCredit - usedCredit;
  const percentage =
    totalCredit > 0 ? Math.floor((remaining / totalCredit) * 100) : 0;
  const isFree = planType.toLowerCase() === 'free';
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] =
    React.useState<boolean>(false);

  const navigate = useNavigate();

  const handleClick = () => {
    navigate(ROUTES.SETTINGS);
  };

  if (variant === 'detailed') {
    return (
      <div className="flex items-center gap-4 rounded-lg p-6">
        <ProgressCircle
          value={percentage}
          size={85}
          strokeWidth={14}
          showValue={false}
        />
        <div className="flex-1 space-y-2">
          <div className="flex flex-col content-end gap-2 text-left">
            <Text className="text-lg font-medium text-fg">마음토스 크레딧</Text>
            <Text className="flex gap-2 text-lg">
              <span className="flex items-center gap-1 font-bold text-primary">
                {remaining.toLocaleString()}{' '}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 20C15.5229 20 20 15.5229 20 10C20 4.47715 15.5229 0 10 0C4.47715 0 0 4.47715 0 10C0.00597656 15.5204 4.47961 19.994 10 20ZM5.875 5.875C8.1548 3.60078 11.8452 3.60078 14.125 5.875C14.4447 6.20605 14.4355 6.73359 14.1045 7.05332C13.7816 7.36523 13.2696 7.36523 12.9467 7.05332C11.3193 5.42637 8.68109 5.42668 7.05414 7.0541C5.42719 8.68152 5.4275 11.3197 7.05492 12.9466C8.68203 14.5733 11.3196 14.5733 12.9467 12.9466C13.2778 12.6269 13.8053 12.6361 14.125 12.9671C14.4369 13.2901 14.4369 13.802 14.125 14.125C11.8469 16.4032 8.1532 16.4032 5.87504 14.125C3.59684 11.8468 3.59684 8.15316 5.875 5.875Z"
                    fill="#44CE4B"
                  />
                </svg>
              </span>
              /
              <span className="flex items-center gap-1 font-bold">
                {totalCredit.toLocaleString()}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 20C15.5229 20 20 15.5229 20 10C20 4.47715 15.5229 0 10 0C4.47715 0 0 4.47715 0 10C0.00597656 15.5204 4.47961 19.994 10 20ZM5.875 5.875C8.1548 3.60078 11.8452 3.60078 14.125 5.875C14.4447 6.20605 14.4355 6.73359 14.1045 7.05332C13.7816 7.36523 13.2696 7.36523 12.9467 7.05332C11.3193 5.42637 8.68109 5.42668 7.05414 7.0541C5.42719 8.68152 5.4275 11.3197 7.05492 12.9466C8.68203 14.5733 11.3196 14.5733 12.9467 12.9466C13.2778 12.6269 13.8053 12.6361 14.125 12.9671C14.4369 13.2901 14.4369 13.802 14.125 14.125C11.8469 16.4032 8.1532 16.4032 5.87504 14.125C3.59684 11.8468 3.59684 8.15316 5.875 5.875Z"
                    fill="#3C3C3C"
                  />
                </svg>
              </span>
            </Text>
          </div>
        </div>
      </div>
    );
  }

  // sidebar variant
  return (
    <div
      role="button"
      onClick={handleClick}
      onKeyDown={(e) => e.stopPropagation()}
      tabIndex={0}
      className="mx-3 mb-6 flex select-none flex-col gap-y-2 rounded-lg border-t border-border bg-surface-contrast px-1 pb-2 pt-3 text-left"
    >
      <Text className="relative px-3 text-xs font-medium text-fg-muted">
        마음토스 크레딧
        <button className="absolute right-3 top-0">
          <CreditPricingTooltip placement="right">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 0C5.61553 0 4.26215 0.410543 3.11101 1.17971C1.95987 1.94888 1.06266 3.04213 0.532846 4.32122C0.003033 5.6003 -0.13559 7.00776 0.134506 8.36563C0.404603 9.7235 1.07129 10.9708 2.05026 11.9497C3.02922 12.9287 4.2765 13.5954 5.63437 13.8655C6.99224 14.1356 8.3997 13.997 9.67879 13.4672C10.9579 12.9373 12.0511 12.0401 12.8203 10.889C13.5895 9.73785 14 8.38447 14 7C13.998 5.1441 13.2599 3.36479 11.9475 2.05247C10.6352 0.74015 8.8559 0.0020073 7 0V0ZM7 11.6667C6.88463 11.6667 6.77185 11.6325 6.67592 11.5684C6.57999 11.5043 6.50522 11.4132 6.46107 11.3066C6.41692 11.2 6.40537 11.0827 6.42788 10.9695C6.45039 10.8564 6.50594 10.7524 6.58752 10.6709C6.6691 10.5893 6.77304 10.5337 6.8862 10.5112C6.99935 10.4887 7.11664 10.5003 7.22323 10.5444C7.32982 10.5886 7.42093 10.6633 7.48503 10.7592C7.54912 10.8552 7.58333 10.968 7.58333 11.0833C7.58333 11.238 7.52188 11.3864 7.41248 11.4958C7.30308 11.6052 7.15471 11.6667 7 11.6667ZM8.12583 7.29517C7.95369 7.4028 7.81292 7.55386 7.71769 7.73316C7.62246 7.91247 7.57612 8.11369 7.58333 8.31658V8.75C7.58333 8.90471 7.52188 9.05308 7.41248 9.16248C7.30308 9.27187 7.15471 9.33333 7 9.33333C6.84529 9.33333 6.69692 9.27187 6.58752 9.16248C6.47813 9.05308 6.41667 8.90471 6.41667 8.75V8.31658C6.40805 7.905 6.50975 7.4986 6.71121 7.13959C6.91267 6.78057 7.20654 6.48202 7.56233 6.27492C7.77786 6.15621 7.95034 5.9724 8.05511 5.74976C8.15988 5.52713 8.19158 5.27707 8.14567 5.03533C8.10021 4.80503 7.98714 4.59351 7.8209 4.42778C7.65465 4.26206 7.44277 4.14965 7.21234 4.10492C7.04417 4.07379 6.87122 4.08002 6.70573 4.12315C6.54024 4.16629 6.38626 4.24528 6.25469 4.35453C6.12312 4.46379 6.01717 4.60063 5.94436 4.75538C5.87155 4.91012 5.83364 5.07898 5.83334 5.25C5.83334 5.40471 5.77188 5.55308 5.66248 5.66248C5.55308 5.77187 5.40471 5.83333 5.25 5.83333C5.09529 5.83333 4.94692 5.77187 4.83752 5.66248C4.72813 5.55308 4.66667 5.40471 4.66667 5.25C4.66681 4.83846 4.7758 4.43428 4.98258 4.07846C5.18935 3.72264 5.48655 3.42784 5.84404 3.22396C6.20152 3.02008 6.60657 2.91437 7.0181 2.91756C7.42962 2.92075 7.83298 3.03273 8.18726 3.24213C8.54154 3.45153 8.83414 3.75091 9.03537 4.1099C9.2366 4.46888 9.3393 4.8747 9.33307 5.28619C9.32683 5.69768 9.21187 6.1002 8.99985 6.45292C8.78783 6.80564 8.4863 7.09602 8.12583 7.29458V7.29517Z"
                fill="#BABAC0"
              />
            </svg>
          </CreditPricingTooltip>
        </button>
      </Text>
      <div className="flex items-center gap-2 px-3">
        <ProgressCircle
          value={percentage}
          size={28}
          strokeWidth={5}
          showValue={false}
        />
        <div className="flex-1 text-left">
          <Text className="flex gap-2 text-sm text-fg">
            <span className="flex items-center gap-1 font-semibold text-primary-400">
              {remaining.toLocaleString()}{' '}
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_3065_23359)">
                  <path
                    d="M7 14C10.866 14 14 10.866 14 7C14 3.134 10.866 0 7 0C3.134 0 0 3.134 0 7C0.00418359 10.8643 3.13573 13.9958 7 14ZM4.1125 4.1125C5.70836 2.52055 8.29164 2.52055 9.8875 4.1125C10.1113 4.34424 10.1049 4.71352 9.87317 4.93732C9.64712 5.15566 9.28873 5.15566 9.06268 4.93732C7.92351 3.79846 6.07677 3.79868 4.9379 4.93787C3.79903 6.07707 3.79925 7.92378 4.93845 9.06265C6.07742 10.2013 7.92373 10.2013 9.0627 9.06265C9.29444 8.83884 9.66372 8.84527 9.88753 9.07701C10.1058 9.30306 10.1058 9.66142 9.88753 9.8875C8.29281 11.4822 5.70724 11.4822 4.11253 9.8875C2.51779 8.29279 2.51779 5.70721 4.1125 4.1125Z"
                    fill="#44CE4B"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_3065_23359">
                    <rect width="14" height="14" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </span>{' '}
            /{' '}
            <span className="flex items-center gap-1">
              {totalCredit.toLocaleString()}{' '}
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7 14C10.866 14 14 10.866 14 7C14 3.134 10.866 0 7 0C3.134 0 0 3.134 0 7C0.00418359 10.8643 3.13573 13.9958 7 14ZM4.1125 4.1125C5.70836 2.52055 8.29164 2.52055 9.8875 4.1125C10.1113 4.34424 10.1049 4.71352 9.87317 4.93732C9.64712 5.15566 9.28873 5.15566 9.06268 4.93732C7.92351 3.79846 6.07677 3.79868 4.9379 4.93787C3.79903 6.07707 3.79925 7.92378 4.93845 9.06265C6.07742 10.2013 7.92373 10.2013 9.0627 9.06265C9.29444 8.83884 9.66372 8.84527 9.88753 9.07701C10.1058 9.30306 10.1058 9.66142 9.88753 9.8875C8.29281 11.4822 5.70724 11.4822 4.11253 9.8875C2.51779 8.29279 2.51779 5.70721 4.1125 4.1125Z"
                  fill="#3C3C3C"
                />
              </svg>
            </span>
          </Text>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-2">
        <Text className="px-3 text-center text-xs font-medium text-fg-muted">
          {isFree
            ? '유료 플랜으로 전환하세요'
            : daysUntilReset !== undefined &&
              `${planLabel} 이용 중, 초기화까지 ${daysUntilReset}일`}
        </Text>
        {isFree && (
          <Button
            size="free"
            variant="outline"
            tone="primary"
            className="w-full rounded-md px-1 py-0.5 text-xs"
            onClick={() => setIsUpgradeModalOpen(true)}
          >
            업그레이드
          </Button>
        )}
      </div>

      <PlanChangeModal
        open={isUpgradeModalOpen}
        onOpenChange={setIsUpgradeModalOpen}
      />
    </div>
  );
};
