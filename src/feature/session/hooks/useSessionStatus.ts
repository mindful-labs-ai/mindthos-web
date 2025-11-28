/**
 * 세션 처리 상태 조회 Hook (TanStack Query)
 * - 백그라운드에서 처리 중인 세션의 상태를 폴링
 */

import { useRef } from 'react';

import { useQuery } from '@tanstack/react-query';

import {
  getSessionStatus,
  type SessionStatusResponse,
} from '../services/sessionService';

export interface UseSessionStatusOptions {
  sessionId: string;
  enabled?: boolean;
  refetchInterval?: number | false;
  onSuccess?: (data: SessionStatusResponse) => void;
  onError?: (error: Error) => void;
  onComplete?: (
    data: SessionStatusResponse,
    status: 'succeeded' | 'failed'
  ) => void; // 완료 시에만 호출
}

export function useSessionStatus({
  sessionId,
  enabled = true,
  refetchInterval = 8000, // 기본 3초마다 폴링
  onSuccess,
  onError,
  onComplete,
}: UseSessionStatusOptions) {
  const previousStatusRef = useRef<string | null>(null);

  return useQuery({
    queryKey: ['session-status', sessionId],
    queryFn: () => getSessionStatus(sessionId),
    enabled: enabled && !!sessionId,
    refetchInterval: (query) => {
      const data = query.state.data;
      // succeeded나 failed 상태면 폴링 중단
      if (
        data?.processing_status === 'succeeded' ||
        data?.processing_status === 'failed'
      ) {
        return false;
      }
      return refetchInterval;
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 0, // 폴링 중에는 항상 최신 데이터 필요
    refetchOnWindowFocus: false, // 폴링으로 충분, 윈도우 포커스 시 추가 refetch 불필요
    refetchOnMount: false, // 폴링으로 충분
    onSuccess: (data: SessionStatusResponse) => {
      // 기존 onSuccess 콜백 호출 (모든 폴링마다)
      onSuccess?.(data);

      // 상태가 변경되었을 때만 onComplete 호출
      const currentStatus = data.processing_status;
      const previousStatus = previousStatusRef.current;

      if (
        (currentStatus === 'succeeded' || currentStatus === 'failed') &&
        previousStatus !== currentStatus
      ) {
        onComplete?.(data, currentStatus);
      }

      // 현재 상태 저장
      previousStatusRef.current = currentStatus;
    },
    onError,
  });
}
