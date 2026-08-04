import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ROUTES } from '@/app/router/constants';

import CohortSurveyPage from './CohortSurveyPage';

const { logoutMock, navigateWithUtmMock } = vi.hoisted(() => ({
  logoutMock: vi.fn(),
  navigateWithUtmMock: vi.fn(),
}));

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
  useNavigateWithUtm: () => ({ navigateWithUtm: navigateWithUtmMock }),
}));

vi.mock('@/lib/mixpanel', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (
    selector: (state: { logout: typeof logoutMock }) => unknown
  ) => selector({ logout: logoutMock }),
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
  it('모바일·태블릿 회원가입 헤더에서 로그아웃할 수 있다', async () => {
    const user = userEvent.setup();
    const { container } = renderPage();

    const pageHeader = container.querySelector('main > header');
    expect(pageHeader).toHaveClass(
      'h-[56px]',
      'px-4',
      'sm:h-[60px]',
      'sm:px-6',
      'lg:hidden'
    );
    expect(screen.getByText('회원가입')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '로그아웃' }));

    expect(logoutMock).toHaveBeenCalledOnce();
    expect(navigateWithUtmMock).toHaveBeenCalledWith(ROUTES.AUTH, {
      replace: true,
    });
  });

  it('viewport는 고정하고 질문 선택 영역만 스크롤한다', () => {
    const { container } = renderPage();

    expect(container.querySelector('main')).toHaveClass(
      'h-dvh',
      'flex-col',
      'overflow-hidden',
      'bg-surface'
    );
    const card = container.querySelector('section');
    expect(card).toHaveClass(
      'h-full',
      'px-5',
      'py-12',
      'sm:rounded-2xl',
      'sm:border',
      'sm:px-10',
      'sm:shadow-subtle'
    );
    expect(card).not.toHaveClass('rounded-2xl', 'border', 'shadow-subtle');
    expect(
      screen.getByRole('heading', { name: '마음토스 시작하기' })
    ).toHaveClass('text-[20px]', 'font-semibold', 'text-green-80');
    expect(
      screen.getByRole('heading', { name: '마음토스 시작하기' }).parentElement
    ).toHaveClass('items-center', 'justify-center');
    expect(
      screen.getByRole('heading', {
        name: '주로 어떤 내담자를 상담하시나요?',
      })
    ).toHaveClass('mt-6', 'text-[24px]', 'font-semibold', 'text-grey-100');
    expect(screen.getByText('일반 성인')).toHaveClass('text-[20px]');

    const optionList = screen.getByRole('button', {
      name: '일반 성인',
    }).parentElement;
    expect(optionList?.parentElement).toHaveClass('min-h-0', 'overflow-y-auto');
    expect(optionList).toHaveClass('min-h-full', 'justify-center');

    const nextButtonArea = screen.getByRole('button', {
      name: '다음',
    }).parentElement;
    expect(nextButtonArea).toHaveClass('mt-auto', 'shrink-0', 'pt-6');
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
      'border-[1px]',
      'border-solid',
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
