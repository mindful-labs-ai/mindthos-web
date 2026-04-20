import React, { useState } from 'react';

import { ChevronDownIcon } from '@/shared/icons';

import { CopyButton } from './CopyButton';
import { useCopyToClipboard } from './useCopyToClipboard';

interface PhaseSectionProps {
  phase: string;
  title: string;
  children: React.ReactNode;
  /** 섹션 전체를 텍스트로 직렬화한 값 (복사용) */
  copyText: string;
  editable?: boolean;
}

export function PhaseSection({
  phase,
  title,
  children,
  copyText,
  editable,
}: PhaseSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { copiedId, copy } = useCopyToClipboard();

  return (
    <div className="mb-4 rounded-lg">
      <div className="mb-3 flex items-center gap-2 border-b border-border-subtle pb-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <h3 className="pl-2 text-l font-headline text-grey-100">{title}</h3>
          <ChevronDownIcon
            size={20}
            className={`shrink-0 text-grey-60 transition-transform ${collapsed ? '-rotate-90' : ''}`}
          />
        </button>
        {!editable && (
          <CopyButton
            isCopied={copiedId === `phase-${phase}`}
            onClick={() => copy(copyText, `phase-${phase}`)}
            label="복사"
            size="md"
          />
        )}
      </div>
      {!collapsed && <div className="space-y-6">{children}</div>}
    </div>
  );
}
