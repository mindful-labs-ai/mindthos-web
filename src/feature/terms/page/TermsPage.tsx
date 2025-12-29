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
              마인드풀랩스 주식회사(이하 "회사")는 이용자의 개인정보를 소중히
              여기며, 「개인정보 보호법」 등 관련 법령을 준수하기 위해 본
              개인정보 처리방침을 수립·공개합니다. 본 방침은 이용자가 언제든지
              쉽게 열람할 수 있도록 서비스 초기 화면 또는 설정 메뉴에
              공개합니다.
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
