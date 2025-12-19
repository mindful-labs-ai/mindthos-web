/**
 * 세션의 전체 상담노트 상태 폴링 Hook
 * - 처리 중인 노트가 있을 때만 폴링
 * - 각 노트의 완료/실패를 개별적으로 감지
 */

import { useEffect, useRef } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import type { ProgressNote, Session, Transcribe } from '../types';

import { sessionDetailQueryKey } from './useSessionDetail';

export interface UseSessionProgressNotesPollingOptions {
  sessionId: string;
  isDummySession?: boolean;
  enabled?: boolean;
  refetchInterval?: number;
  /** 외부에서 처리 중인 노트가 있는지 (API 요청 중 등) - 폴링 강제 활성화용 */
  hasExternalProcessing?: boolean;
  onNoteComplete?: (note: ProgressNote) => void;
  onNoteError?: (note: ProgressNote, error: Error) => void;
}

/**
 * 세션의 전체 상담노트 폴링
 * - 처리 중인 노트가 있으면 폴링 활성화
 * - 각 노트의 상태 변화를 추적하여 완료/실패 콜백 호출
 */
export function useSessionProgressNotesPolling({
  sessionId,
  isDummySession = false,
  enabled = true,
  refetchInterval = 3000,
  hasExternalProcessing = false,
  onNoteComplete,
  onNoteError,
}: UseSessionProgressNotesPollingOptions) {
  const queryClient = useQueryClient();
  const sessionQueryKey = sessionDetailQueryKey(sessionId, isDummySession);

  // 각 노트의 이전 상태를 추적
  const previousStatusMapRef = useRef<
    Map<string, ProgressNote['processing_status']>
  >(new Map());

  const query = useQuery<ProgressNote[], Error>({
    queryKey: ['session-progress-notes-polling', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('progress_notes')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`상담노트 목록 조회 실패: ${error.message}`);
      }

      return data as ProgressNote[];
    },
    enabled: enabled && !!sessionId,
    refetchInterval: (query) => {
      // 외부에서 처리 중인 노트가 있으면 폴링 강제 활성화
      if (hasExternalProcessing) {
        return refetchInterval;
      }

      const notes = query.state.data;
      if (!notes || notes.length === 0) return false;

      // 처리 중인 노트가 있으면 폴링 계속
      const hasProcessingNote = notes.some(
        (note) =>
          note.processing_status === 'pending' ||
          note.processing_status === 'in_progress'
      );

      return hasProcessingNote ? refetchInterval : false;
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // 각 노트의 상태 변화 감지
  useEffect(() => {
    const notes = query.data;
    if (!notes) return;

    const previousStatusMap = previousStatusMapRef.current;
    let shouldInvalidateSession = false;

    notes.forEach((note) => {
      const previousStatus = previousStatusMap.get(note.id);
      const currentStatus = note.processing_status;

      // 첫 로드 시에는 현재 상태만 저장하고 콜백 호출하지 않음
      if (previousStatus === undefined) {
        previousStatusMap.set(note.id, currentStatus);
        return;
      }

      // 상태가 변경되었는지 확인
      if (previousStatus !== currentStatus) {
        const wasProcessing =
          previousStatus === 'pending' || previousStatus === 'in_progress';
        const isCompleted =
          currentStatus === 'succeeded' || currentStatus === 'failed';

        // 처리 중 -> 완료/실패로 변경된 경우에만 콜백 호출
        if (wasProcessing && isCompleted) {
          shouldInvalidateSession = true;

          if (currentStatus === 'succeeded') {
            onNoteComplete?.(note);
          } else if (currentStatus === 'failed') {
            onNoteError?.(
              note,
              new Error(note.error_message || '상담노트 생성에 실패했습니다.')
            );
          }
        }

        // 현재 상태 저장
        previousStatusMap.set(note.id, currentStatus);
      }
    });

    // 완료된 노트가 있으면 세션 쿼리 invalidate
    if (shouldInvalidateSession) {
      queryClient.invalidateQueries({
        queryKey: sessionQueryKey,
      });
    }
  }, [query.data, onNoteComplete, onNoteError, queryClient, sessionQueryKey]);

  // 폴링 데이터로 세션 상세 캐시 동기화 (단일 리소스 원칙 유지)
  useEffect(() => {
    if (!query.data) return;

    queryClient.setQueryData<{
      session: Session;
      transcribe: Transcribe | null;
      progressNotes: ProgressNote[];
    }>(sessionQueryKey, (oldData) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        progressNotes: query.data,
      };
    });
  }, [query.data, queryClient, sessionQueryKey]);

  // 처리 중인 노트 목록
  const processingNotes =
    query.data?.filter(
      (note) =>
        note.processing_status === 'pending' ||
        note.processing_status === 'in_progress'
    ) || [];

  // 처리 중인 노트 ID Set
  const processingNoteIds = new Set(processingNotes.map((note) => note.id));

  return {
    ...query,
    processingNotes,
    processingNoteIds,
    hasProcessingNotes: processingNotes.length > 0,
  };
}
