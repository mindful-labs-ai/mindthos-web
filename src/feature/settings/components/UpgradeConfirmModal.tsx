import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { Modal } from '@/components/ui/composites/Modal';
import { useToast } from '@/components/ui/composites/Toast';
import { getCardBrandName } from '@/feature/payment/constants/card';
import { trackError, trackEvent } from '@/lib/mixpanel';
import { formatPrice } from '@/shared/utils/format';

import { useCoupons } from '../hooks/useCoupons';
import type { Coupon } from '../types/coupon';

import { CouponBox } from './CouponBox';

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
}) => {
  const { toast } = useToast();
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
    trackEvent('plan_upgrade_attempt', {
      current_plan: previewData?.currentPlan?.type,
      new_plan: previewData?.newPlan?.type,
      coupon_id: selectedCoupon?.id,
    });
    try {
      await onConfirm(selectedCoupon?.id ?? undefined);
      onOpenChange(false);
    } catch (error) {
      trackError('plan_upgrade_error', error, {
        current_plan: previewData?.currentPlan?.type,
        new_plan: previewData?.newPlan?.type,
      });
      toast({
        title: '플랜 업그레이드 실패',
        description: '플랜 업그레이드에 실패했습니다. 다시 시도해주세요.',
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

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className="flex h-[836px] max-h-[90%] w-full max-w-[1380px] items-center justify-center"
    >
      <div className="flex w-full max-w-[784px] flex-col items-center justify-center gap-8">
        {/* 헤더 */}
        <div className="text-center">
          <Title as="h2" className="text-xl font-bold">
            마음토스 플랜 업그레이드
          </Title>
        </div>

        {/* 결제 금액 카드 */}
        <div className="w-full rounded-xl border border-border p-6">
          <div className="relative mb-4 flex items-center justify-between">
            <Title as="h3" className="text-lg font-semibold">
              결제 금액
            </Title>
            {coupons.length > 0 && (
              <Button
                variant="outline"
                tone="neutral"
                size="sm"
                onClick={() => setIsCouponDropdownOpen((prev) => !prev)}
              >
                쿠폰 사용하기({coupons.length})
              </Button>
            )}
            {isCouponDropdownOpen && (
              <div className="absolute right-0 top-full z-20 mt-2">
                <CouponBox
                  variant="dropdown"
                  coupons={coupons}
                  isLoading={isCouponsLoading}
                  selectedCouponId={selectedCoupon?.id ?? null}
                  onSelect={setSelectedCoupon}
                  onClose={() => setIsCouponDropdownOpen(false)}
                />
              </div>
            )}
          </div>

          {/* 요금제 */}
          <div className="space-y-6">
            <Text className="text-sm text-fg-muted">요금제</Text>

            {/* 변경 플랜 */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="rounded border border-primary bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary">
                  변경
                </span>
                <div className="text-left">
                  <Text className="text-left font-medium">
                    {getPlanDisplayName(newPlan.type)} 플랜
                  </Text>
                  <Text className="text-sm text-fg-muted">
                    이용 기간 : {period.start} ~ {period.end}
                  </Text>
                </div>
              </div>
              <Text className="font-medium">
                {formatPrice(newPlan.price)}원
              </Text>
            </div>

            {/* 현재 플랜 */}
            {currentPlan.type === 'Free' || (
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 text-start">
                  <span className="rounded border border-border px-2 py-0.5 text-xs font-medium text-fg-muted">
                    현재
                  </span>
                  <div>
                    <Text className="font-medium text-fg">
                      {getPlanDisplayName(currentPlan.type)} 플랜
                    </Text>
                    <Text className="text-sm text-fg-muted">
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
                <Text className="text-center text-xs text-fg-muted">
                  *변경할 요금제와 현재 요금제의 차액이 결제됩니다.
                </Text>
              </div>
            )}
          </div>

          {/* 총 결제 금액 */}
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <Text className="font-medium">총 결제 금액</Text>
            <Title as="h2" className="text-2xl font-bold">
              {formatPrice(finalAmount)}원
            </Title>
          </div>

          {/* 쿠폰 할인 */}
          {selectedCoupon && (
            <>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Text className="text-sm font-medium text-primary-600">
                    쿠폰 사용 ({selectedCoupon.title})
                  </Text>
                  <span className="rounded-full bg-primary-500 px-2.5 py-0.5 text-xs font-medium text-white">
                    {selectedCoupon.discount}% 할인
                  </span>
                </div>
                <Text className="font-medium text-primary-500">
                  -{formatPrice(couponDiscountAmount)}원
                </Text>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <Text className="font-medium">할인 적용 결제 금액</Text>
                <Title as="h2" className="text-2xl font-bold">
                  {formatPrice(totalAmount)}원
                </Title>
              </div>
            </>
          )}

          {/* 결제 카드 */}
          {displayCardInfo && (
            <div className="mt-4 flex items-center justify-between rounded-lg bg-surface-contrast p-4 text-start">
              <div>
                <Text className="text-sm text-fg-muted">결제 카드</Text>
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
        </div>

        {/* 약관 동의 및 결제 버튼 */}
        <div className="flex w-full flex-col items-center gap-4">
          <Text className="text-sm text-fg-muted">
            <a
              href="/terms?type=service"
              target="_blank"
              rel="noopener noreferrer"
              className="underline transition-colors hover:text-primary-600"
            >
              결제 약관
            </a>
            에 동의합니다.
          </Text>
          <Button
            variant="solid"
            tone="primary"
            size="lg"
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full max-w-[375px] bg-gradient-to-r from-green-500 via-lime-400 to-amber-200 text-surface"
          >
            {isLoading ? '처리 중...' : '결제하기'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
