/**
 * 개별 세션 조회 Hook (TanStack Query)
 */

import { useQuery } from '@tanstack/react-query';
import { getSessionDetail } from '../services/sessionService';

export interface UseSessionDetailOptions {
  sessionId: string;
  enabled?: boolean;
}

export function useSessionDetail({
  sessionId,
  enabled = true,
}: UseSessionDetailOptions) {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSessionDetail(sessionId),
    enabled: enabled && !!sessionId,
    retry: 2,
    // 전역 설정 사용: staleTime 5분, refetchOnWindowFocus/Mount/Reconnect false
  });
}
