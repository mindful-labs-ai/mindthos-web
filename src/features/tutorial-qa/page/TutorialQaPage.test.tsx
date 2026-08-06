import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import TutorialQaPage from './TutorialQaPage';

vi.mock('@/shared/api/supabase/templateQueries', () => ({
  templateService: {
    getTemplates: vi.fn().mockResolvedValue({ templates: [] }),
  },
}));

describe('TutorialQaPage', () => {
  it('시작 안내 모달을 열고 첫 번째 미션 미리보기로 이동한다', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TutorialQaPage />
      </QueryClientProvider>
    );

    await user.click(screen.getByRole('button', { name: '시작 안내 모달' }));
    expect(
      screen.getByRole('heading', { name: '반가워요, 상담사님!' })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: '첫 번째 미션 시작하기' })
    );
    expect(
      screen.getByRole('heading', { name: '튜토리얼 1단계. 가이드' })
    ).toBeInTheDocument();
  });
});
