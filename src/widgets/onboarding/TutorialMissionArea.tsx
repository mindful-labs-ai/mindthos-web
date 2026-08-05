import React from 'react';

import { useQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';

import {
  COHORT_BRANCH,
  type CohortBranch,
} from '@/features/onboarding/constants/cohort';
import {
  getCohortFromTutorialStep,
  getTutorialStage,
  type TutorialStep,
} from '@/features/onboarding/constants/tutorialStep';
import { formatTutorialRemainingTime } from '@/features/onboarding/constants/tutorialUi';
import { cn } from '@/lib/cn';
import { getCohortSurveyStatus } from '@/shared/api/server/acquisitionServerApi';
import { tutorialQueryKeys } from '@/shared/api/services/tutorial/constants';
import { tutorialService } from '@/shared/api/services/tutorial/tutorialService';
import type { TutorialState } from '@/shared/api/services/tutorial/types';
import { Button } from '@/shared/ui/atoms/Button';
import { useAuthStore } from '@/stores/authStore';
import { useQuestStore } from '@/stores/questStore';

import { TutorialStartModal } from './TutorialStartModal';

export const TUTORIAL_MISSION_LABELS: Record<CohortBranch, readonly string[]> =
  {
    [COHORT_BRANCH.GENOGRAM]: [
      '상담 기록 예시 보기',
      '가계도 예시 보기',
      '상담노트 양식 확인하기',
      '직접 상담 기록 만들기',
    ],
    [COHORT_BRANCH.CBT]: [
      '상담 기록 예시 보기',
      'AI 슈퍼비전 예시 보기',
      '상담노트 양식 확인하기',
      '직접 상담 기록 만들기',
    ],
    [COHORT_BRANCH.PSYCHODYNAMIC]: [
      '상담 기록 예시 보기',
      'AI 슈퍼비전 예시 보기',
      '상담노트 양식 확인하기',
      '직접 상담 기록 만들기',
    ],
    [COHORT_BRANCH.HUMANISTIC]: [
      '상담 기록 예시 보기',
      'AI 슈퍼비전 예시 보기',
      '상담노트 양식 확인하기',
      '직접 상담 기록 만들기',
    ],
    [COHORT_BRANCH.GENERIC]: [
      '마음토스 가이드 영상 보기',
      '상담 기록 예시 보기',
      '상담노트 양식 선택하기',
      '직접 상담 기록 만들기',
    ],
  };

export interface TutorialMissionProgress {
  activeStage: 1 | 2 | 3 | 4;
  completedCount: 0 | 1 | 2 | 3 | 4;
}

export function getTutorialMissionProgress(
  state: TutorialState,
  cohort: CohortBranch
): TutorialMissionProgress {
  if (state.status === 'COMPLETED') {
    return { activeStage: 4, completedCount: 4 };
  }

  const stage = state.tutorial_step
    ? getTutorialStage(cohort, state.tutorial_step as TutorialStep)
    : null;
  const activeStage = Math.min(Math.max(stage ?? 1, 1), 4) as 1 | 2 | 3 | 4;

  return {
    activeStage,
    completedCount: (activeStage - 1) as 0 | 1 | 2 | 3,
  };
}

const Stepper = ({ completedCount, activeStage }: TutorialMissionProgress) => (
  <div className="relative mx-auto mt-3 w-full max-w-[302px] px-[18px]">
    <div className="absolute inset-x-[18px] top-[38px] h-1 -translate-y-1/2 overflow-hidden rounded-full bg-surface-strong">
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{
          width: `${(Math.min(completedCount, 3) / 3) * 100}%`,
        }}
      />
    </div>
    <div className="relative flex justify-between">
      {[1, 2, 3, 4].map((step) => {
        const isCompleted = step <= completedCount;
        const isCurrent = step === activeStage && !isCompleted;

        return (
          <div key={step} className="relative z-[1] flex flex-col items-center">
            <span
              className={cn(
                'typo-sm',
                isCompleted || isCurrent ? 'text-fg' : 'text-fg-muted'
              )}
            >
              {step}
            </span>
            <div className="flex h-9 items-center justify-center">
              <div
                className={cn(
                  'flex items-center justify-center rounded-full border-2 bg-surface',
                  isCurrent ? 'size-9' : 'size-6',
                  isCompleted
                    ? 'border-primary bg-primary text-primary-fg'
                    : isCurrent
                      ? 'border-primary text-primary'
                      : 'border-fg-muted text-fg-muted'
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <Check size={isCurrent ? 18 : 12} strokeWidth={4} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const RewardCard = ({
  completed,
  rewardClaimed,
  remainingTime,
  onClaim,
}: {
  completed: boolean;
  rewardClaimed: boolean;
  remainingTime: string;
  onClaim: () => void;
}) => (
  <aside className="flex w-full flex-col justify-between rounded-2xl border border-primary px-5 py-4 md:w-[278px] md:shrink-0">
    <div>
      <div className="flex items-center gap-2 text-fg-muted">
        <span className="text-2xl leading-none" aria-hidden="true">
          🎁
        </span>
        <span className="typo-sm font-headline">5분이면 끝!</span>
      </div>
      <h3 className="typo-l-headline mt-3 leading-tight text-fg">
        모든 미션 달성 시
        <br />
        <span className="whitespace-nowrap">
          <span className="text-primary">스타터 플랜</span> 무료 체험 지급!
        </span>
      </h3>
      <p className="typo-sm-emphasize mt-5 text-center text-danger">
        남은 시간 {remainingTime}
      </p>
    </div>
    <Button
      tone="primary"
      variant={completed && !rewardClaimed ? 'solid' : 'soft'}
      disabled={!completed || rewardClaimed}
      className="mt-4 w-full font-headline"
      onClick={onClaim}
    >
      {rewardClaimed ? '이벤트 보상 받기 완료' : '이벤트 보상 받기'}
    </Button>
  </aside>
);

const getStartPromptStorageKey = (userId: string) =>
  `tutorial-start-prompt-shown:${userId}`;

const TutorialStartPrompt = ({
  userId,
  blocked,
  onStart,
}: {
  userId: string;
  blocked: boolean;
  onStart: () => void;
}) => {
  const storageKey = getStartPromptStorageKey(userId);
  const [isOpen, setIsOpen] = React.useState(() => {
    try {
      return !blocked && window.sessionStorage.getItem(storageKey) !== '1';
    } catch {
      return !blocked;
    }
  });

  React.useEffect(() => {
    if (!isOpen && !blocked) return;

    try {
      window.sessionStorage.setItem(storageKey, '1');
    } catch {
      // 저장소를 사용할 수 없어도 이번 안내는 정상 노출한다.
    }
  }, [blocked, isOpen, storageKey]);

  return (
    <TutorialStartModal
      open={isOpen}
      onDismiss={() => setIsOpen(false)}
      onStart={() => {
        setIsOpen(false);
        onStart();
      }}
    />
  );
};

export const TutorialMissionArea: React.FC = () => {
  const userId = useAuthStore((state) => state.userId);
  const tutorialGuideLevel = useQuestStore((state) => state.tutorialGuideLevel);
  const tutorialRewardOpen = useQuestStore((state) => state.tutorialRewardOpen);
  const setTutorialGuideLevel = useQuestStore(
    (state) => state.setTutorialGuideLevel
  );
  const setTutorialRewardOpen = useQuestStore(
    (state) => state.setTutorialRewardOpen
  );

  const tutorialQuery = useQuery({
    queryKey: [...tutorialQueryKeys.current(), 'home'],
    queryFn: tutorialService.current,
    enabled: Boolean(userId),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    retry: false,
  });
  const surveyQuery = useQuery({
    queryKey: [...tutorialQueryKeys.all, 'home-survey'],
    queryFn: getCohortSurveyStatus,
    enabled: Boolean(userId),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    retry: false,
  });
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const state = tutorialQuery.data;
  const stateCohort = state?.tutorial_step
    ? getCohortFromTutorialStep(state.tutorial_step)
    : null;
  const cohort = stateCohort ?? surveyQuery.data?.cohort ?? null;
  const surveyRequired = !stateCohort;

  if (
    !userId ||
    tutorialQuery.isLoading ||
    tutorialQuery.isError ||
    (surveyRequired && (surveyQuery.isLoading || surveyQuery.isError)) ||
    !state ||
    !cohort ||
    state.status === 'EXPIRED'
  ) {
    return null;
  }

  const expiresAt = state.expires_at
    ? new Date(state.expires_at).getTime()
    : null;
  if (expiresAt !== null && now >= expiresAt) return null;

  // 보상까지 수령한 뒤에만 홈 Tutorial 영역을 숨긴다.
  // 완료했지만 보상을 받지 않은 상태에서는 보상 안내·수령 UI를 유지한다.
  if (state.status === 'COMPLETED' && state.reward_claimed_at) return null;

  const progress = getTutorialMissionProgress(state, cohort);
  const missionLabels = TUTORIAL_MISSION_LABELS[cohort];
  const remainingTime = expiresAt
    ? formatTutorialRemainingTime(expiresAt - now)
    : '7일';
  const isCompleted = progress.completedCount === 4;
  const shouldShowStartPrompt =
    progress.completedCount === 0 &&
    (state.status === 'NOT_STARTED' || state.status === 'IN_PROGRESS');

  return (
    <section
      aria-label="신규 가입자 튜토리얼"
      className="flex w-full flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5 md:flex-row md:gap-5"
    >
      {shouldShowStartPrompt && (
        <TutorialStartPrompt
          key={String(userId)}
          userId={String(userId)}
          blocked={tutorialGuideLevel !== null || tutorialRewardOpen}
          onStart={() => setTutorialGuideLevel(1)}
        />
      )}

      <div className="min-w-0 flex-1 px-1 py-1 sm:px-2">
        <header className="flex items-center gap-4">
          <h2 className="typo-l-headline text-fg">신규 가입자 튜토리얼</h2>
          <span className="typo-sm-sub text-fg-muted">
            {progress.completedCount}/4 완료
          </span>
        </header>

        <Stepper {...progress} />

        <div className="mt-7 flex flex-col items-center gap-3">
          {isCompleted ? (
            <p className="typo-m text-center text-fg-muted">
              모든 미션을 완료했어요!
              <br />
              우측에서 이벤트 보상을 받아주세요
            </p>
          ) : (
            <>
              <p className="typo-m text-center text-fg">
                {missionLabels[progress.activeStage - 1]}
              </p>
              <Button
                tone="primary"
                size="md"
                className="min-w-[148px] font-headline"
                onClick={() => setTutorialGuideLevel(progress.activeStage)}
              >
                미션 진행하기
              </Button>
            </>
          )}
        </div>
      </div>

      <RewardCard
        completed={isCompleted}
        rewardClaimed={Boolean(state.reward_claimed_at)}
        remainingTime={remainingTime}
        onClaim={() => setTutorialRewardOpen(true)}
      />
    </section>
  );
};
