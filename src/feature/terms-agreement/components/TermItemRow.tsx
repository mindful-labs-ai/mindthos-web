import { CheckBox } from '@/components/ui';
import { cn } from '@/lib/cn';
import { TERMS_TYPES, type TermsType } from '@/router/constants';
import { ChevronRightIcon } from '@/shared/icons';

import type { TermItem } from '../types';

interface TermItemRowProps {
  term: TermItem;
  checked: boolean;
  onToggle: (termId: string) => void;
  onDetail?: (type: TermsType) => void;
}

const DETAIL_TYPES = new Set<string>([
  TERMS_TYPES.SERVICE,
  TERMS_TYPES.PRIVACY,
  TERMS_TYPES.MARKETING,
]);

const hasDetailPage = (type: string): type is TermsType =>
  DETAIL_TYPES.has(type);

export const TermItemRow = ({
  term,
  checked,
  onToggle,
  onDetail,
}: TermItemRowProps) => {
  const prefix = term.is_required ? '[필수]' : '[선택]';
  const showChevron = hasDetailPage(term.type);

  return (
    <div className="flex flex-col gap-1 py-3">
      <div className="flex items-center justify-between">
        <CheckBox
          checked={checked}
          onChange={() => onToggle(term.id)}
          tone="primary"
          size="md"
          className="items-center"
          label={
            <span className={cn('text-base')}>
              {prefix} {term.title}
            </span>
          }
        />
        {showChevron && (
          <button
            type="button"
            onClick={() => {
              if (onDetail && hasDetailPage(term.type)) {
                onDetail(term.type);
              }
            }}
            className="shrink-0 p-1 text-fg-muted transition-colors hover:text-fg"
            aria-label={`${term.title} 상세 보기`}
          >
            <ChevronRightIcon size={18} />
          </button>
        )}
      </div>
      {term.type === 'marketing' && (
        <p className="ml-7 mt-1 text-sm text-fg-muted">
          마음토스에서 상담사 선생님들을 위해 제공하는 쿠폰과
          <br />
          이벤트 혜택에 대한 정보를 받으실 수 있습니다.
        </p>
      )}
    </div>
  );
};
