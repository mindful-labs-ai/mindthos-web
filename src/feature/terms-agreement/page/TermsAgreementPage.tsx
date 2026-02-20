import { useEffect } from 'react';

import { Spinner } from '@/components/ui';
import { useToast } from '@/components/ui/composites/Toast';
import { ROUTES, getTermsRoute, type TermsType } from '@/router/constants';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { useAuthStore } from '@/stores/authStore';

import { TermsAgreementCard } from '../components/TermsAgreementCard';
import { useTermsAgreement } from '../hooks/useTermsAgreement';
import { useTermsList } from '../hooks/useTermsList';

const TermsAgreementPage = () => {
  const { navigateWithUtm } = useNavigateWithUtm();
  const { toast } = useToast();
  const termsAgreedAt = useAuthStore((state) => state.termsAgreedAt);
  const { terms, isLoading, isError } = useTermsList();
  const {
    agreements,
    allChecked,
    allRequiredChecked,
    toggleAll,
    toggleOne,
    submit,
    isSubmitting,
  } = useTermsAgreement(terms);

  // 이미 약관 동의 완료된 유저는 홈으로 리다이렉트
  useEffect(() => {
    if (termsAgreedAt) {
      navigateWithUtm(ROUTES.ROOT, { replace: true });
    }
  }, [termsAgreedAt, navigateWithUtm]);

  const handleSubmit = async () => {
    try {
      await submit();
      navigateWithUtm(ROUTES.ROOT, { replace: true });
    } catch {
      toast({
        title: '약관 동의 처리 중 오류가 발생했습니다.',
      });
    }
  };

  const handleTermDetail = (type: TermsType) => {
    window.open(getTermsRoute(type), '_blank');
  };

  if (termsAgreedAt) return null;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-contrast p-4">
      {isError ? (
        <div className="text-center">
          <p className="text-base text-muted">
            약관 정보를 불러오는 중 오류가 발생했습니다.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-primary-500 hover:text-primary-600"
          >
            다시 시도
          </button>
        </div>
      ) : (
        <TermsAgreementCard
          terms={terms}
          agreements={agreements}
          allChecked={allChecked}
          allRequiredChecked={allRequiredChecked}
          toggleAll={toggleAll}
          toggleOne={toggleOne}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onTermDetail={handleTermDetail}
        />
      )}
    </div>
  );
};

export default TermsAgreementPage;
