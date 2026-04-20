import { cn } from '@/lib/cn';

import { EDITABLE_CLASS } from '../editable';

interface ReferralQuoteProps {
  value: string;
  editable?: boolean;
}

export function ReferralQuote({ value, editable }: ReferralQuoteProps) {
  return (
    <div className="flex items-center justify-center rounded-lg bg-grey-40 px-6 py-8">
      <p
        className={cn('note-desc', editable && EDITABLE_CLASS)}
        contentEditable={editable}
        suppressContentEditableWarning={editable}
        data-note-path={editable ? 'phase4.roadmap.referral' : undefined}
      >
        "{value}"
      </p>
    </div>
  );
}

export function serializeReferral(value: string): string {
  return `- 전문가 자문: ${value}`;
}
