import { useQuery } from '@tanstack/react-query';

import {
  getCreditSummary,
  type CreditSummary,
} from '@/shared/api/server/creditServerApi';
import { billingService } from '@/shared/api/supabase/billingQueries';
import { planService, type Plan } from '@/shared/api/supabase/planQueries';
import {
  billingQueryKeys,
  creditQueryKeys,
  planQueryKeys,
} from '@/shared/constants/queryKeys';
import { useAuthStore } from '@/stores/authStore';

/** subscribe 테이블 최신 행 — Wallet summary가 담지 않는 예약 플랜 정보의 출처 */
type SubscriptionRow = Awaited<
  ReturnType<typeof billingService.getSubscription>
>;

export interface CreditInfo {
  wallet: {
    total: number;
    used: number;
    remaining: number;
  };
  plan: {
    total: number;
    used: number;
    remaining: number;
    type: string;
    description: string;
  };
  subscription: {
    start_at: string | null;
    end_at: string | null;
    reset_at: string | null;
    /** 예약된 플랜 변경. 해지면 Free, 다운그레이드면 대상 플랜이 들어온다 */
    scheduled_plan_id: string | null;
    /** 위 예약이 해지인지 다운그레이드인지 가르는 값. 조회 전에는 null */
    scheduled_plan_type: string | null;
  };
}

export const toCreditInfo = (
  summary: CreditSummary,
  plan: Plan | null | undefined,
  subscription?: SubscriptionRow | null,
  scheduledPlan?: Plan | null
): CreditInfo => {
  const walletTotal =
    summary.plan.issuedCredit + summary.promotional.issuedCredit;

  return {
    wallet: {
      total: walletTotal,
      used: walletTotal - summary.walletAvailableCredit,
      remaining: summary.walletAvailableCredit,
    },
    plan: {
      total: summary.plan.issuedCredit,
      used: summary.plan.issuedCredit - summary.plan.availableCredit,
      remaining: summary.plan.availableCredit,
      type: plan?.type ?? (summary.plan.issuedCredit > 0 ? 'Starter' : 'Free'),
      description: plan?.description ?? '',
    },
    subscription: {
      start_at: subscription?.start_at ?? null,
      end_at: summary.plan.periodEndsAt,
      reset_at: summary.plan.periodEndsAt,
      scheduled_plan_id: subscription?.scheduled_plan_id ?? null,
      scheduled_plan_type: scheduledPlan?.type ?? null,
    },
  };
};

export const useCreditInfo = () => {
  const userId = useAuthStore((state) => state.userId);

  const userIdNumber = userId
    ? isNaN(Number(userId))
      ? null
      : Number(userId)
    : null;

  const summaryQuery = useQuery({
    queryKey: creditQueryKeys.summary(userIdNumber!),
    queryFn: getCreditSummary,
    enabled: !!userIdNumber,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const planId = summaryQuery.data?.plan.planId ?? null;
  const planQuery = useQuery({
    queryKey: planQueryKeys.detail(planId ?? ''),
    queryFn: () => planService.getPlanById(planId!),
    enabled: !!planId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Wallet summary는 credit_grants 기반이라 subscribe의 예약 플랜(해지 예약)을 담지 않는다.
  const subscriptionQuery = useQuery({
    queryKey: billingQueryKeys.subscription(userIdNumber!),
    queryFn: () => billingService.getSubscription(userIdNumber!),
    enabled: !!userIdNumber,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // 예약 대상이 Free면 해지, 아니면 다운그레이드다. 같은 컬럼이라 플랜을 봐야 갈린다.
  const scheduledPlanId = subscriptionQuery.data?.scheduled_plan_id ?? null;
  const scheduledPlanQuery = useQuery({
    queryKey: planQueryKeys.detail(scheduledPlanId ?? ''),
    queryFn: () => planService.getPlanById(scheduledPlanId!),
    enabled: !!scheduledPlanId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  let creditInfo: CreditInfo | undefined = undefined;
  if (summaryQuery.data) {
    creditInfo = toCreditInfo(
      summaryQuery.data,
      planQuery.data,
      subscriptionQuery.data,
      scheduledPlanQuery.data
    );
  }

  return {
    creditInfo,
    isLoading:
      summaryQuery.isLoading ||
      planQuery.isLoading ||
      subscriptionQuery.isLoading ||
      scheduledPlanQuery.isLoading,
    error:
      summaryQuery.error?.message ??
      planQuery.error?.message ??
      subscriptionQuery.error?.message ??
      scheduledPlanQuery.error?.message ??
      null,
    refetch: async () => {
      await summaryQuery.refetch();
      if (planId) await planQuery.refetch();
      await subscriptionQuery.refetch();
      if (scheduledPlanId) await scheduledPlanQuery.refetch();
    },
  };
};
