import { cn } from '@/lib/cn';
import { UserPlusIcon } from '@/shared/icons';

import { EDITABLE_CLASS } from '../editable';

interface ReferralQuoteProps {
  value: string;
  editable?: boolean;
}

export function ReferralQuote({ value, editable }: ReferralQuoteProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-green-40 bg-gradient-to-br from-green-20 via-green-10 to-white p-3 shadow-sm">
      <div className="relative flex flex-col gap-2">
        <div className="note-card-title flex items-center gap-1.5">
          <UserPlusIcon size={14} />
          <span>전문가 자문</span>
        </div>
        <p
          className={cn('note-card-sub', editable && EDITABLE_CLASS)}
          contentEditable={editable}
          suppressContentEditableWarning={editable}
          data-note-path={editable ? 'phase4.roadmap.referral' : undefined}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export function serializeReferral(value: string): string {
  return `전문가 자문: ${value}`;
}
