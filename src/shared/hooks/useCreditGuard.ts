import { useCallback } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import {
  getCreditSummary,
  type CreditSummary,
} from '@/shared/api/server/creditServerApi';
import { creditQueryKeys } from '@/shared/constants/queryKeys';
import { useAuthStore } from '@/stores/authStore';

export interface CreditGuardResult {
  ok: boolean;
  required: number;
  remaining: number;
  summary: CreditSummary | null;
  /** userId가 없거나 서버 조회가 실패한 경우 */
  unavailable?: boolean;
}

export const canUseCredit = (summary: CreditSummary, required: number) =>
  summary.walletAvailableCredit >= required;

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
          queryFn: getCreditSummary,
          staleTime: 0,
        });

        return {
          ok: canUseCredit(summary, required),
          required,
          remaining: summary.walletAvailableCredit,
          summary,
        };
      } catch {
        // 조회 실패 — 실제 command의 서버 권한 검사를 신뢰하고 unavailable로 표시
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
