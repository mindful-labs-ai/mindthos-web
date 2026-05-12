import { useCallback } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import {
  creditService,
  type CreditSummary,
} from '@/shared/api/supabase/creditQueries';
import { creditQueryKeys } from '@/shared/constants/queryKeys';
import { useAuthStore } from '@/stores/authStore';

export interface CreditGuardResult {
  ok: boolean;
  required: number;
  remaining: number;
  summary: CreditSummary | null;
  /** userId가 없거나 RPC가 실패한 경우 */
  unavailable?: boolean;
}

export const useCreditGuard = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);

  return useCallback(
    async (required: number): Promise<CreditGuardResult> => {
      const userIdNumber = userId
        ? isNaN(Number(userId))
          ? null
          : Number(userId)
        : null;

      if (!userIdNumber) {
        return {
          ok: false,
          required,
          remaining: 0,
          summary: null,
          unavailable: true,
        };
      }

      const queryKey = creditQueryKeys.summary(userIdNumber);

      // 캐시 무효화 후 강제 refetch
      await queryClient.invalidateQueries({ queryKey });

      try {
        const summary = await queryClient.fetchQuery({
          queryKey,
          queryFn: () => creditService.getCreditSummary(),
          staleTime: 0,
        });

        return {
          ok: summary.remaining_credit >= required,
          required,
          remaining: summary.remaining_credit,
          summary,
        };
      } catch {
        // RPC 실패 — UX는 서버 응답을 신뢰하도록 통과시키되 unavailable 플래그
        return {
          ok: true,
          required,
          remaining: 0,
          summary: null,
          unavailable: true,
        };
      }
    },
    [queryClient, userId]
  );
};
