import React from 'react';

import type { SttModel } from '@/feature/session/types';
import { cn } from '@/lib/cn';

interface MobileSttModelSelectorProps {
  sttModel: SttModel;
  setSttModel: React.Dispatch<React.SetStateAction<SttModel>>;
}

export const MobileSttModelSelector: React.FC<MobileSttModelSelectorProps> = ({
  sttModel,
  setSttModel,
}) => {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setSttModel('whisper')}
        className={cn(
          'flex items-center gap-1 rounded-md px-3 py-1.5 text-sm transition-colors',
          sttModel === 'whisper'
            ? 'bg-primary-100 text-primary'
            : 'text-fg-muted hover:bg-surface-contrast'
        )}
      >
        일반
        <div
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-full',
            sttModel === 'whisper' ? 'bg-primary' : 'bg-surface-strong'
          )}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.6666 3.5L5.24998 9.91667L2.33331 7"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>
      <button
        type="button"
        onClick={() => setSttModel('gemini-3')}
        className={cn(
          'flex items-center gap-1 rounded-md px-3 py-1.5 text-sm transition-colors',
          sttModel === 'gemini-3'
            ? 'bg-primary-100 text-primary'
            : 'text-fg-muted hover:bg-surface-contrast'
        )}
      >
        고급
        <div
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-full',
            sttModel === 'gemini-3' ? 'bg-primary' : 'bg-surface-strong'
          )}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.6666 3.5L5.24998 9.91667L2.33331 7"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>
    </div>
  );
};
