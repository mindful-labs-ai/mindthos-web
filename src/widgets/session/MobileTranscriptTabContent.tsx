/**
 * 모바일 축어록 탭 컨텐츠
 * 부모 스크롤에 의존, px 패딩 없음
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

interface MobileTranscriptTabContentProps {
  contentScrollRef: React.RefObject<HTMLDivElement | null>;
  segments: TranscribeSegment[];
  speakers: Speaker[];
  transcribe: Transcribe | null;
  clientId: string | null;
  isReadOnly: boolean;
  isEditing: boolean;
  /** 세그먼트 편집기 강제 remount 버전 (찾기바꾸기/undo/redo 반영) */
  editorVersion?: number;
  isSaving: boolean;
  isAnonymized: boolean;
  showDeid?: boolean;
  enableTimestampFeatures: boolean;
  currentSegmentIndex: number;
  activeSegmentRef: React.RefObject<HTMLDivElement | null>;
  transcriptEndRef?: (node?: Element | null) => void;
  onSeekTo: (time: number) => void;
  onTextEdit: (segmentId: number, newText: string) => void;
  onNvEdit?: (segmentId: number, nv: string[]) => void;
  onDeidEdit?: (segmentId: number, deid: Record<string, string>) => void;
  onSpeakerChange: (updates: {
    speakerChanges: Record<number, number>;
    speakerDefinitions: Speaker[];
  }) => Promise<void>;
  onAddSegment?: (afterSegmentId: number, speaker: number) => void;
  onDeleteSegment?: (segmentId: number) => void;
  audioDuration?: number;
  onSegmentTimeChange?: (segmentId: number, start: number, end: number) => void;
  onSplitSegment?: (
    segmentId: number,
    boundaries: number[],
    sliceSpeakers: number[],
    speakerDefinitions?: Speaker[]
  ) => void;
}

export const MobileTranscriptTabContent: React.FC<MobileTranscriptTabContentProps> =
  React.memo(
    ({
      contentScrollRef,
      segments,
      speakers,
      transcribe,
      clientId,
      isReadOnly,
      isEditing,
      editorVersion = 0,
      isSaving,
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
      audioDuration,
      onSegmentTimeChange,
      onSplitSegment,
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
            className="rounded-lg py-4 transition-colors md:px-2"
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
                        key={`${segment.id}-${editorVersion}`}
                        segment={segment}
                        speakers={speakers}
                        isActive={
                          enableTimestampFeatures &&
                          index === currentSegmentIndex
                        }
                        isEditable={isEditing && !isReadOnly}
                        isSaving={isSaving}
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
                          isReadOnly || isSaving ? undefined : onSpeakerChange
                        }
                        onAddSegment={
                          isEditing && !isReadOnly && !isSaving
                            ? onAddSegment
                            : undefined
                        }
                        onDeleteSegment={
                          isEditing && !isReadOnly && !isSaving
                            ? handleDeleteRequest
                            : undefined
                        }
                        enableTimestampFeatures={enableTimestampFeatures}
                        audioDuration={audioDuration}
                        onSegmentTimeChange={
                          isEditing && !isReadOnly && !isSaving
                            ? onSegmentTimeChange
                            : undefined
                        }
                        onSplitSegment={
                          isEditing && !isReadOnly && !isSaving
                            ? onSplitSegment
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

MobileTranscriptTabContent.displayName = 'MobileTranscriptTabContent';
