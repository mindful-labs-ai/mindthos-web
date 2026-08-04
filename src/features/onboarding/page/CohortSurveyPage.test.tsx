import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import CohortSurveyPage from './CohortSurveyPage';

vi.mock('@/features/auth/hooks/useSignupCheck', () => ({
  useSignupCheck: () => ({
    required: false,
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('@/features/onboarding/hooks/useCohortSurveyCheck', () => ({
  cohortSurveyQueryKeys: {
    status: () => ['cohort-survey', 'status'],
  },
  useCohortSurveyCheck: () => ({
    completed: false,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/shared/api/server/acquisitionServerApi', () => ({
  captureCohortSurvey: vi.fn(),
}));

vi.mock('@/shared/hooks/useNavigateWithUtm', () => ({
  useNavigateWithUtm: () => ({ navigateWithUtm: vi.fn() }),
}));

vi.mock('@/shared/ui/composites/Toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <CohortSurveyPage />
    </QueryClientProvider>
  );
}

describe('CohortSurveyPage', () => {
  it('viewport는 고정하고 질문 선택 영역만 스크롤한다', () => {
    const { container } = renderPage();

    expect(container.querySelector('main')).toHaveClass(
      'h-dvh',
      'overflow-hidden'
    );
    expect(
      screen.getByRole('heading', { name: '마음토스 시작하기' })
    ).toHaveClass('text-[20px]', 'font-semibold', 'text-green-80');
    expect(
      screen.getByRole('heading', {
        name: '주로 어떤 내담자를 상담하시나요?',
      })
    ).toHaveClass('text-[24px]', 'font-semibold', 'text-green-100');
    expect(screen.getByText('일반 성인')).toHaveClass('text-[20px]');

    const optionList = screen.getByRole('button', {
      name: '일반 성인',
    }).parentElement;
    expect(optionList?.parentElement).toHaveClass(
      'min-h-0',
      'flex-1',
      'overflow-y-auto'
    );
  });

  it('Q2와 Q3에서 180px 이전 버튼으로 직전 질문에 돌아간다', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(
      screen.queryByRole('button', { name: '이전' })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '일반 성인' }));
    await user.click(screen.getByRole('button', { name: '다음' }));

    const previousButton = screen.getByRole('button', { name: '이전' });
    expect(previousButton).toHaveClass(
      'w-[180px]',
      'shrink-0',
      'border-grey-40'
    );

    await user.click(screen.getByRole('button', { name: '정신역동·대상관계' }));
    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(
      screen.getByRole('heading', { name: /현재 업로드할 수 있는/ })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '이전' }));
    expect(
      screen.getByRole('heading', {
        name: '주로 사용하는 상담 이론은 무엇인가요?',
      })
    ).toBeInTheDocument();
  });
});
