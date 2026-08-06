/**
 * 개별 세션 조회 Hook (TanStack Query)
 */

import { useQuery } from '@tanstack/react-query';

import { getSessionDetail } from '@/shared/api/supabase/sessionQueries';
import { sessionQueryKeys } from '@/shared/constants/queryKeys';

export interface UseSessionDetailOptions {
  sessionId: string;
  enabled?: boolean;
}

export function useSessionDetail({
  sessionId,
  enabled = true,
}: UseSessionDetailOptions) {
  return useQuery({
    queryKey: sessionQueryKeys.detail(sessionId, false),
    queryFn: () => getSessionDetail(sessionId),
    enabled: enabled && !!sessionId,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });
}
