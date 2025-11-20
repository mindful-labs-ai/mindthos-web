import React from 'react';

import type { TranscribeSegment, Speaker } from '../types';
import { formatTime } from '../utils/formatTime';
import { getSpeakerInfo } from '../utils/getSpeakerInfo';
import { getSpeakerDisplayName } from '../utils/speakerUtils';

interface TranscriptSegmentProps {
  segment: TranscribeSegment;
  speakers: Speaker[];
  isActive: boolean;
  isEditable?: boolean;
  segmentRef?: React.RefObject<HTMLDivElement | null>;
  onClick: (startTime: number) => void;
  onTextEdit?: (segmentId: number, newText: string) => void;
  onSpeakerChange?: (segmentId: number, newSpeakerId: number) => void;
}

export const TranscriptSegment: React.FC<TranscriptSegmentProps> = ({
  segment,
  speakers,
  isActive,
  isEditable = false,
  segmentRef,
  onClick,
  onTextEdit,
  onSpeakerChange,
}) => {
  const [isEditingText, setIsEditingText] = React.useState(false);
  const [editedText, setEditedText] = React.useState(segment.text);
  const [isEditingSpeaker, setIsEditingSpeaker] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const { name, label, bgColor, textColor } = getSpeakerInfo(segment, speakers);

  React.useEffect(() => {
    setEditedText(segment.text);
  }, [segment.text]);

  React.useEffect(() => {
    if (isEditingText && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditingText]);

  const handleClick = () => {
    if (isEditingText || isEditingSpeaker) {
      return;
    }

    if (isEditable) {
      setIsEditingText(true);
    } else {
      onClick(segment.start);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (isEditingText || isEditingSpeaker) {
        return;
      }

      e.preventDefault();
      if (isEditable) {
        setIsEditingText(true);
      } else {
        onClick(segment.start);
      }
    }
  };

  const handleTextSave = () => {
    if (onTextEdit && editedText !== segment.text) {
      onTextEdit(segment.id, editedText);
    }
    setIsEditingText(false);
  };

  const handleTextCancel = () => {
    setEditedText(segment.text);
    setIsEditingText(false);
  };

  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleTextSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleTextCancel();
    }
  };

  const handleSpeakerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditable) {
      setIsEditingSpeaker(!isEditingSpeaker);
    }
  };

  const handleSpeakerSelect = (speakerId: number) => {
    if (onSpeakerChange && speakerId !== segment.speaker) {
      onSpeakerChange(segment.id, speakerId);
    }
    setIsEditingSpeaker(false);
  };

  const isMac =
    typeof navigator !== 'undefined' &&
    navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const saveKeyHint = isMac ? '⌘+Enter' : 'Ctrl+Enter';

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
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div
        role={isEditable ? 'button' : undefined}
        tabIndex={isEditable ? 0 : undefined}
        className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-transform ${bgColor} ${
          isActive ? 'scale-110' : 'group-hover:scale-105'
        } ${isEditable ? 'cursor-pointer' : ''}`}
        onClick={handleSpeakerClick}
        onKeyDown={
          isEditable
            ? (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSpeakerClick(e as unknown as React.MouseEvent);
                }
              }
            : undefined
        }
        aria-label={isEditable ? '화자 변경' : undefined}
      >
        <span className={`text-sm font-medium ${textColor}`}>{label}</span>
        {isEditingSpeaker && (
          <div className="absolute left-0 top-12 z-50 w-32 rounded-lg border border-border bg-bg shadow-lg">
            {speakers.map((speaker) => (
              <button
                key={speaker.id}
                type="button"
                className="w-full px-4 py-2 text-left text-sm hover:bg-surface"
                onClick={() => handleSpeakerSelect(speaker.id)}
              >
                {getSpeakerDisplayName(speaker.id, speakers)}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm font-semibold text-fg">{name}</span>
          <span
            className={`text-xs transition-colors ${
              isActive ? 'text-primary' : 'text-fg-muted'
            }`}
          >
            {formatTime(segment.start)}
          </span>
        </div>
        {isEditingText ? (
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              onKeyDown={handleTextKeyDown}
              className="focus:ring-primary/20 w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-fg focus:border-primary focus:outline-none focus:ring-2"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-lg bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary-600"
                onClick={handleTextSave}
              >
                저장 ({saveKeyHint})
              </button>
              <button
                type="button"
                className="hover:bg-surface-hover rounded-lg bg-surface px-3 py-1.5 text-sm text-fg"
                onClick={handleTextCancel}
              >
                취소 (Esc)
              </button>
            </div>
          </div>
        ) : (
          <p
            className={`leading-relaxed ${
              isActive ? 'font-medium text-fg' : 'text-fg-muted'
            } ${isEditable ? 'hover:bg-surface-hover cursor-text' : ''}`}
          >
            {segment.text}
          </p>
        )}
      </div>
    </div>
  );
};
