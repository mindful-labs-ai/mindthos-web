/**
 * 상담노트 생성 상태 폴링 Hook
 */

import { useEffect, useRef } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import type { ProgressNote, ProgressNoteStatus } from '../types';

export interface UseProgressNotePollingOptions {
  sessionId: string;
  progressNoteId: string | null;
  enabled?: boolean;
  refetchInterval?: number | false;
  onComplete?: (note: ProgressNote) => void;
  onError?: (error: Error) => void;
}

/**
 * 상담노트 생성 상태 폴링
 */
export function useProgressNotePolling({
  sessionId,
  progressNoteId,
  enabled = true,
  refetchInterval = 3000, // 기본 3초마다 폴링
  onComplete,
  onError,
}: UseProgressNotePollingOptions) {
  const queryClient = useQueryClient();
  const previousStatusRef = useRef<ProgressNoteStatus | null>(null);

  const query = useQuery<ProgressNote | null, Error>({
    queryKey: ['progress-note-status', progressNoteId],
    queryFn: async () => {
      if (!progressNoteId) return null;

      const { data, error } = await supabase
        .from('progress_notes')
        .select('*')
        .eq('id', progressNoteId)
        .single();

      if (error) {
        throw new Error(`상담노트 조회 실패: ${error.message}`);
      }

      return data as ProgressNote;
    },
    enabled: enabled && !!progressNoteId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return refetchInterval;

      // succeeded 또는 failed 상태면 폴링 중단
      const isCompleted =
        data.processing_status === 'succeeded' ||
        data.processing_status === 'failed';

      if (isCompleted) {
        return false;
      }

      return refetchInterval;
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 0, // 폴링 중에는 항상 최신 데이터 필요
    refetchOnWindowFocus: false, // 폴링으로 충분
    refetchOnMount: true,
  });

  // useEffect로 데이터 변경 감지
  useEffect(() => {
    const data = query.data;
    if (!data) return;

    const currentStatus = data.processing_status;
    const previousStatus = previousStatusRef.current;

    // 상담노트가 완료되었고, 이전에는 완료되지 않았을 때 onComplete 호출
    const isCompleted =
      currentStatus === 'succeeded' || currentStatus === 'failed';

    const wasNotCompleted =
      previousStatus !== 'succeeded' && previousStatus !== 'failed';

    if (isCompleted && (wasNotCompleted || previousStatus === null)) {
      // 세션 상세 쿼리 invalidate (최신 데이터로 갱신)
      queryClient.invalidateQueries({
        queryKey: ['session', sessionId],
      });

      if (currentStatus === 'succeeded') {
        onComplete?.(data);
      } else if (currentStatus === 'failed') {
        onError?.(new Error(data.error_message || '상담노트 생성에 실패했습니다.'));
      }
    }

    // 현재 상태 저장
    previousStatusRef.current = currentStatus;
  }, [query.data, onComplete, onError, queryClient, sessionId]);

  // 에러 처리
  useEffect(() => {
    if (query.error) {
      onError?.(query.error);
    }
  }, [query.error, onError]);

  return query;
}
