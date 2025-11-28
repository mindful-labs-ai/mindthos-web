/**
 * 세션 목록 조회 Hook (TanStack Query)
 */

import { useQuery } from '@tanstack/react-query';

import { getSessionList } from '../services/sessionService';
import type { Session, Transcribe, ProgressNote } from '../types';

export interface SessionWithRelations {
  session: Session;
  transcribe: Transcribe | null;
  progressNotes: ProgressNote[];
}

export interface UseSessionListOptions {
  userId: number;
  enabled?: boolean;
  refetchInterval?: number | false;
}

export function useSessionList({
  userId,
  enabled = true,
  refetchInterval = false,
}: UseSessionListOptions) {
  return useQuery({
    queryKey: ['sessions', userId],
    queryFn: () => getSessionList(userId),
    enabled: enabled && !!userId,
    refetchInterval: (query) => {
      // refetchInterval이 명시적으로 설정된 경우 그대로 사용
      if (refetchInterval !== false) return refetchInterval;

      // 처리 중인 세션이 있는지 확인
      const data = query.state.data;
      const hasProcessingSessions = data?.sessions.some((s) => {
        const status = s.session.processing_status;
        return (
          status === 'pending' ||
          status === 'transcribing' ||
          status === 'generating_note'
        );
      });

      // 처리 중인 세션이 있으면 3초마다 폴링
      return hasProcessingSessions ? 3000 : false;
    },
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5분
    refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 refetch 비활성화
    refetchOnMount: false, // 마운트 시 자동 refetch 비활성화 (초기 로드는 enabled로 제어)
  });
}
