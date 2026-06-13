import React, { useState } from 'react';

import { trackError, trackEvent } from '@/lib/mixpanel';
import {
  MixpanelError,
  MixpanelEvent,
} from '@/shared/constants/mixpanelEvents';
import { getPlanDisplayName } from '@/shared/constants/planNames';
import { useDevice } from '@/shared/hooks/useDevice';
import { ArrowRightIcon, CheckIcon, HelpCircleIcon } from '@/shared/icons';
import { MobileModalHeader } from '@/shared/ui';
import { Button } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Text';
import { Title } from '@/shared/ui/atoms/Title';
import { Modal } from '@/shared/ui/composites/Modal';
import { useToast } from '@/shared/ui/composites/Toast';

import { planFeature, type PlanKey } from './PlanCard';

export interface DowngradeConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlanType: string;
  currentPlanCredit: number;
  newPlanType: string;
  newPlanCredit: number;
  effectiveAt: string | null;
  onConfirm: () => Promise<void>;
}

// 플랜 타입 → planFeature 키 변환
const getPlanFeatureKey = (type: string): PlanKey | null => {
  const map: Record<string, PlanKey> = {
    Starter: '스타터',
    Plus: '플러스',
    Pro: '프로',
    스타터: '스타터',
    플러스: '플러스',
    프로: '프로',
  };
  return map[type] || null;
};

export const DowngradeConfirmModal: React.FC<DowngradeConfirmModalProps> = ({
  open,
  onOpenChange,
  currentPlanType,
  currentPlanCredit,
  newPlanType,
  newPlanCredit,
  effectiveAt,
  onConfirm,
}) => {
  React.useEffect(() => {
    if (open) {
      trackEvent(MixpanelEvent.PlanDowngradeConfirmModalOpen);
    }
  }, [open]);

  const { toast } = useToast();
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    trackEvent(MixpanelEvent.PlanDowngradeAttempt, {
      current_plan: currentPlanType,
      new_plan: newPlanType,
    });
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      trackError(MixpanelError.PlanDowngradeError, error, {
        current_plan: currentPlanType,
        new_plan: newPlanType,
      });
      toast({
        title: '플랜 변경 실패',
        description: '플랜을 변경하지 못했어요. 잠시 후 다시 시도해 주세요.',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '구독 종료 후';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const currentFeatureKey = getPlanFeatureKey(currentPlanType);
  const currentFeatures = currentFeatureKey
    ? planFeature[currentFeatureKey]
    : null;

  const newFeatureKey = getPlanFeatureKey(newPlanType);
  const newFeatures = newFeatureKey ? planFeature[newFeatureKey] : null;

  // 공통: 현재 플랜 카드
  const currentPlanCard = (
    <div className="rounded-xl border border-grey-30 px-4 py-6">
      <p className="mb-6 px-4 text-l font-emphasize text-grey-100">
        {getPlanDisplayName(currentPlanType)} 플랜 이용 중
      </p>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <CheckIcon size={18} className="flex-shrink-0 text-green-80" />
          <span className="text-sm">
            <span className="font-emphasize">
              {currentPlanCredit.toLocaleString()} 크레딧
            </span>{' '}
            / 월
          </span>
        </div>
        {currentFeatures &&
          Object.entries(currentFeatures).map(([idx, { text, style, sub }]) => (
            <div key={idx} className="flex items-center gap-3">
              <CheckIcon size={18} className="flex-shrink-0 text-green-80" />
              <div className="flex gap-1">
                <span className={`text-sm ${style || ''}`}>{text}</span>
                {sub && <span className="text-sm">{sub}</span>}
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  // 공통: 변경 플랜 카드
  const newPlanCard = (
    <div className="rounded-xl border border-grey-30 px-4 py-6">
      <p className="mb-6 px-4 text-l font-emphasize text-grey-100">
        {getPlanDisplayName(newPlanType)} 플랜{isMobile ? '' : '으로'} 변경 후
      </p>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <CheckIcon size={18} className="flex-shrink-0 text-green-80" />
          <span className="text-sm">
            <span className="font-emphasize">
              {newPlanCredit.toLocaleString()} 크레딧
            </span>{' '}
            / 월
          </span>
        </div>
        {newFeatures &&
          Object.entries(newFeatures).map(([idx, { text, style, sub }]) => (
            <div key={idx} className="flex items-center gap-3">
              <CheckIcon size={18} className="flex-shrink-0 text-green-80" />
              <div className="flex gap-1">
                <span className={`text-sm ${style || ''}`}>{text}</span>
                {sub && <span className="text-sm">{sub}</span>}
              </div>
            </div>
          ))}
        {!newFeatures && (
          <div className="flex items-center gap-3">
            <CheckIcon size={18} className="flex-shrink-0 text-green-80" />
            <span className="text-sm">제한된 상담노트 양식</span>
          </div>
        )}
      </div>
    </div>
  );

  // 공통: 안내 텍스트
  const noticeText = (
    <div className="text-center">
      <p className="text-sm text-grey-60">
        <span className="font-emphasize text-grey-100">
          {formatDate(effectiveAt)}
        </span>{' '}
        이후 {getPlanDisplayName(newPlanType)} 플랜이 적용돼요.
      </p>
    </div>
  );

  // 공통: 버튼
  const actionButtons = (
    <div className="flex gap-3">
      <Button
        variant="outline"
        tone="neutral"
        size="lg"
        onClick={() => onOpenChange(false)}
        disabled={isLoading}
        className="flex-1"
      >
        계속 이용하기
      </Button>
      <Button
        variant="soft"
        tone="danger"
        size="lg"
        onClick={handleConfirm}
        disabled={isLoading}
        className="flex-1"
      >
        {isLoading ? '처리 중...' : '변경하기'}
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className={
        isMobileView
          ? 'flex flex-col'
          : 'flex max-w-3xl items-center justify-center'
      }
      mobileVariant={isMobileView ? 'fullScreen' : 'center'}
      hideCloseButton={isMobileView}
    >
      {isMobileView ? (
        <>
          <MobileModalHeader title="플랜 변경" onBack={() => onOpenChange(false)} />
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-10">
            <div className="mb-8 text-center">
              <p className="font-emphasize text-grey-100">
                정말 플랜을 바꾸시겠어요?
              </p>
              <p className="font-emphasize text-grey-100">
                플랜 변경 후 아래 기능을 더 이상 이용할 수 없어요.
              </p>
            </div>

            {/* 모바일: 세로 배치 + v 화살표, 태블릿: 가로 배치 + > 화살표 */}
            <div
              className={
                isMobile
                  ? 'flex flex-col items-center gap-4'
                  : 'flex items-center gap-4'
              }
            >
              <div className={isMobile ? 'w-full' : 'flex-1 self-stretch'}>
                {currentPlanCard}
              </div>
              <div className="flex-shrink-0">
                <ArrowRightIcon
                  size={24}
                  className={`text-grey-60 ${isMobile ? 'rotate-90' : ''}`}
                />
              </div>
              <div className={isMobile ? 'w-full' : 'flex-1 self-stretch'}>
                {newPlanCard}
              </div>
            </div>

            <div className="mt-8">{noticeText}</div>
          </div>
          <div className="flex-shrink-0 px-4 pb-4 md:px-10">
            {actionButtons}
          </div>
        </>
      ) : (
        <div className="flex w-full flex-col items-stretch space-y-12 px-12">
          <div className="text-center">
            <div className="mb-4 flex items-center justify-center gap-2 text-danger">
              <HelpCircleIcon size={24} />
              <Title as="h2" className="text-xl font-headline">
                플랜 변경
              </Title>
            </div>
            <div className="space-y-1">
              <Text className="font-emphasize">정말 플랜을 바꾸시겠어요?</Text>
              <Text className="font-emphasize">
                플랜 변경 후 아래 기능을 더 이상 이용할 수 없어요.
              </Text>
            </div>
          </div>

          <div className="flex w-full items-center justify-center gap-4">
            <div className="flex-1 self-stretch">{currentPlanCard}</div>
            <div className="flex-shrink-0">
              <ArrowRightIcon size={24} className="text-grey-60" />
            </div>
            <div className="flex-1 self-stretch">{newPlanCard}</div>
          </div>

          {noticeText}

          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              tone="neutral"
              size="lg"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="w-40"
            >
              계속 이용하기
            </Button>
            <Button
              variant="soft"
              tone="danger"
              size="lg"
              onClick={handleConfirm}
              disabled={isLoading}
              className="w-40"
            >
              {isLoading ? '처리 중...' : '변경하기'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
