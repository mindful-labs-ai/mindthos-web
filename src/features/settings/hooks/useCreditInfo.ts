import { useQuery } from '@tanstack/react-query';

import {
  creditService,
  type CreditInfo,
} from '@/shared/api/supabase/creditQueries';
import { creditQueryKeys } from '@/shared/constants/queryKeys';
import { useAuthStore } from '@/stores/authStore';

export const useCreditInfo = () => {
  const userId = useAuthStore((state) => state.userId);

  const userIdNumber = userId
    ? isNaN(Number(userId))
      ? null
      : Number(userId)
    : null;

  const summaryQuery = useQuery({
    queryKey: creditQueryKeys.summary(userIdNumber!),
    queryFn: () => creditService.getCreditSummary(),
    enabled: !!userIdNumber,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  let creditInfo: CreditInfo | undefined = undefined;
  if (summaryQuery.data) {
    const s = summaryQuery.data;
    creditInfo = {
      plan: {
        total: s.total_credit,
        used: s.used_credit,
        remaining: s.remaining_credit,
        type: s.plan_type,
        // 기존 인터페이스 호환 — description은 RPC에서 제공하지 않음
        description: '',
      },
      subscription: {
        start_at: s.start_at,
        end_at: s.end_at,
        reset_at: s.reset_at,
        scheduled_plan_id: s.scheduled_plan_id,
      },
    };
  }

  return {
    creditInfo,
    isLoading: summaryQuery.isLoading,
    error: summaryQuery.error?.message ?? null,
    refetch: () => summaryQuery.refetch(),
  };
};
