import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TutorialStep } from '@/features/onboarding/constants/tutorialStep';

import { TutorialMissionArea } from './TutorialMissionArea';

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
      tutorialGuideLevel: number | null;
      tutorialRewardOpen: boolean;
      setTutorialGuideLevel: typeof setTutorialGuideLevelMock;
      setTutorialRewardOpen: typeof setTutorialRewardOpenMock;
    }) => unknown
  ) =>
    selector({
      tutorialGuideLevel: null,
      tutorialRewardOpen: false,
      setTutorialGuideLevel: setTutorialGuideLevelMock,
      setTutorialRewardOpen: setTutorialRewardOpenMock,
    }),
}));

function renderMissionArea() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TutorialMissionArea />
    </QueryClientProvider>
  );
}

describe('TutorialMissionArea 시작 안내', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    currentMock.mockResolvedValue({
      tutorial_step: TutorialStep.CBT_STAGE_1,
      status: 'IN_PROGRESS',
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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

  it('첫 미션을 완료하지 않은 사용자를 신규 보상 안내 후 1단계로 연결한다', async () => {
    const user = userEvent.setup();
    renderMissionArea();

    expect(
      await screen.findByRole('heading', { name: '반가워요, 상담사님!' })
    ).toBeInTheDocument();
    expect(screen.getByText(/4가지 미션/)).toBeInTheDocument();
    expect(screen.getByText('7일 무료 이용권')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: '첫 번째 미션 시작하기' })
    );

    expect(setTutorialGuideLevelMock).toHaveBeenCalledWith(1);
  });

  it('안내를 닫으면 같은 브라우저 세션에서는 다시 표시하지 않는다', async () => {
    const user = userEvent.setup();
    const firstRender = renderMissionArea();

    await screen.findByRole('heading', { name: '반가워요, 상담사님!' });
    await user.click(screen.getByRole('button', { name: '다음에 할게요' }));
    expect(
      screen.queryByRole('heading', { name: '반가워요, 상담사님!' })
    ).not.toBeInTheDocument();

    firstRender.unmount();
    renderMissionArea();

    await screen.findByRole('heading', { name: '신규 가입자 튜토리얼' });
    expect(
      screen.queryByRole('heading', { name: '반가워요, 상담사님!' })
    ).not.toBeInTheDocument();
  });

  it('첫 미션을 완료한 사용자는 시작 안내를 표시하지 않는다', async () => {
    currentMock.mockResolvedValue({
      tutorial_step: TutorialStep.CBT_STAGE_2,
      status: 'IN_PROGRESS',
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: null,
      reward_claimed_at: null,
    });

    renderMissionArea();

    await screen.findByText('1/4 완료');
    expect(
      screen.queryByRole('heading', { name: '반가워요, 상담사님!' })
    ).not.toBeInTheDocument();
  });
});
