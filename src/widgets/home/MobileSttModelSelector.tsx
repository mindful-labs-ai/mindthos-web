import React from 'react';

import type { SttModel } from '@/features/session/types';
import { cn } from '@/lib/cn';

interface MobileSttModelSelectorProps {
  sttModel: SttModel;
  setSttModel:
    | React.Dispatch<React.SetStateAction<SttModel>>
    | ((value: SttModel) => void);
}

export const MobileSttModelSelector: React.FC<MobileSttModelSelectorProps> = ({
  sttModel,
  setSttModel,
}) => {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setSttModel('basic')}
        className={cn('typo-sm flex items-center gap-1 rounded-md px-3 py-1.5')}
      >
        일반
        <div
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-full transition-colors duration-slow',
            sttModel === 'basic' ? 'bg-green-80' : 'bg-grey-40'
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
        onClick={() => setSttModel('advanced')}
        className={cn('typo-sm flex items-center gap-1 rounded-md px-3 py-1.5')}
      >
        고급
        <div
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-full transition-colors duration-slow',
            sttModel === 'advanced' ? 'bg-green-80' : 'bg-grey-40'
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
