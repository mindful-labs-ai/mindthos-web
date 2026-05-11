/**
 * 상담노트 생성 상태 폴링 Hook
 */

import { useEffect, useRef } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchProgressNoteById } from '@/shared/api/supabase/progressNoteQueries';
import {
  creditQueryKeys,
  sessionQueryKeys,
} from '@/shared/constants/queryKeys';
import { useAuthStore } from '@/stores/authStore';

import type { ProgressNote, ProgressNoteStatus } from '../types';

// failed 트리거 → pg_net → credit-manager/release 의 비동기 처리 마진.
// release p95 ~1-2초이지만 p99 를 잡아 3초로 보수적 설정.
// 코드 리뷰 응답 (2026-05-11) — failed 직후 잔액 race UX 방지.
const CREDIT_INVALIDATE_DELAY_MS = 3000;

export interface UseProgressNotePollingOptions {
  sessionId: string;
  progressNoteId: string | null;
  isDummySession?: boolean;
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
  isDummySession = false,
  enabled = true,
  refetchInterval = 3000, // 기본 3초마다 폴링
  onComplete,
  onError,
}: UseProgressNotePollingOptions) {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);
  const previousStatusRef = useRef<ProgressNoteStatus | null>(null);
  const delayedInvalidateTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const sessionQueryKey = sessionQueryKeys.detail(sessionId, isDummySession);

  // unmount 시 delayed invalidate timer 정리
  useEffect(() => {
    return () => {
      if (delayedInvalidateTimerRef.current) {
        clearTimeout(delayedInvalidateTimerRef.current);
      }
    };
  }, []);

  const query = useQuery<ProgressNote | null, Error>({
    queryKey: sessionQueryKeys.progressNoteStatus(progressNoteId!),
    queryFn: async () => {
      if (!progressNoteId) return null;
      return fetchProgressNoteById(progressNoteId);
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
        queryKey: sessionQueryKey,
      });

      // 크레딧 잔액 갱신 — 노트 처리 끝나면 차감/환불이 끝났을 시점
      const userIdNum = Number(userId);
      if (!Number.isNaN(userIdNum)) {
        // 1차 즉시 invalidate
        queryClient.invalidateQueries({
          queryKey: creditQueryKeys.summary(userIdNum),
        });

        // failed 케이스: release 트리거 → pg_net → EF → RPC 가 비동기라
        // 즉시 invalidate 시점에 잔액이 아직 차감된 상태일 수 있음.
        // 3초 후 2차 invalidate 로 보정. (succeeded 는 commit 이 즉시 진행되어 추가 invalidate 불필요)
        if (currentStatus === 'failed') {
          if (delayedInvalidateTimerRef.current) {
            clearTimeout(delayedInvalidateTimerRef.current);
          }
          delayedInvalidateTimerRef.current = setTimeout(() => {
            queryClient.invalidateQueries({
              queryKey: creditQueryKeys.summary(userIdNum),
            });
            delayedInvalidateTimerRef.current = null;
          }, CREDIT_INVALIDATE_DELAY_MS);
        }
      }

      if (currentStatus === 'succeeded') {
        onComplete?.(data);
      } else if (currentStatus === 'failed') {
        onError?.(
          new Error(data.error_message || '상담노트를 만들지 못했어요.')
        );
      }
    }

    // 현재 상태 저장
    previousStatusRef.current = currentStatus;
  }, [query.data, onComplete, onError, queryClient, sessionQueryKey, userId]);

  // 에러 처리
  useEffect(() => {
    if (query.error) {
      onError?.(query.error);
    }
  }, [query.error, onError]);

  return query;
}
