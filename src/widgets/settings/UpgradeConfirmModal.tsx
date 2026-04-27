import React, { useEffect, useState } from 'react';

import { getTermsRoute, TERMS_TYPES } from '@/app/router/constants';
import { useCoupons } from '@/features/settings/hooks/useCoupons';
import type { Coupon } from '@/features/settings/types/coupon';
import { trackError, trackEvent } from '@/lib/mixpanel';
import { getCardBrandName } from '@/shared/constants/card';
import {
  MixpanelError,
  MixpanelEvent,
} from '@/shared/constants/mixpanelEvents';
import { getPlanDisplayName } from '@/shared/constants/planNames';
import { useDevice } from '@/shared/hooks/useDevice';
import { BackButton } from '@/shared/ui/atoms/BackButton';
import { Button } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Text';
import { Title } from '@/shared/ui/atoms/Title';
import { Modal } from '@/shared/ui/composites/Modal';
import { useToast } from '@/shared/ui/composites/Toast';
import { formatPrice } from '@/shared/utils/format';

import { CouponBox } from './CouponBox';

// --- 모바일 쿠폰 선택 fullScreen 모달 ---
const MobileCouponSelectModal: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupons: Coupon[];
  isLoading: boolean;
  selectedCouponId: string | null;
  onSelect: (coupon: Coupon | null) => void;
}> = ({
  open,
  onOpenChange,
  coupons,
  isLoading,
  selectedCouponId,
  onSelect,
}) => {
  const [internalSelected, setInternalSelected] = React.useState<string | null>(
    selectedCouponId
  );

  React.useEffect(() => {
    if (open) setInternalSelected(selectedCouponId);
  }, [open, selectedCouponId]);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      mobileVariant="fullScreen"
      hideCloseButton
      className="flex flex-col"
    >
      <div className="flex h-[67px] flex-shrink-0 items-center gap-3 border-b border-grey-30 px-4 py-3">
        <BackButton onClick={() => onOpenChange(false)} />
        <p className="text-m font-medium text-grey-100">사용 가능한 쿠폰</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-10">
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-grey-60">쿠폰 불러오는 중...</p>
            </div>
          ) : coupons.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-grey-60">사용할 수 있는 쿠폰이 없어요.</p>
            </div>
          ) : (
            coupons.map((coupon) => {
              const isSelected = internalSelected === coupon.id;
              return (
                <button
                  key={coupon.id}
                  type="button"
                  onClick={() =>
                    setInternalSelected((prev) =>
                      prev === coupon.id ? null : coupon.id
                    )
                  }
                  className={`w-full rounded-md border bg-grey-10 px-4 py-5 text-left transition-colors ${
                    isSelected ? 'border-green-80' : 'border-grey-40'
                  }`}
                >
                  <p className="text-m font-medium text-grey-100">
                    {coupon.title}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm text-grey-60">
                      {new Date(coupon.expiresAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                      까지
                    </p>
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full ${isSelected ? 'bg-green-80' : 'bg-grey-40'}`}
                    >
                      <svg
                        className="h-4 w-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
      <div className="flex-shrink-0 px-4 pb-4 md:px-10">
        <Button
          variant="solid"
          tone="primary"
          size="lg"
          className="w-full"
          disabled={!internalSelected}
          onClick={() => {
            const selected =
              coupons.find((c) => c.id === internalSelected) ?? null;
            onSelect(selected);
            onOpenChange(false);
          }}
        >
          선택하기
        </Button>
      </div>
    </Modal>
  );
};

export interface UpgradePreviewData {
  currentPlan: { id: string; type: string; price: number; totalCredit: number };
  newPlan: { id: string; type: string; price: number; totalCredit: number };
  remainingCredit: number;
  discount: number;
  finalAmount: number;
  cardInfo?: {
    type: string;
    number: string;
    company: string | null;
  };
}

export interface UpgradeConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewData: UpgradePreviewData | null;
  cardInfo?: {
    type: string;
    number: string;
    company: string | null;
  };
  onConfirm: (userCouponId?: string) => Promise<void>;
  onChangeCard?: () => void;
  title?: string;
}

// 날짜 포맷팅
const formatDateFromDate = (date: Date) => {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// 카드 번호 포맷팅 (4자리마다 - 추가)
const formatCardNumber = (number: string) => {
  return number.replace(/(.{4})/g, '$1-').replace(/-$/, '');
};

// 이용 기간 계산 (오늘 ~ 익월 동일 일자 -1일)
const calculatePeriod = () => {
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(nextMonth.getDate() - 1);

  return {
    start: formatDateFromDate(today),
    end: formatDateFromDate(nextMonth),
  };
};

export const UpgradeConfirmModal: React.FC<UpgradeConfirmModalProps> = ({
  open,
  onOpenChange,
  previewData,
  cardInfo,
  onConfirm,
  onChangeCard,
  title,
}) => {
  const { toast } = useToast();
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const [isLoading, setIsLoading] = useState(false);
  const [isCouponDropdownOpen, setIsCouponDropdownOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  // 변경할 플랜 타입으로 쿠폰 검증
  const { coupons, isLoading: isCouponsLoading } = useCoupons(
    previewData?.newPlan.type
  );

  // 모달 열릴 때 / 쿠폰 목록 변경 시: 드롭다운 닫고, 최대 할인 쿠폰 자동 적용
  useEffect(() => {
    if (!open) return;
    trackEvent(MixpanelEvent.PlanUpgradeConfirmModalOpen);
    setIsCouponDropdownOpen(false);
    if (coupons.length > 0) {
      const best = coupons.reduce(
        (max, c) => (c.discount > max.discount ? c : max),
        coupons[0]
      );
      setSelectedCoupon(best);
    } else {
      setSelectedCoupon(null);
    }
  }, [open, coupons]);

  const handleConfirm = async () => {
    setIsLoading(true);
    trackEvent(MixpanelEvent.PlanUpgradeAttempt, {
      current_plan: previewData?.currentPlan?.type,
      new_plan: previewData?.newPlan?.type,
      coupon_id: selectedCoupon?.id,
    });
    try {
      await onConfirm(selectedCoupon?.id ?? undefined);
      onOpenChange(false);
    } catch (error) {
      trackError(MixpanelError.PlanUpgradeError, error, {
        current_plan: previewData?.currentPlan?.type,
        new_plan: previewData?.newPlan?.type,
      });
      toast({
        title: '플랜 변경 실패',
        description:
          '플랜을 변경하지 못했어요. 카드 정보 혹은 계좌 잔액을 확인한 뒤 다시 시도해 주세요.',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!previewData) return null;

  const { currentPlan, newPlan, remainingCredit, discount, finalAmount } =
    previewData;

  // 쿠폰 할인 계산: 결제금액 = 원래금액 × (1 - discount / 100), 소수점 반올림
  const couponDiscountAmount = selectedCoupon
    ? Math.round(finalAmount * (selectedCoupon.discount / 100))
    : 0;
  const totalAmount = finalAmount - couponDiscountAmount;

  // 카드 정보 (previewData에서 오거나 props에서 옴)
  const displayCardInfo = previewData.cardInfo || cardInfo;

  // 이용 기간 계산
  const period = calculatePeriod();

  // 공통: 결제 금액 카드 내용
  const paymentContent = (
    <>
      <div className="relative mb-4 flex items-center justify-between">
        <Title as="h3" className="typo-l font-emphasize">
          결제 금액
        </Title>
        {coupons.length > 0 && (
          <button
            onClick={() => setIsCouponDropdownOpen((prev) => !prev)}
            className="rounded-md border border-grey-30 px-3 py-1 text-sm font-medium text-grey-70 transition-colors lg:hover:bg-grey-10"
          >
            쿠폰 사용하기({coupons.length})
          </button>
        )}
        {/* 데스크탑: dropdown */}
        {!isMobileView && isCouponDropdownOpen && (
          <div className="absolute right-0 top-full z-20 mt-2">
            <CouponBox
              variant="dropdown"
              coupons={coupons}
              isLoading={isCouponsLoading}
              selectedCouponId={selectedCoupon?.id ?? null}
              onSelect={(coupon) => {
                setSelectedCoupon(coupon);
                setIsCouponDropdownOpen(false);
              }}
              onClose={() => setIsCouponDropdownOpen(false)}
            />
          </div>
        )}
        {/* 모바일/태블릿: 쿠폰 선택 fullScreen */}
        {isMobileView && (
          <MobileCouponSelectModal
            open={isCouponDropdownOpen}
            onOpenChange={setIsCouponDropdownOpen}
            coupons={coupons}
            isLoading={isCouponsLoading}
            selectedCouponId={selectedCoupon?.id ?? null}
            onSelect={(coupon) => {
              setSelectedCoupon(coupon);
            }}
          />
        )}
      </div>

      {/* 플랜 */}
      <div className="space-y-6">
        <Text className="typo-sm text-fg-muted">플랜</Text>

        {/* 변경 플랜 */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <span className="typo-xs rounded border border-primary bg-primary-subtle px-2 py-0.5 font-medium text-primary">
              변경
            </span>
            <div className="text-left">
              <Text className="text-left font-medium">
                {getPlanDisplayName(newPlan.type)} 플랜
              </Text>
              <Text className="typo-sm text-fg-muted">
                이용 기간 : {period.start} ~ {period.end}
              </Text>
            </div>
          </div>
          <Text className="font-medium">{formatPrice(newPlan.price)}원</Text>
        </div>

        {/* 현재 플랜 */}
        {currentPlan.type === 'Free' || (
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 text-start">
              <span className="typo-xs rounded border border-border px-2 py-0.5 font-medium text-fg-muted">
                현재
              </span>
              <div>
                <Text className="font-medium text-fg">
                  {getPlanDisplayName(currentPlan.type)} 플랜
                </Text>
                <Text className="typo-sm text-fg-muted">
                  잔여 크레딧 : {remainingCredit.toLocaleString()} 크레딧
                </Text>
              </div>
            </div>
            <Text className="font-medium text-fg">
              -{formatPrice(discount)}원
            </Text>
          </div>
        )}

        {/* 안내 문구 */}
        {currentPlan.type === 'Free' || (
          <div className="pt-4">
            <Text className="typo-xs text-center text-fg-muted">
              *변경하는 플랜과 현재 플랜의 차액이 결제돼요.
            </Text>
          </div>
        )}
      </div>

      {/* 총 결제 금액 */}
      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <Text className="font-medium">총 결제 금액</Text>
        <Title as="h2" className="typo-xl font-headline">
          {formatPrice(finalAmount)}원
        </Title>
      </div>

      {/* 쿠폰 할인 */}
      {selectedCoupon && (
        <>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Text className="typo-sm font-medium text-primary">
                쿠폰 사용 ({selectedCoupon.title})
              </Text>
              <span className="typo-xs rounded-full bg-green-80 px-2.5 py-0.5 font-medium text-primary-fg">
                {selectedCoupon.discount}% 할인
              </span>
            </div>
            <Text className="font-medium text-primary">
              -{formatPrice(couponDiscountAmount)}원
            </Text>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <Text className="font-medium">할인 적용 결제 금액</Text>
            <Title as="h2" className="typo-xl font-headline">
              {formatPrice(totalAmount)}원
            </Title>
          </div>
        </>
      )}

      {/* 결제 카드 */}
      {displayCardInfo && (
        <div className="mt-4 flex items-center justify-between rounded-md border border-grey-40 bg-grey-20 p-4 text-start">
          <div>
            <Text className="typo-sm text-fg-muted">결제 카드</Text>
            <Text className="font-medium">
              {getCardBrandName(displayCardInfo.company) || ''}{' '}
              {formatCardNumber(displayCardInfo.number)}
            </Text>
          </div>
          {onChangeCard && (
            <Button
              variant="outline"
              tone="neutral"
              size="sm"
              onClick={onChangeCard}
            >
              결제 수단 변경
            </Button>
          )}
        </div>
      )}
    </>
  );

  // 공통: 약관 + 결제 버튼
  const footerContent = (
    <>
      <Text className="text-sm text-grey-60">
        <a
          href={getTermsRoute(TERMS_TYPES.SERVICE)}
          target="_blank"
          rel="noopener noreferrer"
          className="underline transition-colors lg:hover:text-grey-80"
        >
          결제 약관
        </a>
        에 동의해요.
      </Text>
      <Button
        variant="solid"
        tone="primary"
        size="lg"
        onClick={handleConfirm}
        disabled={isLoading}
        className="w-full max-w-[375px] bg-gradient-to-r from-green-500 via-lime-400 to-amber-200 text-white"
      >
        {isLoading ? '처리 중...' : '결제하기'}
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className={
        isMobileView
          ? 'flex flex-col'
          : 'flex h-[836px] max-h-[90%] w-full max-w-[1380px] items-center justify-center'
      }
      mobileVariant={isMobileView ? 'fullScreen' : 'center'}
      hideCloseButton={isMobileView}
      closeOnOverlay={!isCouponDropdownOpen}
    >
      {isMobileView ? (
        <>
          <div className="flex h-[67px] flex-shrink-0 items-center gap-3 border-b border-grey-30 px-4 py-3">
            <BackButton onClick={() => onOpenChange(false)} />
            <p className="text-m font-medium text-grey-100">
              {title || '마음토스 플랜 변경'}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-10">
            {paymentContent}
          </div>
          <div className="pointer-events-none relative z-10 -mt-8 h-8 flex-shrink-0 bg-gradient-to-t from-white to-transparent" />
          <div className="flex flex-shrink-0 flex-col items-center gap-y-2 px-4 pb-4 md:px-10">
            {footerContent}
          </div>
        </>
      ) : (
        <div className="flex w-full max-w-[784px] flex-col items-center justify-center gap-8">
          <div className="text-center">
            <Title as="h2" className="text-xl font-headline text-grey-100">
              {title || '마음토스 플랜 변경'}
            </Title>
          </div>
          <div className="w-full rounded-xl border border-grey-30 p-6">
            {paymentContent}
          </div>
          <div className="flex w-full flex-col items-center gap-4">
            {footerContent}
          </div>
        </div>
      )}
    </Modal>
  );
};
