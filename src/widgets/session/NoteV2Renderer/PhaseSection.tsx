import React, { useState } from 'react';

import { ChevronDownIcon } from '@/shared/icons';

import { CopyButton } from './CopyButton';
import { useCopyToClipboard } from './useCopyToClipboard';

interface PhaseSectionProps {
  /** "Phase 1" / "Phase 2" / ... / "Overall" */
  phase: string;
  /** Phase 본문 제목 (예: "기초 사정"). "Overall"인 경우 그대로 표기. */
  title: string;
  children: React.ReactNode;
  /** 섹션 전체를 텍스트로 직렬화한 값 (복사용) */
  copyText: string;
  /** 좌측 목차/anchor id */
  anchorId?: string;
  editable?: boolean;
}

/**
 * Phase 단위 컨테이너.
 *
 * - 헤더 표기: phase가 "Phase N" 형태이면 "Phase N: 제목" 한 줄로 합성.
 *   "Overall" 같은 비-번호 phase는 title만 표시.
 * - 아코디언: default open. 컴포넌트 마운트마다 펼침으로 시작 (로컬 state).
 *   재렌더링이 아니라 unmount → mount되면 자동 초기화.
 */
export function PhaseSection({
  phase,
  title,
  children,
  copyText,
  anchorId,
  editable,
}: PhaseSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { copiedId, copy } = useCopyToClipboard();
  const headerId = anchorId ? `${anchorId}-h` : undefined;

  const isPhaseN = /^Phase\s+\d+$/i.test(phase);
  const headerLabel = isPhaseN ? `${phase}: ${title}` : title;

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
            isCopied={copiedId === `phase-${phase}`}
            onClick={() => copy(copyText, `phase-${phase}`)}
            label="복사"
            size="md"
          />
        )}
      </div>
      {!collapsed && <div className="space-y-4">{children}</div>}
    </section>
  );
}
