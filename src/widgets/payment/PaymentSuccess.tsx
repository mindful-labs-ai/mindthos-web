import { useEffect, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import { ROUTES } from '@/app/router/constants';
import { trackEvent } from '@/lib/mixpanel';
import { billingService } from '@/shared/api/supabase/billingQueries';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { cardQueryKeys, creditQueryKeys } from '@/shared/constants/queryKeys';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { Button } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Text';
import { Title } from '@/shared/ui/atoms/Title';
import { Card } from '@/shared/ui/composites/Card';
import { useToast } from '@/shared/ui/composites/Toast';
import { useAuthStore } from '@/stores/authStore';
import { useQuestStore } from '@/stores/questStore';

export const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const { navigateWithUtm } = useNavigateWithUtm();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const user = useAuthStore((state) => state.user);
  const userId = useAuthStore((state) => state.userId);
  const userName = useAuthStore((state) => state.userName);
  const hasExecuted = useRef(false);
  const initializeQuest = useQuestStore((state) => state.initializeQuest);

  const customerKey = searchParams.get('customerKey');
  const authKey = searchParams.get('authKey');
  const planId = searchParams.get('planId');
  const userCouponId = searchParams.get('userCouponId');

  useEffect(() => {
    // 이미 실행된 경우 중복 실행 방지
    if (hasExecuted.current) return;

    const handlePaymentSuccess = async () => {
      hasExecuted.current = true;

      if (!customerKey || !authKey) {
        toast({
          title: '결제를 진행할 수 없어요',
          description: '필요한 정보가 누락됐어요. 잠시 후 다시 시도해 주세요.',
        });
        navigateWithUtm(ROUTES.SETTINGS);
        return;
      }

      let buyerName = userName;

      // 사용자 정보 확인
      if (!user?.email) {
        toast({
          title: '사용자 정보 오류',
          description: '사용자 정보를 찾을 수 없어요. 다시 로그인해 주세요.',
        });
        navigateWithUtm(ROUTES.SETTINGS);
        return;
      }

      if (!buyerName) {
        buyerName = user.email.split('@')[0];
      }

      try {
        setIsLoading(true);

        if (planId) {
          // planId가 있으면 플랜 업그레이드 완료 (빌링키 발급 + 결제 + 구독 생성)
          const response = await billingService.completePlanUpgrade({
            customerKey,
            authKey,
            planId,
            customerEmail: user.email,
            customerName: buyerName,
            ...(userCouponId && { userCouponId }),
          });

          if (response.success) {
            // 크레딧/구독/사용량 단일 RPC로 통합 — summary key만 invalidate
            if (userId) {
              const userIdNumber = parseInt(userId);
              if (!isNaN(userIdNumber)) {
                await queryClient.invalidateQueries({
                  queryKey: creditQueryKeys.summary(userIdNumber),
                });
              }
            }

            trackEvent(MixpanelEvent.PlanUpgradeSuccess, { plan_id: planId });

            // 플랜 변경 후 퀘스트 상태 갱신 (온보딩 노출 조건 업데이트)
            if (user?.email) {
              await initializeQuest(user.email);
            }

            toast({
              title: '플랜 변경 완료',
              description: '플랜을 변경했어요.',
            });
            navigateWithUtm(ROUTES.SETTINGS);
          } else {
            throw new Error(response.message || '플랜을 변경하지 못했어요.');
          }
        } else {
          // planId가 없으면 단순 카드 등록 (빌링키 발급 및 저장)
          await billingService.registerCard({
            customerKey,
            authKey,
          });

          // 카드 정보 쿼리 invalidate
          if (userId) {
            await queryClient.invalidateQueries({
              queryKey: cardQueryKeys.info(userId!),
            });
          }

          toast({
            title: '카드 등록 완료',
            description: '카드를 등록했어요.',
          });
        }

        // 설정 페이지로 이동
        navigateWithUtm(ROUTES.SETTINGS);
      } catch (error) {
        if (planId) {
          trackEvent(MixpanelEvent.PlanUpgradeFailed, {
            plan_id: planId,
            error_message:
              error instanceof Error ? error.message : 'Unknown error',
          });
        }

        toast({
          title: planId ? '플랜 변경 실패' : '카드 등록 실패',
          description:
            error instanceof Error
              ? error.message
              : `${planId ? '플랜 변경' : '카드 등록'} 중에 문제가 생겼어요.`,
        });
        navigateWithUtm(ROUTES.SETTINGS);
      } finally {
        setIsLoading(false);
      }
    };

    handlePaymentSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <Title className="typo-xl font-headline">
              {planId ? '플랜 변경 처리 중' : '카드 등록 처리 중'}
            </Title>
            <Text className="mt-2 text-gray-600">
              {isLoading
                ? planId
                  ? '결제를 준비하고 있어요. 잠시만 기다려 주세요.'
                  : '카드 정보를 안전하게 등록하고 있어요.'
                : '잠시만 기다려 주세요.'}
            </Text>
          </div>

          <Button
            onClick={() => navigateWithUtm(ROUTES.SETTINGS)}
            disabled={isLoading}
            className="w-full"
          >
            설정으로 돌아가기
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
