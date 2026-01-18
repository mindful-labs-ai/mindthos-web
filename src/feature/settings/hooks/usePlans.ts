import { useQuery } from '@tanstack/react-query';

import { planService } from '../services/planService';

/**
 * 모든 플랜 조회 Hook
 */
export const usePlans = () => {
  return useQuery({
    queryKey: ['plans'],
    queryFn: () => planService.getAllPlans(),
    // 전역 설정 사용: staleTime Infinity, refetchOnWindowFocus/Mount/Reconnect false
  });
};

/**
 * 월간 플랜 조회 Hook
 */
export const useMonthlyPlans = () => {
  return useQuery({
    queryKey: ['plans', 'monthly'],
    queryFn: () => planService.getMonthlyPlans(),
    // 전역 설정 사용: staleTime Infinity, refetchOnWindowFocus/Mount/Reconnect false
  });
};

/**
 * 연간 플랜 조회 Hook
 */
export const useYearlyPlans = () => {
  return useQuery({
    queryKey: ['plans', 'yearly'],
    queryFn: () => planService.getYearlyPlans(),
    // 전역 설정 사용: staleTime Infinity, refetchOnWindowFocus/Mount/Reconnect false
  });
};

/**
 * 월간/연간 플랜 분리 조회 Hook
 */
export const usePlansByPeriod = () => {
  const { data: allPlans, isLoading, error } = usePlans();

  const monthlyPlans =
    allPlans?.filter((plan) => !plan.is_year && plan.type !== 'Free') ?? [];
  const yearlyPlans =
    allPlans?.filter((plan) => plan.is_year && plan.type !== 'Free') ?? [];

  return {
    monthlyPlans,
    yearlyPlans,
    allPlans: allPlans ?? [],
    isLoading,
    error,
  };
};
