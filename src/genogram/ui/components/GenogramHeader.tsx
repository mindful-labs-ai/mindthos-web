import React from 'react';

import { ClipboardCopy, RotateCcw, RotateCw } from 'lucide-react';

interface GenogramHeaderProps {
  copied: boolean;
  onCopyJSON: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

export const GenogramHeader: React.FC<GenogramHeaderProps> = ({
  copied,
  onCopyJSON,
  onUndo,
  onRedo,
}) => {
  return (
    <div className="flex items-center justify-between border-b border-border px-6 py-4">
      <h1 className="text-xl font-bold text-fg">가계도</h1>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium text-fg transition-colors hover:bg-surface-contrast"
          onClick={onCopyJSON}
        >
          <ClipboardCopy size={16} />
          {copied ? '복사됨' : 'JSON 복사'}
        </button>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium text-fg transition-colors hover:bg-surface-contrast"
          onClick={onUndo}
        >
          <RotateCcw size={16} />
          실행취소
        </button>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium text-fg transition-colors hover:bg-surface-contrast"
          onClick={onRedo}
        >
          <RotateCw size={16} />
          다시실행
        </button>
      </div>
    </div>
  );
};
