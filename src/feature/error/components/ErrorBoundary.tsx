import React, { Component, ErrorInfo, ReactNode } from 'react';

import { HyperLink, Title } from '@/components/ui';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-8">
          <div className="text-center">
            <h1 className="mb-4 text-6xl font-bold text-fg">500</h1>
            <Title as="h2" className="mb-4 text-2xl">
              예상치 못한 오류가 발생했습니다
            </Title>
            <p className="mb-8 text-base text-muted">
              일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
            </p>
            {this.state.error && (
              <details className="mb-8 text-left">
                <summary className="cursor-pointer text-sm text-muted hover:text-fg">
                  오류 상세 정보
                </summary>
                <pre className="mt-2 overflow-auto rounded-lg bg-surface-contrast p-4 text-left text-xs text-fg">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex justify-center gap-4">
              <HyperLink
                underline="hover"
                href="/"
                className="inline-block rounded-lg bg-primary-500 px-6 py-3 text-center text-base font-medium text-white hover:bg-primary-600 hover:text-white"
              >
                홈으로 돌아가기
              </HyperLink>
              <button
                onClick={() => window.location.reload()}
                className="inline-block rounded-lg border-2 border-border bg-surface px-6 py-3 text-base font-medium text-fg hover:bg-surface-contrast"
              >
                새로고침
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
