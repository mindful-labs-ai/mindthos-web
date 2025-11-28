import React from 'react';

import type { Speaker, TranscribeSegment } from '../types';
import { formatTime } from '../utils/formatTime';
import { getSpeakerInfo } from '../utils/getSpeakerInfo';
import {
  parseNonverbalText,
  renderTextWithNonverbal,
} from '../utils/parseNonverbalText';

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
}

export const TranscriptSegment: React.FC<TranscriptSegmentProps> = ({
  segment,
  speakers,
  isActive,
  isEditable = false,
  isAnonymized = false,
  sttModel,
  segmentRef,
  onClick,
  onTextEdit,
}) => {
  const [editedText, setEditedText] = React.useState(segment.text);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const { name, label, bgColor, textColor } = getSpeakerInfo(segment, speakers);

  // 비언어 표현 파싱 (gemini-3인 경우에만)
  const textParts = React.useMemo(
    () => parseNonverbalText(segment.text),
    [segment.text]
  );

  // segment.text가 변경되면 editedText도 동기화
  React.useEffect(() => {
    setEditedText(segment.text);
  }, [segment.text]);

  // textarea 높이 자동 조절
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // 편집 모드로 전환될 때 초기 높이 설정
    if (isEditable) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [isEditable]);

  // 텍스트 변경 시 높이 재조정
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || !isEditable) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [editedText, isEditable]);

  const handleContainerClick = () => {
    if (!isEditable) {
      onClick(segment.start);
    } else if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isEditable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(segment.start);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setEditedText(newText);
    if (onTextEdit) {
      onTextEdit(segment.id, newText);
    }
  };

  return (
    <div
      ref={segmentRef}
      role="button"
      tabIndex={0}
      className={`group flex cursor-pointer gap-4 rounded-lg p-4 text-left transition-all duration-200 ${
        isActive
          ? 'border-l-4 border-primary bg-surface shadow-sm'
          : 'border-l-4 border-transparent hover:border-border hover:bg-surface'
      }`}
      onClick={handleContainerClick}
      onKeyDown={handleKeyDown}
    >
      {!isAnonymized && (
        <div
          className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-transform ${bgColor} ${
            isActive ? 'scale-110' : 'group-hover:scale-105'
          }`}
        >
          <span className={`text-sm font-medium ${textColor}`}>{label}</span>
        </div>
      )}
      <div className="flex-1">
        <div className="mb-2 flex items-center gap-2">
          {!isAnonymized && (
            <span className="text-sm font-semibold text-fg">{name}</span>
          )}
          <span
            className={`text-xs transition-colors ${
              isActive ? 'text-primary' : 'text-fg-muted'
            }`}
          >
            {formatTime(segment.start)}
          </span>
        </div>
        {isEditable ? (
          <textarea
            ref={textareaRef}
            value={editedText}
            onChange={handleTextareaChange}
            onClick={(e) => e.stopPropagation()}
            rows={1}
            className={`w-full resize-none overflow-hidden border-0 bg-transparent p-0 leading-relaxed outline-none ${
              isActive ? 'font-medium text-fg' : 'text-fg-muted'
            }`}
            style={{
              lineHeight: 'inherit',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              fontWeight: 'inherit',
            }}
          />
        ) : (
          <p
            className={`leading-relaxed ${
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
