/**
 * 축어록 탭 컨텐츠
 * 세그먼트 렌더링, 편집 모드 처리
 */

import React from 'react';

import type {
  Speaker,
  Transcribe,
  TranscribeSegment,
} from '@/features/session/types';
import { useSessionStore } from '@/stores/sessionStore';

import { SegmentDeleteConfirmModal } from './SegmentDeleteConfirmModal';
import { TranscriptSegment } from './TranscriptSegment';

interface TranscriptTabContentProps {
  /** 스크롤 컨테이너 ref */
  contentScrollRef: React.RefObject<HTMLDivElement | null>;
  /** 세그먼트 목록 */
  segments: TranscribeSegment[];
  /** 화자 목록 */
  speakers: Speaker[];
  /** 전사 데이터 */
  transcribe: Transcribe | null;
  /** 세션 내담자 ID */
  clientId: string | null;
  /** 읽기 전용 여부 */
  isReadOnly: boolean;
  /** 편집 중 여부 */
  isEditing: boolean;
  /** 익명화 모드 여부 */
  isAnonymized: boolean;
  /** 비식별화 표시 여부 */
  showDeid?: boolean;
  /** 타임스탬프 기능 활성화 여부 */
  enableTimestampFeatures: boolean;
  /** 현재 활성 세그먼트 인덱스 */
  currentSegmentIndex: number;
  /** 활성 세그먼트 ref */
  activeSegmentRef: React.RefObject<HTMLDivElement | null>;
  /** 스크롤 끝 감지용 ref */
  transcriptEndRef?: (node?: Element | null) => void;
  /** 세그먼트 클릭 시 오디오 이동 핸들러 */
  onSeekTo: (time: number) => void;
  /** 텍스트 편집 핸들러 */
  onTextEdit: (segmentId: number, newText: string) => void;
  /** nv 편집 핸들러 */
  onNvEdit?: (segmentId: number, nv: string[]) => void;
  /** deid 편집 핸들러 */
  onDeidEdit?: (segmentId: number, deid: Record<string, string>) => void;
  /** 화자 변경 핸들러 */
  onSpeakerChange: (updates: {
    speakerChanges: Record<number, number>;
    speakerDefinitions: Speaker[];
  }) => Promise<void>;
  /** 세그먼트 추가 핸들러 */
  onAddSegment?: (afterSegmentId: number, speaker: number) => void;
  /** 세그먼트 삭제 핸들러 */
  onDeleteSegment?: (segmentId: number) => void;
}

export const TranscriptTabContent: React.FC<TranscriptTabContentProps> =
  React.memo(
    ({
      contentScrollRef,
      segments,
      speakers,
      transcribe,
      clientId,
      isReadOnly,
      isEditing,
      isAnonymized,
      showDeid = false,
      enableTimestampFeatures,
      currentSegmentIndex,
      activeSegmentRef,
      transcriptEndRef,
      onSeekTo,
      onTextEdit,
      onNvEdit,
      onDeidEdit,
      onSpeakerChange,
      onAddSegment,
      onDeleteSegment,
    }) => {
      const [deleteTargetId, setDeleteTargetId] = React.useState<number | null>(
        null
      );
      const showUtteranceIndex = useSessionStore(
        (state) => state.showUtteranceIndex
      );

      const handleDeleteRequest = React.useCallback(
        (segmentId: number) => {
          const target = segments.find((s) => s.id === segmentId);
          if (target && !target.text.trim()) {
            onDeleteSegment?.(segmentId);
          } else {
            setDeleteTargetId(segmentId);
          }
        },
        [segments, onDeleteSegment]
      );

      const handleDeleteConfirm = React.useCallback(() => {
        if (deleteTargetId !== null && onDeleteSegment) {
          onDeleteSegment(deleteTargetId);
        }
        setDeleteTargetId(null);
      }, [deleteTargetId, onDeleteSegment]);

      const handleDeleteCancel = React.useCallback(() => {
        setDeleteTargetId(null);
      }, []);

      return (
        <>
          <div
            key="transcript-container"
            ref={contentScrollRef}
            className="h-full overflow-y-auto rounded-lg px-8 py-6 transition-colors"
          >
            {segments.length > 0 ? (
              <>
                {(() => {
                  const speakerCounters: Record<number, number> = {};
                  return segments.map((segment, index) => {
                    const speakerId = segment.speaker;
                    speakerCounters[speakerId] =
                      (speakerCounters[speakerId] || 0) + 1;
                    const speakerUtteranceIndex = speakerCounters[speakerId];

                    return (
                      <TranscriptSegment
                        key={segment.id}
                        segment={segment}
                        speakers={speakers}
                        isActive={
                          enableTimestampFeatures &&
                          index === currentSegmentIndex
                        }
                        isEditable={isEditing && !isReadOnly}
                        isAnonymized={isAnonymized}
                        showDeid={showDeid}
                        sttModel={transcribe?.stt_model}
                        segmentRef={
                          enableTimestampFeatures &&
                          index === currentSegmentIndex
                            ? activeSegmentRef
                            : undefined
                        }
                        onClick={onSeekTo}
                        onTextEdit={isReadOnly ? undefined : onTextEdit}
                        onNvEdit={isReadOnly ? undefined : onNvEdit}
                        onDeidEdit={isReadOnly ? undefined : onDeidEdit}
                        showTimestamp={
                          enableTimestampFeatures && !showUtteranceIndex
                        }
                        speakerUtteranceIndex={speakerUtteranceIndex}
                        allSegments={segments}
                        clientId={clientId}
                        onSpeakerChange={
                          isReadOnly ? undefined : onSpeakerChange
                        }
                        onAddSegment={
                          isEditing && !isReadOnly ? onAddSegment : undefined
                        }
                        onDeleteSegment={
                          isEditing && !isReadOnly
                            ? handleDeleteRequest
                            : undefined
                        }
                      />
                    );
                  });
                })()}
                <div ref={transcriptEndRef} className="h-4 w-full" />
              </>
            ) : (
              <div className="flex min-h-[400px] items-center justify-center">
                <p className="text-fg-muted">축어록이 없어요.</p>
              </div>
            )}
          </div>
          <SegmentDeleteConfirmModal
            isOpen={deleteTargetId !== null}
            onClose={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
          />
        </>
      );
    }
  );

TranscriptTabContent.displayName = 'TranscriptTabContent';
