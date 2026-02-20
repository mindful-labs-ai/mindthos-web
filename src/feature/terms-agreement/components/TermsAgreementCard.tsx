import { Button, CheckBox, Text, Title } from '@/components/ui';
import type { TermsType } from '@/router/constants';

import type { TermItem } from '../types';

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
    <div className="w-full max-w-md rounded-2xl bg-surface px-12 py-8 shadow-sm">
      {/* 타이틀 */}
      <div className="mb-16 flex flex-col gap-4 text-center">
        <Title as="h2" className="text-2xl font-bold">
          이용약관 및 정책
        </Title>
        <Text className="text-sm font-semibold text-muted">
          마음토스 서비스 약관을 확인해주세요
        </Text>
      </div>

      {/* 모두 동의 */}
      <div className="my-6">
        <CheckBox
          checked={allChecked}
          onChange={toggleAll}
          tone="primary"
          size="lg"
          className="items-center"
          label={<span className="text-lg font-medium">모두 동의합니다</span>}
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
  );
};
