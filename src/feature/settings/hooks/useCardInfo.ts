import { useQuery } from '@tanstack/react-query';

import { billingService } from '@/feature/payment/services/billingService';
import { useAuthStore } from '@/stores/authStore';

export const useCardInfo = () => {
  const userId = useAuthStore((state) => state.userId);

  const { data: cardInfo, isLoading } = useQuery({
    queryKey: ['cardInfo', userId],
    queryFn: async () => {
      if (!userId) return null;
      return await billingService.getCard(Number(userId));
    },
    enabled: !!userId,
    // 전역 설정 사용: staleTime 5분, refetchOnWindowFocus/Mount/Reconnect false
  });

  return {
    cardInfo,
    isLoading,
  };
};
