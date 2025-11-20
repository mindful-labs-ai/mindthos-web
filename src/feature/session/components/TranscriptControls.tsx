import React from 'react';

import type { Speaker } from '../types';

interface TranscriptControlsProps {
  speakers: Speaker[];
  speakerFilter: number | null;
  isEditing: boolean;
  onSpeakerFilterChange: (speakerId: number | null) => void;
  onEditingToggle: () => void;
  getSpeakerName: (speakerId: number) => string;
}

export const TranscriptControls: React.FC<TranscriptControlsProps> = ({
  speakers,
  speakerFilter,
  isEditing,
  onSpeakerFilterChange,
  onEditingToggle,
  getSpeakerName,
}) => {
  return (
    <div className="flex-shrink-0 border-b border-border bg-bg px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-fg-muted">화자 필터:</span>
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm transition-all ${
              speakerFilter === null
                ? 'bg-primary text-white'
                : 'hover:bg-surface-hover bg-surface text-fg'
            }`}
            onClick={() => onSpeakerFilterChange(null)}
          >
            전체
          </button>
          {speakers.map((speaker) => (
            <button
              key={speaker.id}
              type="button"
              className={`rounded-lg px-3 py-1.5 text-sm transition-all ${
                speakerFilter === speaker.id
                  ? 'bg-primary text-white'
                  : 'hover:bg-surface-hover bg-surface text-fg'
              }`}
              onClick={() => onSpeakerFilterChange(speaker.id)}
            >
              {getSpeakerName(speaker.id)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`text-sm transition-colors ${
              isEditing
                ? 'text-fg-muted hover:text-fg'
                : 'text-primary hover:underline'
            }`}
            onClick={onEditingToggle}
          >
            {isEditing ? '완료' : '편집'}
          </button>
        </div>
      </div>
    </div>
  );
};
