import React, { useState } from 'react';

import { trackError, trackEvent } from '@/lib/mixpanel';
import {
  MixpanelError,
  MixpanelEvent,
} from '@/shared/constants/mixpanelEvents';
import { useDevice } from '@/shared/hooks/useDevice';
import { ArrowRightIcon, CheckIcon, HelpCircleIcon } from '@/shared/icons';
import { BackButton } from '@/shared/ui/atoms/BackButton';
import { Button } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Text';
import { Title } from '@/shared/ui/atoms/Title';
import { Modal } from '@/shared/ui/composites/Modal';
import { useToast } from '@/shared/ui/composites/Toast';

import { planFeature, type PlanKey } from './PlanCard';

export interface CancelSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlanType: string;
  currentPlanCredit: number;
  effectiveAt: string | null;
  onConfirm: () => Promise<void>;
}

// 플랜 타입 → 한글 이름 변환
const getPlanDisplayName = (type: string): string => {
  const map: Record<string, string> = {
    Free: '무료',
    Starter: '스타터',
    Plus: '플러스',
    Pro: '프로',
    스타터: '스타터',
    플러스: '플러스',
    프로: '프로',
  };
  return map[type] || type;
};

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

export const CancelSubscriptionModal: React.FC<
  CancelSubscriptionModalProps
> = ({
  open,
  onOpenChange,
  currentPlanType,
  currentPlanCredit,
  effectiveAt,
  onConfirm,
}) => {
  const { toast } = useToast();
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    trackEvent(MixpanelEvent.SubscriptionCancelAttempt, {
      current_plan: currentPlanType,
    });
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      trackError(MixpanelError.SubscriptionCancelError, error, {
        current_plan: currentPlanType,
      });
      toast({
        title: '구독 해지 실패',
        description: '구독 해지에 실패했습니다. 다시 시도해주세요.',
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

  const planFeatureKey = getPlanFeatureKey(currentPlanType);
  const currentFeatures = planFeatureKey ? planFeature[planFeatureKey] : null;

  // 공통: 현재 플랜 카드
  const currentPlanCard = (
    <div className="rounded-xl border border-grey-30 px-4 py-6">
      <p className="mb-6 px-4 text-l font-emphasize text-grey-100">
        {getPlanDisplayName(currentPlanType)} 요금제 이용 중
      </p>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <CheckIcon size={18} className="flex-shrink-0 text-green-80" />
          <span className="text-sm"><span className="font-emphasize">{currentPlanCredit.toLocaleString()} 크레딧</span> / 월</span>
        </div>
        {currentFeatures && Object.entries(currentFeatures).map(([idx, { text, style, sub }]) => (
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

  // 공통: 중단 후 카드
  const afterCancelCard = (
    <div className="rounded-xl border border-grey-30 px-4 py-6">
      <p className="mb-6 px-4 text-l font-emphasize text-grey-100">정기결제 중단 후</p>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <CheckIcon size={18} className="flex-shrink-0 text-green-80" />
          <span className="text-sm"><span className="font-emphasize">100 크레딧</span> / 월</span>
        </div>
        <div className="flex items-center gap-3">
          <CheckIcon size={18} className="flex-shrink-0 text-green-80" />
          <span className="text-sm">제한된 상담 노트 템플릿</span>
        </div>
      </div>
    </div>
  );

  // 공통: 안내 텍스트
  const noticeText = (
    <div className="text-center">
      <p className="text-sm text-grey-60">
        장기결제를 중단해도 <span className="font-emphasize text-grey-100">{formatDate(effectiveAt)}</span>까지 이용할 수 있습니다.
      </p>
    </div>
  );

  // 공통: 버튼
  const actionButtons = (
    <div className="flex gap-3">
      <Button variant="outline" tone="neutral" size="lg" onClick={() => onOpenChange(false)} disabled={isLoading} className="flex-1">
        계속 이용하기
      </Button>
      <Button variant="soft" tone="danger" size="lg" onClick={handleConfirm} disabled={isLoading} className="flex-1">
        {isLoading ? '처리 중...' : '중단하기'}
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className={isMobileView ? 'flex flex-col' : 'flex max-w-3xl items-center justify-center'}
      mobileVariant={isMobileView ? 'fullScreen' : 'center'}
      hideCloseButton={isMobileView}
    >
      {isMobileView ? (
        <>
          <div className="flex h-[67px] flex-shrink-0 items-center gap-3 border-b border-grey-30 px-4 py-3">
            <BackButton onClick={() => onOpenChange(false)} />
            <p className="text-l font-medium text-grey-80">정기 결제 중단하기</p>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-10">
            <div className="mb-8 text-center">
              <p className="font-emphasize text-grey-100">정말 정기결제를 중단하시겠어요?</p>
              <p className="font-emphasize text-grey-100">결제 중단 후 아래 기능을 더 이상 이용할 수 없습니다.</p>
            </div>
            <div className={isMobile ? 'flex flex-col items-center gap-4' : 'flex items-center gap-4'}>
              <div className={isMobile ? 'w-full' : 'flex-1 self-stretch'}>{currentPlanCard}</div>
              <div className="flex-shrink-0">
                <ArrowRightIcon size={24} className={`text-grey-60 ${isMobile ? 'rotate-90' : ''}`} />
              </div>
              <div className={isMobile ? 'w-full' : 'flex-1 self-stretch'}>{afterCancelCard}</div>
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
              <Title as="h2" className="text-xl font-headline">정기결제 중단하기</Title>
            </div>
            <div className="space-y-1">
              <Text className="font-emphasize">정말 정기결제를 중단하시겠어요?</Text>
              <Text className="font-emphasize">결제 중단 후 아래 기능을 더 이상 이용할 수 없습니다.</Text>
            </div>
          </div>
          <div className="flex w-full items-center justify-center gap-4">
            <div className="flex-1 self-stretch">{currentPlanCard}</div>
            <div className="flex-shrink-0"><ArrowRightIcon size={24} className="text-grey-60" /></div>
            <div className="flex-1 self-stretch">{afterCancelCard}</div>
          </div>
          {noticeText}
          <div className="flex justify-center gap-3">
            <Button variant="outline" tone="neutral" size="lg" onClick={() => onOpenChange(false)} disabled={isLoading} className="w-40">
              계속 이용하기
            </Button>
            <Button variant="soft" tone="danger" size="lg" onClick={handleConfirm} disabled={isLoading} className="w-40">
              {isLoading ? '처리 중...' : '중단하기'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
