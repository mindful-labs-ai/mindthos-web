/**
 * 세션 처리 상태 폴링 Hook
 *
 * STT 백엔드 포트를 경유하므로 VITE_USE_SERVER_STT 플래그에 따라
 * mindthos-server(소유권 검사) 또는 Edge Function 경로 중 하나가 선택된다.
 */

import { useQuery } from '@tanstack/react-query';

import { getSessionStatus } from '@/shared/api/supabase/sessionQueries';
import { sessionQueryKeys } from '@/shared/constants/queryKeys';

import type { SessionProcessingStatus } from '../types';

const POLLING_STATUSES = new Set<SessionProcessingStatus>([
  'pending',
  'transcribing',
  'generating_note',
]);

export interface UseSessionStatusOptions {
  enabled?: boolean;
}

/**
 * 세션 처리 상태를 3초 간격으로 폴링한다.
 * `processing_status`가 pending/transcribing/generating_note 이면 계속 폴링,
 * succeeded/failed 이면 폴링을 멈춘다.
 */
export function useSessionStatus(
  sessionId: string,
  options?: UseSessionStatusOptions
) {
  return useQuery({
    queryKey: sessionQueryKeys.status(sessionId),
    queryFn: () => getSessionStatus(sessionId),
    enabled: !!sessionId && (options?.enabled ?? true),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 3000;
      return POLLING_STATUSES.has(data.processing_status) ? 3000 : false;
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}
