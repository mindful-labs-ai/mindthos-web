import { useCallback } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import {
  billingQueryKeys,
  creditQueryKeys,
} from '@/shared/constants/queryKeys';
import { useAuthStore } from '@/stores/authStore';

/**
 * 구독 상태를 바꾼 뒤 화면을 갱신한다.
 *
 * 잔액·플랜은 Wallet summary에서, 해지/다운그레이드 예약은 subscribe 행에서 온다.
 * 둘 중 하나만 갱신하면 플랜은 바뀌었는데 예약 문구가 그대로이거나 그 반대가 된다.
 *
 * 설정 화면을 떠난 상태(결제 리다이렉트 등)에서 호출할 때는 refetchType:'all'을 준다.
 * 기본값 'active'는 inactive 쿼리를 stale로 표시만 하는데, 전역 refetchOnMount가
 * false라 돌아와도 리페치되지 않고 옛 값이 그대로 쓰인다.
 */
export const useInvalidateSubscriptionViews = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);

  return useCallback(
    async (options?: { refetchType?: 'active' | 'all' }) => {
      if (!userId) return;
      const userIdNumber = parseInt(userId);
      if (isNaN(userIdNumber)) return;

      const refetchType = options?.refetchType;

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: creditQueryKeys.summary(userIdNumber),
          ...(refetchType && { refetchType }),
        }),
        queryClient.invalidateQueries({
          queryKey: billingQueryKeys.subscription(userIdNumber),
          ...(refetchType && { refetchType }),
        }),
      ]);
    },
    [queryClient, userId]
  );
};
