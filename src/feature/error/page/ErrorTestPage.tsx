//TODO : 개발 완료 이후 삭제

import { useState } from 'react';

import { Button, Title } from '@/components/ui';

const ErrorTestPage = () => {
  const [throwError, setThrowError] = useState(false);

  // ErrorBoundary 테스트: 컴포넌트 렌더링 중 에러
  if (throwError) {
    throw new Error('테스트 에러: ErrorBoundary가 이 에러를 잡아야 합니다.');
  }

  const handleRuntimeError = () => {
    setThrowError(true);
  };

  const handlePromiseError = () => {
    // Promise rejection 에러
    Promise.reject(new Error('테스트 Promise 에러'));
  };

  const handleAsyncError = async () => {
    // Async 함수 에러
    throw new Error('테스트 Async 에러');
  };

  const handleTypeError = () => {
    // TypeScript 타입 에러 (런타임)
    const obj: any = null;
    console.log(obj.property.nested); // TypeError 발생
  };

  return (
    <div className="min-h-screen bg-bg p-8">
      <div className="mx-auto max-w-4xl">
        <Title as="h1" className="mb-8 text-3xl">
          에러 테스트 페이지
        </Title>
        <p className="mb-8 text-base text-muted">
          개발 환경에서 에러 처리를 테스트하기 위한 페이지입니다.
        </p>

        <div className="space-y-4">
          <div className="rounded-lg border-2 border-border bg-surface p-6">
            <h2 className="mb-4 text-xl font-semibold">ErrorBoundary 테스트</h2>
            <p className="mb-4 text-sm text-muted">
              컴포넌트 렌더링 중 발생하는 에러를 ErrorBoundary가 잡습니다.
            </p>
            <Button onClick={handleRuntimeError} tone="primary">
              렌더링 에러 발생시키기
            </Button>
          </div>

          <div className="rounded-lg border-2 border-border bg-surface p-6">
            <h2 className="mb-4 text-xl font-semibold">404 에러 테스트</h2>
            <p className="mb-4 text-sm text-muted">
              존재하지 않는 페이지로 이동하여 NotFoundPage를 확인합니다.
            </p>
            <a
              href="/invalid-page-url"
              className="inline-block rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
            >
              404 페이지로 이동
            </a>
          </div>

          <div className="rounded-lg border-2 border-border bg-surface p-6">
            <h2 className="mb-4 text-xl font-semibold">
              약관 페이지 에러 테스트
            </h2>
            <p className="mb-4 text-sm text-muted">
              잘못된 쿼리스트링으로 404 리다이렉팅을 테스트합니다.
            </p>
            <div className="flex gap-2">
              <a
                href="/terms"
                className="inline-block rounded-lg bg-secondary-500 px-4 py-2 text-sm font-medium text-white hover:bg-secondary-600"
              >
                /terms (404로 리다이렉팅)
              </a>
              <a
                href="/terms?type=invalid"
                className="inline-block rounded-lg bg-secondary-500 px-4 py-2 text-sm font-medium text-white hover:bg-secondary-600"
              >
                /terms?type=invalid (404로 리다이렉팅)
              </a>
            </div>
          </div>

          <div className="rounded-lg border-2 border-border bg-surface p-6">
            <h2 className="mb-4 text-xl font-semibold">기타 에러 테스트</h2>
            <p className="mb-4 text-sm text-muted">
              다양한 타입의 에러를 테스트합니다. (콘솔 확인 필요)
            </p>
            <div className="flex gap-2">
              <Button onClick={handlePromiseError} tone="secondary" size="sm">
                Promise 에러
              </Button>
              <Button onClick={handleAsyncError} tone="secondary" size="sm">
                Async 에러
              </Button>
              <Button onClick={handleTypeError} tone="secondary" size="sm">
                TypeError 발생
              </Button>
            </div>
          </div>

          <div className="mt-8">
            <a
              href="/auth"
              className="text-sm text-primary-500 hover:text-primary-600"
            >
              ← 인증 페이지로 돌아가기
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorTestPage;
