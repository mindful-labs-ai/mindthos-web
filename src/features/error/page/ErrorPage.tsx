import { useRouteError } from 'react-router-dom';

import { ROUTES } from '@/app/router/constants';
import { HyperLink, Title } from '@/shared/ui';

const ErrorPage = () => {
  const error = useRouteError() as Error;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-8">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-headline text-fg">500</h1>
        <Title as="h2" className="typo-2xl mb-4">
          예상치 못한 오류가 발생했습니다
        </Title>
        <p className="typo-m text-muted mb-8">
          일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
        </p>
        {error && (
          <details className="mb-8 text-left">
            <summary className="typo-sm text-muted cursor-pointer lg:hover:text-fg">
              오류 상세 정보
            </summary>
            <pre className="typo-xs mt-2 overflow-auto rounded-lg bg-surface-contrast p-4 text-left text-fg">
              {error.message || String(error)}
            </pre>
          </details>
        )}
        <div className="flex justify-center gap-4">
          <HyperLink
            underline="hover"
            href={ROUTES.ROOT}
            className="bg-primary-500 typo-m lg:hover:bg-primary-600 inline-block rounded-lg px-6 py-3 font-medium text-primary-fg lg:hover:text-primary-fg"
          >
            홈으로 돌아가기
          </HyperLink>
          <button
            onClick={() => window.location.reload()}
            className="border-default typo-m inline-block rounded-lg bg-surface px-6 py-3 font-medium text-fg lg:hover:bg-surface-contrast"
          >
            새로고침
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
