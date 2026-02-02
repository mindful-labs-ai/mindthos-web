import React, { useState } from 'react';

import { ClipboardCopy, Import, RotateCcw, RotateCw, X } from 'lucide-react';

interface GenogramHeaderProps {
  copied: boolean;
  onCopyJSON: () => void;
  onImportJSON: (json: string) => void;
  onUndo: () => void;
  onRedo: () => void;
}

export const GenogramHeader: React.FC<GenogramHeaderProps> = ({
  copied,
  onCopyJSON,
  onImportJSON,
  onUndo,
  onRedo,
}) => {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importText, setImportText] = useState('');

  const handleImportConfirm = () => {
    if (importText.trim()) {
      onImportJSON(importText);
    }
    setImportText('');
    setShowImportDialog(false);
  };

  const handleImportCancel = () => {
    setImportText('');
    setShowImportDialog(false);
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-xl font-bold text-fg">가계도</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium text-fg transition-colors hover:bg-surface-contrast"
            onClick={() => setShowImportDialog(true)}
          >
            <Import size={16} />
            JSON 불러오기
          </button>
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

      {showImportDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-fg">JSON 불러오기</h2>
              <button
                type="button"
                className="text-fg/60 rounded p-1 transition-colors hover:bg-surface-contrast hover:text-fg"
                onClick={handleImportCancel}
              >
                <X size={18} />
              </button>
            </div>
            <textarea
              className="placeholder:text-fg/40 h-64 w-full resize-none rounded-md border border-border bg-surface-contrast p-3 font-mono text-sm text-fg focus:border-primary focus:outline-none"
              placeholder="JSON 데이터를 입력하세요..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md px-4 py-2 text-sm font-medium text-fg transition-colors hover:bg-surface-contrast"
                onClick={handleImportCancel}
              >
                취소
              </button>
              <button
                type="button"
                className="hover:bg-primary/90 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
                disabled={!importText.trim()}
                onClick={handleImportConfirm}
              >
                불러오기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
