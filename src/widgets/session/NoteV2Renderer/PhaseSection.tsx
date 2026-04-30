import React, { useState } from 'react';

import { ChevronDownIcon } from '@/shared/icons';

import { CopyButton } from './CopyButton';
import { useCopyToClipboard } from './useCopyToClipboard';

interface PhaseSectionProps {
  /** 대목차 번호 (1, 2, …). 총평처럼 번호 없이 표기할 때는 omit. */
  mainNumber?: number;
  /** 대목차 제목 (예: "기초 사정") */
  title: string;
  children: React.ReactNode;
  /** 섹션 전체를 텍스트로 직렬화한 값 (복사용) */
  copyText: string;
  /** 좌측 목차/anchor id */
  anchorId?: string;
  editable?: boolean;
}

/**
 * 대목차(노트 최상위 섹션) 컨테이너.
 *
 * - 헤더 표기: "{mainNumber}. {title}" 형식 (mainNumber omit 시 title만 표시)
 * - 아코디언: default open. unmount → mount 시 자동 초기화.
 */
export function PhaseSection({
  mainNumber,
  title,
  children,
  copyText,
  anchorId,
  editable,
}: PhaseSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { copiedId, copy } = useCopyToClipboard();
  const headerId = anchorId ? `${anchorId}-h` : undefined;

  const headerLabel =
    mainNumber !== undefined ? `${mainNumber}. ${title}` : title;
  const copyKey = mainNumber !== undefined ? `phase-${mainNumber}` : `phase-${title}`;

  return (
    <section
      id={anchorId}
      aria-labelledby={headerId}
      className="mb-4 scroll-mt-24 rounded-lg"
    >
      <div className="mb-3 flex items-center gap-2 border-b border-border-subtle pb-2">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-expanded={!collapsed}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <h2
            id={headerId}
            className="pl-2 text-l font-headline text-grey-100"
          >
            {headerLabel}
          </h2>
          <ChevronDownIcon
            size={20}
            className={`shrink-0 text-grey-60 transition-transform ${collapsed ? '-rotate-90' : ''}`}
          />
        </button>
        {!editable && (
          <CopyButton
            isCopied={copiedId === copyKey}
            onClick={() => copy(copyText, copyKey)}
            label="복사"
            size="md"
          />
        )}
      </div>
      {!collapsed && <div className="space-y-4">{children}</div>}
    </section>
  );
}
