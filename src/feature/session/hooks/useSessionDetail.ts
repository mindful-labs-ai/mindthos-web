/**
 * 개별 세션 조회 Hook (TanStack Query)
 */

import { useQuery } from '@tanstack/react-query';

import { getDummySessionDetail } from '../constants/dummySessions';
import { getSessionDetail } from '../services/sessionService';

export interface UseSessionDetailOptions {
  sessionId: string;
  enabled?: boolean;
}

export const sessionDetailQueryKey = (
  sessionId: string,
  isDummySession: boolean
) => ['session', sessionId, isDummySession] as const;

export function useSessionDetail({
  sessionId,
  enabled = true,
}: UseSessionDetailOptions) {
  const dummySessionDetail = getDummySessionDetail(sessionId);
  const isDummySession = !!dummySessionDetail;

  return useQuery({
    queryKey: sessionDetailQueryKey(sessionId, isDummySession),
    queryFn: () =>
      isDummySession
        ? Promise.resolve(dummySessionDetail)
        : getSessionDetail(sessionId),
    enabled: enabled && !!sessionId,
    retry: 2,
    staleTime: isDummySession ? Infinity : 5 * 60 * 1000,
  });
}
