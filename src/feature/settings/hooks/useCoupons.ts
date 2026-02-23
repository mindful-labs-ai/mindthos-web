import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/stores/authStore';

import { couponService } from '../services/couponService';

export const couponQueryKeys = {
  all: ['coupons'] as const,
  validate: (userId: string, planType?: string) =>
    planType
      ? (['coupons', userId, 'validate', planType] as const)
      : (['coupons', userId, 'validate'] as const),
};

/**
 * 유저의 쿠폰 목록을 조회하는 훅
 * - planType을 넘기면 해당 플랜에 대한 valid 검증 결과 포함
 * - 넘기지 않으면 전체 쿠폰 목록만 조회
 */
export const useCoupons = (planType?: string) => {
  const userId = useAuthStore((state) => state.userId);

  const query = useQuery({
    queryKey: couponQueryKeys.validate(userId ?? '', planType),
    queryFn: () => couponService.validateAll(planType),
    enabled: !!userId,
  });

  return {
    coupons: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
};
