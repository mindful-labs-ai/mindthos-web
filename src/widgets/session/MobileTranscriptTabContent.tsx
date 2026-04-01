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
  isAnonymized: boolean;
  enableTimestampFeatures: boolean;
  currentSegmentIndex: number;
  activeSegmentRef: React.RefObject<HTMLDivElement | null>;
  transcriptEndRef?: (node?: Element | null) => void;
  onSeekTo: (time: number) => void;
  onTextEdit: (segmentId: number, newText: string) => void;
  onSpeakerChange: (updates: {
    speakerChanges: Record<number, number>;
    speakerDefinitions: Speaker[];
  }) => Promise<void>;
  onAddSegment?: (afterSegmentId: number, speaker: number) => void;
  onDeleteSegment?: (segmentId: number) => void;
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
      isAnonymized,
      enableTimestampFeatures,
      currentSegmentIndex,
      activeSegmentRef,
      transcriptEndRef,
      onSeekTo,
      onTextEdit,
      onSpeakerChange,
      onAddSegment,
      onDeleteSegment,
    }) => {
      const [deleteTargetId, setDeleteTargetId] = React.useState<number | null>(
        null
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
                        key={segment.id}
                        segment={segment}
                        speakers={speakers}
                        isActive={
                          enableTimestampFeatures &&
                          index === currentSegmentIndex
                        }
                        isEditable={isEditing && !isReadOnly}
                        isAnonymized={isAnonymized}
                        sttModel={transcribe?.stt_model}
                        segmentRef={
                          enableTimestampFeatures &&
                          index === currentSegmentIndex
                            ? activeSegmentRef
                            : undefined
                        }
                        onClick={onSeekTo}
                        onTextEdit={isReadOnly ? undefined : onTextEdit}
                        showTimestamp={enableTimestampFeatures}
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
                <p className="text-fg-muted">전사 내용이 없습니다.</p>
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
