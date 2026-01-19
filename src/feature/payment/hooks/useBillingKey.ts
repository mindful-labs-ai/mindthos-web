// TODO: 삭제 예정 - 결제 로직 변경으로 사용되지 않음
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/stores/authStore';

import { billingService } from '../services/billingService';

/**
 * 사용자의 구독 정보(빌링키 포함) 조회 Hook
 */
export const useSubscription = () => {
  const user = useAuthStore((state) => state.user);
  const userDbId = user?.db_id ? Number(user.db_id) : null;

  return useQuery({
    queryKey: ['subscription', userDbId],
    queryFn: () => billingService.getSubscription(userDbId!),
    enabled: !!userDbId && !isNaN(userDbId),
    // 전역 설정 사용: staleTime 5분, refetchOnWindowFocus/Mount/Reconnect false
  });
};

/**
 * 빌링키 존재 여부만 확인하는 Hook
 */
export const useBillingKey = () => {
  const { data: subscription, isLoading, error } = useSubscription();

  return {
    data: subscription?.billing_key ?? null,
    isLoading,
    error,
  };
};

/**
 * 사용자의 카드 정보 조회 Hook
 */
export const useCard = () => {
  const user = useAuthStore((state) => state.user);
  const userDbId = user?.db_id ? Number(user.db_id) : null;

  return useQuery({
    queryKey: ['card', userDbId],
    queryFn: () => billingService.getCard(userDbId!),
    enabled: !!userDbId && !isNaN(userDbId),
    // 전역 설정 사용: staleTime 5분, refetchOnWindowFocus/Mount/Reconnect false
  });
};
