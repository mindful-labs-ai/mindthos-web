/**
 * 축어록 탭 컨텐츠
 * 세그먼트 렌더링, 편집 모드, 가이드 처리
 */

import React from 'react';

import { Spotlight } from '@/components/ui/composites/Spotlight';

import type { Speaker, Transcribe, TranscribeSegment } from '../types';

import { TextEditTooltip } from './TranscriptEditGuideTooltips';
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
  /** 세션 클라이언트 ID */
  clientId: string | null;
  /** 읽기 전용 여부 */
  isReadOnly: boolean;
  /** 편집 중 여부 */
  isEditing: boolean;
  /** 익명화 모드 여부 */
  isAnonymized: boolean;
  /** 타임스탬프 기능 활성화 여부 */
  enableTimestampFeatures: boolean;
  /** 현재 활성 세그먼트 인덱스 */
  currentSegmentIndex: number;
  /** 활성 세그먼트 ref */
  activeSegmentRef: React.RefObject<HTMLDivElement | null>;
  /** 스크롤 끝 감지용 ref */
  transcriptEndRef: (node?: Element | null) => void;
  /** 세그먼트 클릭 시 오디오 이동 핸들러 */
  onSeekTo: (time: number) => void;
  /** 텍스트 편집 핸들러 */
  onTextEdit: (segmentId: number, newText: string) => void;
  /** 화자 변경 핸들러 */
  onSpeakerChange: (updates: {
    speakerChanges: Record<number, number>;
    speakerDefinitions: Speaker[];
  }) => Promise<void>;
  /** 가이드 레벨 체크 함수 */
  checkIsGuideLevel: (level: number) => boolean;
  /** 다음 가이드 레벨로 이동 */
  nextGuideLevel: () => void;
  /** 가이드 종료 */
  endGuide: () => void;
  /** 가이드 스크롤 핸들러 */
  onGuideScroll: (e: React.UIEvent<HTMLElement>) => void;
  /** 튜토리얼 스텝 (스크롤 타겟 key용) */
  tutorialStep?: number;
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
      enableTimestampFeatures,
      currentSegmentIndex,
      activeSegmentRef,
      transcriptEndRef,
      onSeekTo,
      onTextEdit,
      onSpeakerChange,
      checkIsGuideLevel,
      nextGuideLevel,
      endGuide,
      onGuideScroll,
      tutorialStep,
    }) => {
      // 가이드 Level 2인 경우 Spotlight으로 감싸기
      if (checkIsGuideLevel(2)) {
        return (
          <Spotlight
            isActive={true}
            tooltip={<TextEditTooltip onNext={nextGuideLevel} />}
            tooltipPosition="left"
            store="featureGuide"
          >
            <TranscriptContent
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
              guideLevel={null}
              nextGuideLevel={nextGuideLevel}
              endGuide={endGuide}
              onGuideScroll={onGuideScroll}
              tutorialStep={tutorialStep}
            />
          </Spotlight>
        );
      }

      return (
        <TranscriptContent
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
          guideLevel={
            checkIsGuideLevel(4) ? 4 : checkIsGuideLevel(5) ? 5 : null
          }
          nextGuideLevel={nextGuideLevel}
          endGuide={endGuide}
          onGuideScroll={onGuideScroll}
          tutorialStep={tutorialStep}
        />
      );
    }
  );

TranscriptTabContent.displayName = 'TranscriptTabContent';

// 내부 렌더링 컴포넌트
interface TranscriptContentProps
  extends Omit<TranscriptTabContentProps, 'checkIsGuideLevel'> {
  guideLevel: 4 | 5 | null;
}

const TranscriptContent: React.FC<TranscriptContentProps> = ({
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
      className="h-full overflow-y-auto rounded-lg px-8 py-6 transition-colors"
      onScroll={onGuideScroll}
    >
      {segments.length > 0 ? (
        <>
          {segments.map((segment, index) => (
            <TranscriptSegment
              key={`segment-${index}-${segment.id}`}
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
              segmentIndex={index}
              allSegments={segments}
              clientId={clientId}
              onSpeakerChange={isReadOnly ? undefined : onSpeakerChange}
              guideLevel={guideLevel}
              onGuideNext={nextGuideLevel}
              onGuideComplete={endGuide}
              isFirstSegment={index === 0}
            />
          ))}
          {/* 스크롤 감지용 타겟 */}
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
