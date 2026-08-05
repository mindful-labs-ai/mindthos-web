import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TutorialStep } from '@/features/onboarding/constants/tutorialStep';

import { TutorialFloatingButton } from './TutorialFloatingButton';

const {
  currentMock,
  surveyStatusMock,
  setTutorialGuideLevelMock,
  setTutorialRewardOpenMock,
} = vi.hoisted(() => ({
  currentMock: vi.fn(),
  surveyStatusMock: vi.fn(),
  setTutorialGuideLevelMock: vi.fn(),
  setTutorialRewardOpenMock: vi.fn(),
}));

vi.mock('@/shared/api/services/tutorial/tutorialService', () => ({
  tutorialService: { current: currentMock },
}));

vi.mock('@/shared/api/server/acquisitionServerApi', () => ({
  getCohortSurveyStatus: surveyStatusMock,
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: { userId: string }) => unknown) =>
    selector({ userId: '81' }),
}));

vi.mock('@/stores/questStore', () => ({
  useQuestStore: (
    selector: (state: {
      setTutorialGuideLevel: typeof setTutorialGuideLevelMock;
      setTutorialRewardOpen: typeof setTutorialRewardOpenMock;
    }) => unknown
  ) =>
    selector({
      setTutorialGuideLevel: setTutorialGuideLevelMock,
      setTutorialRewardOpen: setTutorialRewardOpenMock,
    }),
}));

function renderFloatingButton() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TutorialFloatingButton />
    </QueryClientProvider>
  );
}

describe('TutorialFloatingButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentMock.mockResolvedValue({
      tutorial_step: TutorialStep.CBT_STAGE_2,
      status: 'IN_PROGRESS',
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: null,
      reward_claimed_at: null,
    });
    surveyStatusMock.mockResolvedValue({
      completed: true,
      cohort: 'CBT',
      default_template_id: null,
      has_record: 'FALSE',
    });
  });

  it('레거시와 동일한 우측 하단 버튼과 352px 미션 패널을 표시한다', async () => {
    const user = userEvent.setup();
    renderFloatingButton();

    const floatingButton = await screen.findByRole('button', {
      name: '튜토리얼 다시 열기',
    });
    expect(floatingButton).toHaveClass(
      'fixed',
      'bottom-6',
      'right-6',
      'h-20',
      'w-20',
      'rounded-full'
    );

    await user.click(floatingButton);

    const panel = screen.getByRole('heading', {
      name: '신규 가입자 튜토리얼',
    }).parentElement?.parentElement;
    expect(panel).toHaveClass('bottom-28', 'right-6', 'w-[352px]');
    expect(screen.getByText('1/4 완료')).toBeInTheDocument();
    expect(screen.getByText('AI 슈퍼비전 예시 보기')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '진행하기' }));
    expect(setTutorialGuideLevelMock).toHaveBeenCalledWith(2);
  });

  it('미시작 상태를 조회해도 실제 미션 모달을 바로 열지 않는다', async () => {
    currentMock.mockResolvedValue({
      tutorial_step: TutorialStep.CBT_STAGE_1,
      status: 'NOT_STARTED',
      started_at: null,
      expires_at: null,
      completed_at: null,
      reward_claimed_at: null,
    });

    renderFloatingButton();

    await screen.findByRole('button', { name: '튜토리얼 다시 열기' });
    expect(setTutorialGuideLevelMock).not.toHaveBeenCalled();
  });
});
