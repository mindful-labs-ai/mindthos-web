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
import { Spotlight } from '@/shared/ui/composites/Spotlight';

import { SegmentDeleteConfirmModal } from './SegmentDeleteConfirmModal';
import { TextEditTooltip } from './TranscriptEditGuideTooltips';
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
  checkIsGuideLevel: (level: number) => boolean;
  nextGuideLevel: () => void;
  endGuide: () => void;
  onGuideScroll: (e: React.UIEvent<HTMLElement>) => void;
  tutorialStep?: number;
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
      checkIsGuideLevel,
      nextGuideLevel,
      endGuide,
      onGuideScroll,
      tutorialStep,
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

      if (checkIsGuideLevel(2)) {
        return (
          <>
            <Spotlight
              isActive={true}
              tooltip={<TextEditTooltip onNext={nextGuideLevel} />}
              tooltipPosition="left"
              store="featureGuide"
            >
              <MobileTranscriptContent
                contentScrollRef={contentScrollRef}
                segments={segments}
                speakers={speakers}
                transcribe={transcribe}
                clientId={clientId}
                isReadOnly={isReadOnly}
                isEditing={isEditing}
                isAnonymized={isAnonymized}
                enableTimestampFeatures={enableTimestampFeatures}
                currentSegmentIndex={currentSegmentIndex}
                activeSegmentRef={activeSegmentRef}
                transcriptEndRef={transcriptEndRef}
                onSeekTo={onSeekTo}
                onTextEdit={onTextEdit}
                onSpeakerChange={onSpeakerChange}
                onAddSegment={onAddSegment}
                onDeleteSegment={handleDeleteRequest}
                guideLevel={null}
                nextGuideLevel={nextGuideLevel}
                endGuide={endGuide}
                onGuideScroll={onGuideScroll}
                tutorialStep={tutorialStep}
              />
            </Spotlight>
            <SegmentDeleteConfirmModal
              isOpen={deleteTargetId !== null}
              onClose={handleDeleteCancel}
              onConfirm={handleDeleteConfirm}
            />
          </>
        );
      }

      return (
        <>
          <MobileTranscriptContent
            contentScrollRef={contentScrollRef}
            segments={segments}
            speakers={speakers}
            transcribe={transcribe}
            clientId={clientId}
            isReadOnly={isReadOnly}
            isEditing={isEditing}
            isAnonymized={isAnonymized}
            enableTimestampFeatures={enableTimestampFeatures}
            currentSegmentIndex={currentSegmentIndex}
            activeSegmentRef={activeSegmentRef}
            transcriptEndRef={transcriptEndRef}
            onSeekTo={onSeekTo}
            onTextEdit={onTextEdit}
            onSpeakerChange={onSpeakerChange}
            onAddSegment={onAddSegment}
            onDeleteSegment={handleDeleteRequest}
            guideLevel={
              checkIsGuideLevel(4) ? 4 : checkIsGuideLevel(5) ? 5 : null
            }
            nextGuideLevel={nextGuideLevel}
            endGuide={endGuide}
            onGuideScroll={onGuideScroll}
            tutorialStep={tutorialStep}
          />
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

// 내부 렌더링 컴포넌트
interface MobileTranscriptContentProps
  extends Omit<
    MobileTranscriptTabContentProps,
    'checkIsGuideLevel' | 'onDeleteSegment'
  > {
  guideLevel: 4 | 5 | null;
  onDeleteSegment?: (segmentId: number) => void;
}

const MobileTranscriptContent: React.FC<MobileTranscriptContentProps> = ({
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
  guideLevel,
  nextGuideLevel,
  endGuide,
  onGuideScroll,
  tutorialStep,
}) => {
  return (
    <div
      key="transcript-container"
      ref={contentScrollRef}
      className="rounded-lg py-4 transition-colors"
      onScroll={onGuideScroll}
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
                    enableTimestampFeatures && index === currentSegmentIndex
                  }
                  isEditable={isEditing && !isReadOnly}
                  isAnonymized={isAnonymized}
                  sttModel={transcribe?.stt_model}
                  segmentRef={
                    enableTimestampFeatures && index === currentSegmentIndex
                      ? activeSegmentRef
                      : undefined
                  }
                  onClick={onSeekTo}
                  onTextEdit={isReadOnly ? undefined : onTextEdit}
                  showTimestamp={enableTimestampFeatures}
                  speakerUtteranceIndex={speakerUtteranceIndex}
                  allSegments={segments}
                  clientId={clientId}
                  onSpeakerChange={isReadOnly ? undefined : onSpeakerChange}
                  guideLevel={guideLevel}
                  onGuideNext={nextGuideLevel}
                  onGuideComplete={endGuide}
                  isFirstSegment={index === 0}
                  onAddSegment={
                    isEditing && !isReadOnly ? onAddSegment : undefined
                  }
                  onDeleteSegment={
                    isEditing && !isReadOnly ? onDeleteSegment : undefined
                  }
                />
              );
            });
          })()}
          <div
            key={`scroll-target-${tutorialStep}`}
            ref={transcriptEndRef}
            className="h-4 w-full"
          />
        </>
      ) : (
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-fg-muted">전사 내용이 없습니다.</p>
        </div>
      )}
    </div>
  );
};
