import React from 'react';

import { CREDIT_COST } from '@/shared/constants/credit';
import { Text } from '@/shared/ui/atoms/Text';
import { Title } from '@/shared/ui/atoms/Title';
import { Modal } from '@/shared/ui/composites/Modal';

interface CreditPricingTooltipProps {
  children: React.ReactElement;
}

export const CreditPricingTooltip: React.FC<CreditPricingTooltipProps> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const tooltipContent = (
    <div className="flex flex-col gap-8 p-2 lg:min-h-0 lg:flex-1">
      <Title
        as="h4"
        className="shrink-0 text-center text-2xl font-semibold text-fg"
      >
        마음토스 크레딧 안내
      </Title>

      <div className="space-y-5 rounded-lg border border-grey-40 bg-surface-contrast p-8 lg:min-h-0 lg:w-[420px] lg:flex-1 lg:self-center lg:overflow-y-auto">
        {/* 녹음 변환 */}
        <div className="space-y-2">
          <Text className="text-sm font-normal text-grey-80">음성 변환</Text>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Text className="text-sm font-normal text-fg">일반 축어록</Text>
              <div>
                <Text className="text-sm font-semibold text-fg">
                  30분 까지 - 30크레딧 (고정)
                </Text>
                <Text className="text-sm font-semibold text-fg">
                  30분 초과 - 분당 1크레딧
                </Text>
              </div>
            </div>
            <div className="flex gap-2">
              <Text className="text-sm font-normal text-fg">고급 축어록</Text>
              <div>
                <Text className="text-sm font-semibold text-fg">
                  30분 까지 - 45크레딧 (고정)
                </Text>
                <Text className="text-sm font-semibold text-fg">
                  30분 초과 - 분당 1.5크레딧
                </Text>
              </div>
            </div>
          </div>
        </div>

        {/* 직접 입력 */}
        <div className="space-y-2">
          <Text className="text-sm font-normal text-grey-80">직접 입력</Text>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Text className="text-sm font-normal text-fg">직접 입력</Text>
              <div>
                <Text className="text-sm font-semibold text-fg">30크레딧</Text>
              </div>
            </div>
          </div>
        </div>

        {/* AI 상담노트 및 분석 */}
        <div className="space-y-2">
          <Text className="text-sm font-normal text-grey-80">
            AI 상담노트 및 분석
          </Text>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Text className="text-sm font-normal text-fg">상담노트 추가 작성</Text>
              <Text className="text-sm font-semibold text-fg">10크레딧</Text>
            </div>
            <div className="flex gap-2">
              <Text className="text-sm font-normal text-fg">다회기 분석</Text>
              <Text className="text-sm font-semibold text-fg">50크레딧</Text>
            </div>
          </div>
        </div>

        {/* 가계도 */}
        <div className="space-y-2">
          <Text className="text-sm font-normal text-grey-80">가계도</Text>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Text className="text-sm font-normal text-fg">가계도 자동 생성</Text>
              <div>
                <Text className="text-sm font-semibold text-fg">
                  {CREDIT_COST.GENOGRAM}크레딧
                </Text>
              </div>
            </div>
            <div className="flex gap-2">
              <Text className="text-sm font-normal text-fg">가계도 보고서</Text>
              <div>
                <Text className="text-sm font-semibold text-fg">
                  {CREDIT_COST.GENOGRAM_REPORT}크레딧
                </Text>
              </div>
            </div>
          </div>
        </div>

        {/* 심리검사해석 */}
        <div className="space-y-2">
          <Text className="text-sm font-normal text-grey-80">
            심리검사해석
          </Text>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Text className="text-sm font-normal text-fg">결과지 분석</Text>
              <div>
                <Text className="text-sm font-semibold text-fg">50크레딧</Text>
              </div>
            </div>
            <div className="flex gap-2">
              <Text className="text-sm font-normal text-fg">에이전트 질문</Text>
              <div>
                <Text className="text-sm font-semibold text-fg">5크레딧</Text>
              </div>
            </div>
          </div>
        </div>

        <div>
          <Text className="text-sm font-normal text-fg">
            기본 상담 노트는 음성 변환 기본료에 포함돼요.
          </Text>
        </div>
      </div>

      <Text className="text-sm shrink-0 text-center text-grey-80">
        크레딧은 구독 날짜를 기준으로 매월 초기화돼요.
      </Text>
    </div>
  );

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setIsOpen(true);
        }}
      >
        {children}
      </div>
      {/* 데스크탑·모바일 모두 모달로 안내(데스크탑은 545x808 중앙 고정, 모바일은 풀스크린) */}
      {/* 프로필 팝오버(z-popover 1100) 안에서 열리므로 z-tooltip(1200)로 딤을 위에 올림 */}
      <Modal
        open={isOpen}
        onOpenChange={setIsOpen}
        mobileVariant="fullScreen"
        overlayClassName="z-tooltip"
        className="px-4 py-4 lg:flex lg:h-[808px] lg:max-h-[calc(100dvh-2rem)] lg:w-[545px] lg:max-w-none lg:flex-col lg:overflow-hidden lg:rounded-2xl lg:py-12"
      >
        {tooltipContent}
      </Modal>
    </>
  );
};
