/**
 * 세션 목록 조회 Hook (TanStack Query)
 */

import React from 'react';

import { useQuery } from '@tanstack/react-query';

import { getSessionList } from '../services/sessionService';
import type {
  HandwrittenTranscribe,
  ProgressNote,
  Session,
  Transcribe,
} from '../types';

export interface SessionWithRelations {
  session: Session;
  transcribe: Transcribe | HandwrittenTranscribe | null;
  progressNotes: ProgressNote[];
}

export interface UseSessionListOptions {
  userId: number;
  enabled?: boolean;
  refetchInterval?: number | false;
  /** 세션 처리가 완료되었을 때 호출되는 콜백 */
  onSessionComplete?: (session: Session) => void;
  /** 세션 처리가 실패했을 때 호출되는 콜백 */
  onSessionError?: (session: Session) => void;
}

export function useSessionList({
  userId,
  enabled = true,
  refetchInterval = false,
  onSessionComplete,
  onSessionError,
}: UseSessionListOptions) {
  // 이전 세션 상태를 저장하여 상태 변경 감지
  const prevSessionStatusesRef = React.useRef<
    Map<string, Session['processing_status']>
  >(new Map());

  const query = useQuery({
    queryKey: ['sessions', userId],
    queryFn: () => getSessionList(userId),
    enabled: enabled && !!userId,
    refetchInterval: (queryInfo) => {
      // refetchInterval이 명시적으로 설정된 경우 그대로 사용
      if (refetchInterval !== false) return refetchInterval;

      // 처리 중인 세션이 있는지 확인
      const data = queryInfo.state.data;
      const hasProcessingSessions = data?.sessions.some((s) => {
        const status = s.session.processing_status;
        return (
          status === 'pending' ||
          status === 'transcribing' ||
          status === 'generating_note'
        );
      });

      // 처리 중인 세션이 있으면 8초마다 폴링
      return hasProcessingSessions ? 8000 : false;
    },
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5분
    refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 refetch 비활성화
    refetchOnMount: false, // 마운트 시 자동 refetch 비활성화 (초기 로드는 enabled로 제어)
  });

  // 세션 상태 변경 감지 및 콜백 호출
  React.useEffect(() => {
    if (!query.data?.sessions) return;

    const currentStatuses = prevSessionStatusesRef.current;
    const sessions = query.data.sessions;

    sessions.forEach(({ session }) => {
      const prevStatus = currentStatuses.get(session.id);
      const currentStatus = session.processing_status;

      // 이전 상태가 있고, 상태가 변경된 경우에만 처리
      if (prevStatus && prevStatus !== currentStatus) {
        const wasProcessing =
          prevStatus === 'pending' ||
          prevStatus === 'transcribing' ||
          prevStatus === 'generating_note';

        // 처리 중이던 세션이 완료됨
        if (wasProcessing && currentStatus === 'succeeded') {
          onSessionComplete?.(session);
        }

        // 처리 중이던 세션이 실패함
        if (wasProcessing && currentStatus === 'failed') {
          onSessionError?.(session);
        }
      }

      // 현재 상태 저장
      currentStatuses.set(session.id, currentStatus);
    });
  }, [query.data?.sessions, onSessionComplete, onSessionError]);

  return query;
}
