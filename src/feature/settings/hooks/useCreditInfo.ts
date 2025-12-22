import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/stores/authStore';

import { creditService, type CreditInfo } from '../services/creditService';

export const useCreditInfo = () => {
  const userId = useAuthStore((state) => state.userId);

  const userIdNumber = userId
    ? isNaN(Number(userId))
      ? null
      : Number(userId)
    : null;

  // 구독 정보 쿼리
  const subscriptionQuery = useQuery({
    queryKey: ['credit', 'subscription', userIdNumber],
    queryFn: async () => {
      if (!userIdNumber) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }
      return await creditService.getSubscriptionInfo(userIdNumber);
    },
    enabled: !!userIdNumber,
    staleTime: 5000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: 5000,
  });

  // 사용량 정보 쿼리
  const usageQuery = useQuery({
    queryKey: ['credit', 'usage', userIdNumber],
    queryFn: async () => {
      if (!userIdNumber) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }
      return await creditService.getCreditUsage(userIdNumber);
    },
    enabled: !!userIdNumber,
    staleTime: 5000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: 5000,
  });

  let creditInfo: CreditInfo | undefined = undefined;
  if (subscriptionQuery.data && usageQuery.data) {
    const { plan, subscription } = subscriptionQuery.data;
    const { total_usage } = usageQuery.data;

    creditInfo = {
      plan: {
        total: plan.total_credit,
        used: total_usage,
        remaining: plan.total_credit - total_usage,
        type: plan.type,
        description: plan.description,
      },
      subscription,
    };
  }

  return {
    creditInfo,
    isLoading: subscriptionQuery.isLoading || usageQuery.isLoading,
    error:
      subscriptionQuery.error?.message ?? usageQuery.error?.message ?? null,
    refetch: () => {
      subscriptionQuery.refetch();
      usageQuery.refetch();
    },
  };
};
