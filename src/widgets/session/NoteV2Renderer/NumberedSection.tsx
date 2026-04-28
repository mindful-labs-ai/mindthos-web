import { cn } from '@/lib/cn';

import { CopyButton } from './CopyButton';
import { useCopyToClipboard } from './useCopyToClipboard';

interface NumberedSectionProps {
  /** 0~12. 번호 없는 항목(이론 섹션 등)은 omit */
  number?: number;
  /** 스펙의 마크다운 제목 (예: "적용된 상담 이론") */
  title: string;
  /** 제목 옆 작은 보조 (예: "최대 5개") */
  hint?: string;
  /** 섹션 단위 복사 텍스트. 없으면 복사 버튼 미노출 */
  copyText?: string;
  /** anchor id — 우측 목차 점프용 */
  anchorId?: string;
  editable?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Phase 안의 소제목 카드.
 *
 * 시각:
 *  - border 없음. 평소 배경 투명.
 *  - lg(데스크톱) hover 시 bg-grey-10 + 우상단 CopyButton 노출
 *    (note-copy-btn-wrapper 표준 클래스 사용 — group-hover 패턴).
 *  - 자식 블록은 자체 카드/배경을 갖지 않도록 작성하여 이중 카드 방지.
 */
export function NumberedSection({
  number,
  title,
  hint,
  copyText,
  anchorId,
  editable,
  className,
  children,
}: NumberedSectionProps) {
  const { copiedId, copy } = useCopyToClipboard();
  const headerId = anchorId ? `${anchorId}-h` : undefined;

  return (
    <section
      id={anchorId}
      aria-labelledby={headerId}
      className={cn(
        'group relative scroll-mt-24 rounded-lg p-4 transition-colors sm:p-5 lg:hover:bg-grey-10',
        className
      )}
    >
      <header className="mb-3 flex items-baseline gap-2">
        {number !== undefined && (
          <span className="text-grey-50 font-emphasize tabular-nums">
            {number}.
          </span>
        )}
        <h3 id={headerId} className="text-l font-emphasize text-grey-100">
          {title}
        </h3>
        {hint && <span className="text-s text-grey-80">({hint})</span>}
      </header>
      <div>{children}</div>
      {!editable && copyText && (
        <div className="note-copy-btn-wrapper">
          <CopyButton
            isCopied={copiedId === (anchorId ?? title)}
            onClick={() => copy(copyText, anchorId ?? title)}
          />
        </div>
      )}
    </section>
  );
}
