import React from 'react';

import { Spotlight } from '@/components/ui/composites/Spotlight';

import type { Speaker, TranscribeSegment } from '../types';
import { formatTime } from '../utils/formatTime';
import { getSpeakerInfo } from '../utils/getSpeakerInfo';
import {
  parseNonverbalText,
  renderTextWithNonverbal,
} from '../utils/parseNonverbalText';

import { SpeakerEditPopup } from './SpeakerEditPopup';
import { SpeakerLabelTooltip } from './TranscriptEditGuideTooltips';

interface TranscriptSegmentProps {
  segment: TranscribeSegment;
  speakers: Speaker[];
  isActive: boolean;
  isEditable?: boolean;
  isAnonymized?: boolean;
  sttModel?: string | null;
  segmentRef?: React.RefObject<HTMLDivElement | null>;
  onClick: (startTime: number) => void;
  onTextEdit?: (segmentId: number, newText: string) => void;
  showTimestamp?: boolean;
  /** 화자별 발언 번호 (복사 시 넘버링과 동일) */
  speakerUtteranceIndex?: number;
  allSegments?: TranscribeSegment[];
  clientId?: string | null;
  onSpeakerChange?: (updates: {
    speakerChanges: Record<number, number>;
    speakerDefinitions: Speaker[];
  }) => Promise<void>;
  /** 현재 가이드 레벨 (4: 화자 라벨, 5: 화자 선택) */
  guideLevel?: 4 | 5 | null;
  /** 다음 가이드 레벨로 진행 */
  onGuideNext?: () => void;
  /** 가이드 완료 */
  onGuideComplete?: () => void;
  /** 첫 번째 세그먼트 여부 (Spotlight은 첫 번째만) */
  isFirstSegment?: boolean;
}

const TranscriptSegmentComponent: React.FC<TranscriptSegmentProps> = ({
  segment,
  speakers,
  isActive,
  isEditable = false,
  isAnonymized = false,
  sttModel,
  segmentRef,
  onClick,
  onTextEdit,
  showTimestamp = true,
  speakerUtteranceIndex,
  allSegments = [],
  clientId,
  onSpeakerChange,
  guideLevel,
  onGuideNext,
  onGuideComplete,
  isFirstSegment = false,
}) => {
  const [editedText, setEditedText] = React.useState(segment.text);
  const [isSpeakerPopupOpen, setIsSpeakerPopupOpen] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const { name, label, bgColor, textColor } = getSpeakerInfo(segment, speakers);

  // 타임스탬프 표시 여부 결정
  const showTimestampDisplay =
    showTimestamp && segment.start !== null && segment.end !== null;

  // 텍스트 비언어적 표현 분리
  const textParts = parseNonverbalText(segment.text);

  // 편집 모드이고 타임스탬프가 없는 경우 (gemini-3) 클릭 비활성화
  const isClickable =
    !isEditable && segment.start !== null && segment.end !== null;

  const handleContainerClick = () => {
    if (isClickable && segment.start !== null) {
      onClick(segment.start);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      if (segment.start !== null) {
        onClick(segment.start);
      }
    }
  };

  // 텍스트 영역 높이 자동 조절 (초기 마운트 시에만)
  React.useEffect(() => {
    if (textareaRef.current && isEditable) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditable]);

  // segment.text가 변경되면 editedText도 업데이트
  React.useEffect(() => {
    setEditedText(segment.text);
  }, [segment.text]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    const newText = textarea.value;
    setEditedText(newText);

    // 높이 조절을 requestAnimationFrame으로 다음 프레임에 처리
    requestAnimationFrame(() => {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    });

    if (onTextEdit) {
      onTextEdit(segment.id, newText);
    }
  };

  const handleSpeakerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSpeakerPopupOpen(true);
    // 가이드 Level 4 → 5 전환은 SpeakerEditPopup에서 useEffect로 처리
  };

  const handleSpeakerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      setIsSpeakerPopupOpen(true);
    }
  };

  // 화자 라벨 렌더링 (Spotlight 래핑 포함)
  const renderSpeakerLabel = () => {
    const labelElement = (
      <div
        role="button"
        tabIndex={0}
        onClick={handleSpeakerClick}
        onKeyDown={handleSpeakerKeyDown}
        aria-label="화자 편집"
        className={`relative flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-full transition-all ${bgColor} ${
          isActive ? 'scale-105' : 'group-hover:scale-105'
        }`}
      >
        <span className={`text-base font-medium ${textColor}`}>{label}</span>
      </div>
    );

    // 첫 번째 세그먼트이고 가이드 Level 4인 경우에만 Spotlight
    if (isFirstSegment && guideLevel === 4) {
      return (
        <Spotlight
          isActive={true}
          tooltip={<SpeakerLabelTooltip />}
          tooltipPosition="left"
          store="featureGuide"
        >
          {labelElement}
        </Spotlight>
      );
    }

    return labelElement;
  };

  return (
    <div
      ref={segmentRef}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      className={`group flex gap-4 rounded-lg p-4 text-left transition-all duration-200 ${
        isClickable ? 'cursor-pointer' : ''
      } ${
        isActive
          ? 'bg-surface-contrast'
          : `${isClickable ? 'hover:border-border hover:bg-surface-contrast' : ''}`
      }`}
      onClick={handleContainerClick}
      onKeyDown={handleKeyDown}
    >
      {!isAnonymized && (
        <>
          {onSpeakerChange ? (
            <SpeakerEditPopup
              open={isSpeakerPopupOpen}
              onOpenChange={setIsSpeakerPopupOpen}
              segment={segment}
              speakers={speakers}
              allSegments={allSegments}
              clientId={clientId || null}
              triggerElement={renderSpeakerLabel()}
              onApply={onSpeakerChange}
              guideLevel={guideLevel}
              onGuideNext={onGuideNext}
              onGuideComplete={onGuideComplete}
            />
          ) : (
            <div
              className={`relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-transform ${bgColor} ${
                isActive ? 'scale-105' : 'group-hover:scale-105'
              }`}
            >
              <span className={`text-base font-medium ${textColor}`}>
                {label}
              </span>
            </div>
          )}
        </>
      )}
      <div className="flex-1">
        <div className="mb-2 flex items-center gap-2">
          {!isAnonymized && onSpeakerChange && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleSpeakerClick}
              onKeyDown={handleSpeakerKeyDown}
              aria-label="화자 편집"
              className="cursor-pointer text-sm font-semibold text-fg hover:underline"
            >
              {name}
            </span>
          )}
          {!isAnonymized && !onSpeakerChange && (
            <span className="text-sm font-semibold text-fg">{name}</span>
          )}
          {isAnonymized && (
            <span className="text-sm font-semibold text-fg">익명화됨</span>
          )}
          {showTimestampDisplay && segment.start !== null && (
            <span className="text-xs text-fg-muted">
              {formatTime(segment.start)}
            </span>
          )}
          {!showTimestampDisplay && speakerUtteranceIndex !== undefined && (
            <span className="text-xs text-fg-muted">{speakerUtteranceIndex}</span>
          )}
        </div>
        {isEditable ? (
          <textarea
            ref={textareaRef}
            value={editedText}
            onChange={handleTextareaChange}
            onClick={(e) => e.stopPropagation()}
            rows={1}
            className={`m-0 block w-full resize-none overflow-hidden border-0 bg-transparent p-0 leading-relaxed outline-none ${
              isActive ? 'font-medium text-fg' : 'text-fg-muted'
            }`}
            style={{
              lineHeight: '1.625',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              fontWeight: 'inherit',
              minHeight: '1.625em',
            }}
          />
        ) : (
          <p
            className={`m-0 leading-relaxed ${
              isActive ? 'font-medium text-fg' : 'text-fg-muted'
            }`}
          >
            {renderTextWithNonverbal(textParts, sttModel)}
          </p>
        )}
      </div>
    </div>
  );
};

// React.memo로 래핑하여 불필요한 리렌더링 방지
export const TranscriptSegment = React.memo(TranscriptSegmentComponent);
