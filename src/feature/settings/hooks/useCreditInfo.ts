import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/stores/authStore';

import { creditService, type CreditInfo } from '../services/creditService';

const REFETCH_INTERVAL = 60 * 1000;

export const useCreditInfo = () => {
  const userId = useAuthStore((state) => state.userId);
  const subscriptionInfo = useAuthStore((state) => state.subscriptionInfo);

  const userIdNumber = useMemo(() => {
    if (!userId) return null;
    const num = Number(userId);
    return isNaN(num) ? null : num;
  }, [userId]);

  const usageQuery = useQuery({
    queryKey: ['credit', 'usage', userIdNumber],
    queryFn: async () => {
      if (!userIdNumber) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }
      return await creditService.getCreditUsage(userIdNumber);
    },
    enabled: !!userIdNumber,
    refetchInterval: REFETCH_INTERVAL,
  });

  const creditInfo: CreditInfo | undefined = useMemo(() => {
    if (!subscriptionInfo || !usageQuery.data) return undefined;

    const { plan, subscription } = subscriptionInfo;
    const { total_usage } = usageQuery.data;

    return {
      plan: {
        total: plan.total_credit,
        used: total_usage,
        remaining: plan.total_credit - total_usage,
        type: plan.type,
        description: plan.description,
      },
      subscription,
    };
  }, [subscriptionInfo, usageQuery.data]);

  return {
    creditInfo,
    isLoading: usageQuery.isLoading,
    error: usageQuery.error?.message ?? null,
    refetch: usageQuery.refetch,
  };
};
