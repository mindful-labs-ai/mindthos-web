import { useRouteError } from 'react-router-dom';

import { ROUTES } from '@/app/router/constants';
import { HyperLink, Title } from '@/shared/ui';

const ErrorPage = () => {
  const error = useRouteError() as Error;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-8">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-headline text-fg">500</h1>
        <Title as="h2" className="mb-4 typo-2xl">
          예상치 못한 오류가 발생했습니다
        </Title>
        <p className="mb-8 typo-m text-muted">
          일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
        </p>
        {error && (
          <details className="mb-8 text-left">
            <summary className="cursor-pointer typo-sm text-muted hover:text-fg">
              오류 상세 정보
            </summary>
            <pre className="mt-2 overflow-auto rounded-lg bg-surface-contrast p-4 text-left typo-xs text-fg">
              {error.message || String(error)}
            </pre>
          </details>
        )}
        <div className="flex justify-center gap-4">
          <HyperLink
            underline="hover"
            href={ROUTES.ROOT}
            className="inline-block rounded-lg bg-primary-500 px-6 py-3 typo-m font-medium text-primary-fg hover:bg-primary-600 hover:text-primary-fg"
          >
            홈으로 돌아가기
          </HyperLink>
          <button
            onClick={() => window.location.reload()}
            className="inline-block rounded-lg border-default bg-surface px-6 py-3 typo-m font-medium text-fg hover:bg-surface-contrast"
          >
            새로고침
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
