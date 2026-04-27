import type { TermsType } from '@/app/router/constants';
import type { TermItem } from '@/features/terms-agreement/types';
import { Button, CheckBox } from '@/shared/ui';

import { TermItemRow } from './TermItemRow';

interface TermsAgreementCardProps {
  terms: TermItem[];
  agreements: Record<string, boolean>;
  allChecked: boolean;
  allRequiredChecked: boolean;
  toggleAll: () => void;
  toggleOne: (termId: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  onTermDetail: (type: TermsType) => void;
}

export const TermsAgreementCard = ({
  terms,
  agreements,
  allChecked,
  allRequiredChecked,
  toggleAll,
  toggleOne,
  onSubmit,
  isSubmitting,
  onTermDetail,
}: TermsAgreementCardProps) => {
  return (
    <div className="flex min-h-screen w-full flex-col justify-center gap-24 rounded-2xl bg-surface px-4 py-8 shadow-sm md:px-12 lg:h-[845px] lg:min-h-full lg:max-w-[706px] lg:px-20">
      {/* 타이틀 */}
      <div className="flex flex-col gap-4 text-center">
        <h2 className="text-xl font-emphasize text-grey-100 md:text-4xl">
          이용약관 및 정책
        </h2>
        <p className="text-m font-emphasize text-grey-100 md:text-xl">
          마음토스 서비스 약관을 확인해 주세요
        </p>
      </div>

      <div>
        {/* 모두 동의 */}
        <div className="my-6">
          <CheckBox
            checked={allChecked}
            onChange={toggleAll}
            tone="primary"
            size="lg"
            className="items-center"
            label={<span className="terms-content-typo">모두 동의해요</span>}
          />
        </div>

        {/* 구분선 */}
        <hr className="mb-3 border-border" />

        {/* 약관 항목 목록 */}
        <div className="mb-6">
          {[...terms].reverse().map((term) => (
            <TermItemRow
              key={term.id}
              term={term}
              checked={agreements[term.id] ?? false}
              onToggle={toggleOne}
              onDetail={onTermDetail}
            />
          ))}
        </div>

        {/* 계속 버튼 */}
        <Button
          tone="primary"
          size="lg"
          className="w-full"
          disabled={!allRequiredChecked}
          loading={isSubmitting}
          onClick={onSubmit}
        >
          계속
        </Button>
      </div>
    </div>
  );
};
