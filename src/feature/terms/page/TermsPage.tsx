import { useEffect } from 'react';

import { useNavigate, useSearchParams } from 'react-router-dom';

import { Title } from '@/components/ui';
import { Accordion } from '@/components/ui/composites/Accordion';
import { TERMS_TYPES, type TermsType } from '@/router/constants';

import { privacyPolicyItems, serviceTermsItems } from '../constant/TermList';

// 타입 가드: string이 TermsType인지 확인
const isValidTermsType = (value: string | null): value is TermsType => {
  return value === TERMS_TYPES.SERVICE || value === TERMS_TYPES.PRIVACY;
};

const TermsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get('type');

  useEffect(() => {
    if (!isValidTermsType(type)) {
      navigate('*', { replace: true });
    }
  }, [type, navigate]);

  if (!isValidTermsType(type)) {
    return null;
  }

  const showServiceTerms = type === TERMS_TYPES.SERVICE;
  const showPrivacyPolicy = type === TERMS_TYPES.PRIVACY;

  return (
    <div className="min-h-screen bg-bg p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* 서비스 이용약관 */}
        {showServiceTerms && (
          <section>
            <Title as="h1" className="mb-6 text-2xl">
              서비스 이용약관
            </Title>
            <p className="mb-6 text-base text-muted">
              본 약관은 마인드풀랩스 주식회사(이하 "회사"라 합니다)의 회원으로서
              회사의 상담 관리 및 지원 서비스인 마음토스(이하 "서비스"라고
              합니다)를 이용하는 자(이하 "이용자"라 합니다)와 서비스 제공자인
              회사 사이의 권리, 의무, 책임, 절차 및 기타 필요한 사항을 규정함을
              목적으로 합니다.
            </p>
            <Accordion
              type="single"
              items={serviceTermsItems}
              defaultValue="1"
            />
          </section>
        )}

        {/* 개인정보 처리방침 */}
        {showPrivacyPolicy && (
          <section>
            <Title as="h1" className="mb-6 text-2xl">
              개인정보 처리방침
            </Title>
            <p className="mb-6 text-base text-muted">
              마인드풀랩스 주식회사(이하 "회사")는 고객의 개인정보를 중요하게
              여기며, 관련 법령을 준수하여 안전하게 보호하기 위해 최선을 다하고
              있습니다. 본 개인정보 처리방침은 회사가 수집하는 개인정보의 항목,
              이용 목적, 보관 기간, 보호 조치 등에 대한 내용을 포함합니다.
            </p>
            <Accordion
              type="single"
              items={privacyPolicyItems}
              defaultValue="1"
            />
          </section>
        )}
      </div>
    </div>
  );
};

export default TermsPage;
