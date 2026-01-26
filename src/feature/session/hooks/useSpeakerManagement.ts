/**
 * 화자 관리 기능 훅
 * 축어록의 화자 변경 로직 처리
 */

import React from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useToast } from '@/components/ui/composites/Toast';
import { trackError } from '@/lib/mixpanel';

import { updateTranscriptSegments } from '../services/sessionService';
import type {
  ProgressNote,
  Session,
  Speaker,
  Transcribe,
  TranscribeSegment,
} from '../types';

import { sessionDetailQueryKey } from './useSessionDetail';

interface UseSpeakerManagementOptions {
  sessionId: string;
  transcribeId: string | undefined;
  isDummySession: boolean;
  isReadOnly: boolean;
}

interface SpeakerChangeUpdate {
  speakerChanges: Record<number, number>;
  speakerDefinitions: Speaker[];
}

interface UseSpeakerManagementReturn {
  /**
   * 화자 변경 처리
   * Optimistic Update로 즉각적인 UI 반영 후 백그라운드 서버 업데이트
   */
  handleSpeakerChange: (updates: SpeakerChangeUpdate) => Promise<void>;
}

export function useSpeakerManagement({
  sessionId,
  transcribeId,
  isDummySession,
  isReadOnly,
}: UseSpeakerManagementOptions): UseSpeakerManagementReturn {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sessionQueryKey = React.useMemo(
    () => sessionDetailQueryKey(sessionId, isDummySession),
    [sessionId, isDummySession]
  );

  const handleSpeakerChange = React.useCallback(
    async (updates: SpeakerChangeUpdate) => {
      if (isReadOnly) {
        toast({
          title: '읽기 전용',
          description: '예시에서는 편집할 수 없습니다.',
          duration: 3000,
        });
        return;
      }

      if (!transcribeId || !sessionId) {
        toast({
          title: '오류',
          description: '전사 데이터를 찾을 수 없습니다.',
          duration: 3000,
        });
        return;
      }

      try {
        // Optimistic update: 캐시를 즉시 업데이트
        queryClient.setQueryData(
          sessionQueryKey,
          (
            oldData:
              | {
                  session: Session;
                  transcribe: Transcribe | null;
                  progressNotes: ProgressNote[];
                }
              | undefined
          ) => {
            if (!oldData || !oldData.transcribe) return oldData;

            const transcribe = oldData.transcribe;
            const contents = transcribe.contents;

            if (!contents) return oldData;

            // 세그먼트의 speaker 업데이트
            let updatedContents;

            if ('segments' in contents && Array.isArray(contents.segments)) {
              // New format
              const updatedSegments = contents.segments.map(
                (seg: TranscribeSegment) => {
                  if (updates.speakerChanges[seg.id]) {
                    return { ...seg, speaker: updates.speakerChanges[seg.id] };
                  }
                  return seg;
                }
              );

              updatedContents = {
                ...contents,
                segments: updatedSegments,
                speakers: updates.speakerDefinitions,
              };
            } else if ('result' in contents && contents.result?.segments) {
              // Legacy format
              const updatedSegments = contents.result.segments.map(
                (seg: TranscribeSegment) => {
                  if (updates.speakerChanges[seg.id]) {
                    return { ...seg, speaker: updates.speakerChanges[seg.id] };
                  }
                  return seg;
                }
              );

              updatedContents = {
                ...contents,
                result: {
                  ...contents.result,
                  segments: updatedSegments,
                  speakers: updates.speakerDefinitions,
                },
              };
            } else {
              return oldData;
            }

            return {
              ...oldData,
              transcribe: {
                ...transcribe,
                contents: updatedContents,
              },
            };
          }
        );

        // 백그라운드에서 서버 업데이트
        await updateTranscriptSegments(transcribeId, {
          speakerUpdates: updates.speakerChanges,
          speakerDefinitions: updates.speakerDefinitions,
        });

        // API 성공 후 캐시 무효화하여 DB의 최신 데이터 가져오기
        await queryClient.invalidateQueries({
          queryKey: sessionQueryKey,
        });

        toast({
          title: '화자 변경 완료',
          description: '축어록이 수정되었습니다.',
          duration: 3000,
        });
      } catch (error) {
        // 실패 시 캐시 무효화하여 서버 데이터로 되돌림
        await queryClient.invalidateQueries({
          queryKey: sessionQueryKey,
        });

        trackError('speaker_change_error', error, {
          session_id: sessionId,
          transcribe_id: transcribeId,
        });
        toast({
          title: '화자 변경 실패',
          description: '화자 변경에 실패했습니다. 다시 시도해주세요.',
          duration: 3000,
        });
      }
    },
    [isReadOnly, transcribeId, sessionId, queryClient, sessionQueryKey, toast]
  );

  return {
    handleSpeakerChange,
  };
}
