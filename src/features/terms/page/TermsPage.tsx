import { useEffect } from 'react';

import { useSearchParams } from 'react-router-dom';

import { TERMS_TYPES, type TermsType } from '@/app/router/constants';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { Spinner, Title } from '@/shared/ui';
import { Accordion } from '@/shared/ui/composites/Accordion';
import { TermsContentRenderer } from '@/widgets/terms/TermsContentRenderer';

import { useTermsContent } from '../hooks/useTermsContent';

const isValidTermsType = (value: string | null): value is TermsType => {
  return (
    value === TERMS_TYPES.SERVICE ||
    value === TERMS_TYPES.PRIVACY ||
    value === TERMS_TYPES.MARKETING
  );
};

const TermsPage = () => {
  const [searchParams] = useSearchParams();
  const { navigateWithUtm } = useNavigateWithUtm();
  const type = searchParams.get('type');

  useEffect(() => {
    if (!isValidTermsType(type)) {
      navigateWithUtm('*', { replace: true });
    }
  }, [type, navigateWithUtm]);

  if (!isValidTermsType(type)) {
    return null;
  }

  return <TermsPageContent type={type} />;
};

const TermsPageContent = ({ type }: { type: TermsType }) => {
  const { content, isLoading, isError } = useTermsContent(type);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !content) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-m font-emphasize text-grey-100">
            약관 내용을 불러오는 중 오류가 생겼어요.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 text-m text-green-80 lg:hover:opacity-80"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const accordionItems = content.sections.map((section) => ({
    value: section.value,
    header: section.header,
    content: <TermsContentRenderer blocks={section.content} />,
  }));

  return (
    <div className="min-h-screen bg-white px-3 py-8 md:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <section>
          <Title as="h1" className="mb-6 text-2xl font-headline">
            {content.title}
          </Title>
          {content.description && (
            <p className="mb-6 text-m font-medium text-grey-100">
              {content.description}
            </p>
          )}
          <Accordion
            type="single"
            items={accordionItems}
            defaultValue={accordionItems[0]?.value}
          />
        </section>
      </div>
    </div>
  );
};

export default TermsPage;
