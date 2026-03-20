import React from 'react';

import { Plus, Trash2 } from 'lucide-react';

import type { Speaker, TranscribeSegment } from '@/features/session/types';
import { formatTime } from '@/features/session/utils/formatTime';
import { getSpeakerInfo } from '@/features/session/utils/getSpeakerInfo';
import {
  parseNonverbalText,
  renderTextWithNonverbal,
} from '@/features/session/utils/parseNonverbalText';

import { SpeakerEditPopup } from './SpeakerEditPopup';

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
  /** 세그먼트 추가 콜백 (편집 모드에서만) */
  onAddSegment?: (afterSegmentId: number, speaker: number) => void;
  /** 세그먼트 삭제 콜백 (편집 모드에서만) */
  onDeleteSegment?: (segmentId: number) => void;
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
  onAddSegment,
  onDeleteSegment,
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

  // 편집 모드 진입 시에만 segment.text로 초기화 (편집 중에는 외부 변경 무시)
  const prevIsEditable = React.useRef(isEditable);
  React.useEffect(() => {
    if (isEditable && !prevIsEditable.current) {
      setEditedText(segment.text);
    }
    if (!isEditable && prevIsEditable.current) {
      setEditedText(segment.text);
    }
    prevIsEditable.current = isEditable;
  }, [isEditable, segment.text]);

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

  // 화자 라벨 렌더링
  const speakerCircle = (interactive?: boolean) => (
    <div
      {...(interactive && {
        role: 'button',
        tabIndex: 0,
        onClick: handleSpeakerClick,
        onKeyDown: handleSpeakerKeyDown,
        'aria-label': '화자 편집',
      })}
      className={`relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-grey-40 transition-all md:h-9 md:w-9 ${bgColor} ${
        interactive ? 'cursor-pointer' : ''
      } ${isActive ? 'scale-105' : 'group-hover:scale-105'}`}
    >
      <span className={`text-m font-medium md:text-l ${textColor}`}>
        {label}
      </span>
    </div>
  );

  const handleAddSegment = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddSegment?.(segment.id, segment.speaker);
  };

  const handleDeleteSegment = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteSegment?.(segment.id);
  };

  return (
    <div
      ref={segmentRef}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      className={`group/segment group relative flex gap-4 rounded-lg px-4 py-2.5 text-left transition-all duration-normal md:py-4 ${
        isClickable ? 'cursor-pointer' : ''
      } ${
        isActive
          ? 'bg-grey-20'
          : isEditable
            ? 'hover:grey-20'
            : `${isClickable ? 'hover:border-grey-40 hover:bg-grey-20' : ''}`
      }`}
      onClick={handleContainerClick}
      onKeyDown={handleKeyDown}
    >
      {/* 편집 모드 삭제 버튼 (우측 상단) */}
      {isEditable && onDeleteSegment && (
        <button
          onClick={handleDeleteSegment}
          className="pointer-events-none absolute right-2 top-2 rounded-md p-1.5 text-red-500 opacity-0 transition-all hover:text-red-600 group-hover/segment:pointer-events-auto group-hover/segment:opacity-100"
          aria-label="세그먼트 삭제"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

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
              triggerElement={speakerCircle(true)}
              onApply={onSpeakerChange}
            />
          ) : (
            speakerCircle(false)
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
              className="cursor-pointer text-sm font-medium text-grey-100 hover:underline md:text-m"
            >
              {name}
            </span>
          )}
          {!isAnonymized && !onSpeakerChange && (
            <span className="text-sm font-medium text-grey-100 md:text-m">
              {name}
            </span>
          )}
          {isAnonymized && (
            <span className="text-sm font-medium text-grey-100 md:text-m">
              익명화됨
            </span>
          )}
          {showTimestampDisplay &&
            segment.start != null &&
            segment.start > 0 && (
              <span className="text-sm text-grey-70 md:text-m">
                {formatTime(segment.start)}
              </span>
            )}
          {!showTimestamp && speakerUtteranceIndex !== undefined && (
            <span className="text-sm text-grey-70 md:text-m">
              {speakerUtteranceIndex}
            </span>
          )}
        </div>
        {isEditable ? (
          <textarea
            placeholder="대화 내용을 입력해주세요."
            ref={textareaRef}
            value={editedText}
            onChange={handleTextareaChange}
            onClick={(e) => e.stopPropagation()}
            rows={1}
            className={`m-0 block w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-sm leading-relaxed text-grey-100 outline-none placeholder:text-grey-70 md:text-m ${
              isActive ? 'font-emphasize' : ''
            }`}
          />
        ) : (
          <p
            className={`m-0 text-sm leading-relaxed text-grey-100 md:text-m ${isActive ? 'font-emphasize' : ''}`}
          >
            {renderTextWithNonverbal(textParts, sttModel)}
          </p>
        )}
      </div>

      {/* 편집 모드 세그먼트 추가 버튼 (중앙 하단) */}
      {isEditable && onAddSegment && (
        <button
          onClick={handleAddSegment}
          className="pointer-events-none absolute bottom-0 left-1/2 z-10 flex -translate-x-1/2 translate-y-1/2 items-center gap-1 rounded-md border border-primary bg-primary-subtle p-2 text-primary opacity-0 shadow-sm transition-all hover:scale-105 hover:border-primary group-hover/segment:pointer-events-auto group-hover/segment:opacity-100"
          aria-label="세그먼트 추가"
        >
          <Plus className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

// React.memo로 래핑하여 불필요한 리렌더링 방지
export const TranscriptSegment = React.memo(TranscriptSegmentComponent);
