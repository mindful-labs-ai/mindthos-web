import { useEffect, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { Card } from '@/components/ui/composites/Card';
import { useToast } from '@/components/ui/composites/Toast';
import { trackEvent } from '@/lib/mixpanel';
import { useAuthStore } from '@/stores/authStore';

import { billingService } from '../services/billingService';

export const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const user = useAuthStore((state) => state.user);
  const userId = useAuthStore((state) => state.userId);
  const userName = useAuthStore((state) => state.userName);
  const hasExecuted = useRef(false);

  const customerKey = searchParams.get('customerKey');
  const authKey = searchParams.get('authKey');
  const planId = searchParams.get('planId');

  useEffect(() => {
    // 이미 실행된 경우 중복 실행 방지
    if (hasExecuted.current) return;

    const handlePaymentSuccess = async () => {
      hasExecuted.current = true;

      if (!customerKey || !authKey) {
        toast({
          title: '잘못된 요청',
          description: '필수 파라미터가 누락되었습니다.',
        });
        navigate('/settings');
        return;
      }

      let buyerName = userName;

      // 사용자 정보 확인
      if (!user?.email) {
        toast({
          title: '사용자 정보 오류',
          description: '사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.',
        });
        navigate('/settings');
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
          });

          if (response.success) {
            // 크레딧 관련 쿼리 invalidate
            if (userId) {
              const userIdNumber = parseInt(userId);
              if (!isNaN(userIdNumber)) {
                await queryClient.invalidateQueries({
                  queryKey: ['credit', 'subscription', userIdNumber],
                });
                await queryClient.invalidateQueries({
                  queryKey: ['credit', 'usage', userIdNumber],
                });
              }
            }

            trackEvent('plan_upgrade_success', { plan_id: planId });

            toast({
              title: '플랜 업그레이드 완료',
              description: '플랜이 성공적으로 업그레이드되었습니다.',
            });
            navigate('/settings');
          } else {
            throw new Error(
              response.message || '플랜 업그레이드에 실패했습니다.'
            );
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
              queryKey: ['cardInfo', userId],
            });
          }

          toast({
            title: '카드 등록 완료',
            description: '카드가 성공적으로 등록되었습니다.',
          });
        }

        // 설정 페이지로 이동
        navigate('/settings');
      } catch (error) {
        if (planId) {
          trackEvent('plan_upgrade_failed', {
            plan_id: planId,
            error_message:
              error instanceof Error ? error.message : 'Unknown error',
          });
        }

        toast({
          title: planId ? '플랜 업그레이드 실패' : '카드 등록 실패',
          description:
            error instanceof Error
              ? error.message
              : `${planId ? '플랜 업그레이드' : '카드 등록'} 중 오류가 발생했습니다.`,
        });
        navigate('/settings');
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
            <Title className="text-2xl font-bold">
              {planId ? '플랜 업그레이드 처리 중' : '카드 등록 처리 중'}
            </Title>
            <Text className="mt-2 text-gray-600">
              {isLoading
                ? planId
                  ? '빌링키 발급 및 결제를 처리하고 있습니다...'
                  : '빌링키를 안전하게 발급받고 있습니다...'
                : '잠시만 기다려주세요.'}
            </Text>
          </div>

          <Button
            onClick={() => navigate('/settings')}
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
