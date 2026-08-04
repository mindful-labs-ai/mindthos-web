import React from 'react';

import { useQuery } from '@tanstack/react-query';
import { Gift } from 'lucide-react';

import {
  getCohortFromTutorialStep,
  getTutorialStage,
} from '@/features/onboarding/constants/tutorialStep';
import { cn } from '@/lib/cn';
import { getCohortSurveyStatus } from '@/shared/api/server/acquisitionServerApi';
import { tutorialQueryKeys } from '@/shared/api/services/tutorial/constants';
import { tutorialService } from '@/shared/api/services/tutorial/tutorialService';
import { useAuthStore } from '@/stores/authStore';
import { useQuestStore } from '@/stores/questStore';

const ENTRY_QUERY_KEY = [...tutorialQueryKeys.all, 'entry'] as const;

/** 새 Tutorial 상태를 기준으로 진행 중인 튜토리얼을 다시 여는 전역 진입점. */
export const TutorialFloatingButton: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [now, setNow] = React.useState(() => Date.now());
  const panelRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const autoOpened = React.useRef(false);
  const userId = useAuthStore((state) => state.userId);
  const setTutorialGuideLevel = useQuestStore(
    (state) => state.setTutorialGuideLevel
  );
  const setTutorialRewardOpen = useQuestStore(
    (state) => state.setTutorialRewardOpen
  );

  const tutorialQuery = useQuery({
    queryKey: ENTRY_QUERY_KEY,
    queryFn: tutorialService.current,
    enabled: Boolean(userId),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    retry: false,
  });
  const surveyQuery = useQuery({
    queryKey: [...ENTRY_QUERY_KEY, 'survey'],
    queryFn: getCohortSurveyStatus,
    enabled: Boolean(userId),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    retry: false,
  });

  const state = tutorialQuery.data;
  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const expiresAt = state?.expires_at
    ? new Date(state.expires_at).getTime()
    : null;
  const isExpiredByTime = expiresAt !== null && now >= expiresAt;
  const stateCohort = state?.tutorial_step
    ? getCohortFromTutorialStep(state.tutorial_step)
    : null;
  const cohort = stateCohort ?? surveyQuery.data?.cohort ?? null;
  const stage =
    cohort && state?.tutorial_step
      ? (getTutorialStage(cohort, state.tutorial_step) ?? 1)
      : 1;
  const isRewardAvailable =
    state?.status === 'COMPLETED' && !state.reward_claimed_at;
  const isAvailable =
    Boolean(cohort) &&
    state?.status !== 'EXPIRED' &&
    !isExpiredByTime &&
    (state?.status !== 'COMPLETED' || isRewardAvailable) &&
    !tutorialQuery.isError &&
    (!surveyQuery.isError || Boolean(stateCohort));

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  React.useEffect(() => {
    if (!isAvailable || state?.status !== 'NOT_STARTED' || autoOpened.current) {
      return;
    }
    autoOpened.current = true;
    setTutorialGuideLevel(1);
  }, [isAvailable, setTutorialGuideLevel, state?.status]);

  if (!isAvailable) return null;

  const openTutorial = () => {
    setIsOpen(false);
    if (isRewardAvailable) {
      setTutorialRewardOpen(true);
      return;
    }
    setTutorialGuideLevel(stage);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={
          isRewardAvailable ? '튜토리얼 보상 받기' : '튜토리얼 다시 열기'
        }
        onClick={() =>
          isRewardAvailable
            ? setTutorialRewardOpen(true)
            : setIsOpen((open) => !open)
        }
        className={cn(
          'fixed bottom-6 right-6 z-sticky',
          'flex h-20 w-20 flex-col items-center justify-center rounded-full',
          'border-2 border-primary bg-surface shadow-elevated transition-all',
          'active:scale-95 lg:hover:scale-105 lg:hover:shadow-prominent'
        )}
      >
        <Gift className="h-6 w-6 text-primary" />
        <span className="typo-xs mt-1 font-headline text-primary">
          {isRewardAvailable ? '보상 받기' : '튜토리얼'}
        </span>
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          className={cn(
            'fixed bottom-28 right-6 z-overlay w-[320px] rounded-2xl',
            'border border-border bg-surface p-6 shadow-prominent'
          )}
        >
          <h3 className="typo-xl font-headline text-fg">
            {isRewardAvailable ? '튜토리얼 완료' : '튜토리얼 진행 중'}
          </h3>
          {isRewardAvailable ? (
            <p className="typo-sm mt-4 text-fg-muted">
              4단계를 모두 완료했어요. 보상을 받아보세요.
            </p>
          ) : (
            <div className="mt-5 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-strong">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${((stage - 1) / 4) * 100}%` }}
                />
              </div>
              <span className="typo-sm text-fg-muted">{stage}/4 단계</span>
            </div>
          )}
          <button
            type="button"
            onClick={openTutorial}
            className="typo-sm mt-6 w-full rounded-xl bg-primary px-4 py-3 font-headline text-primary-fg"
          >
            {isRewardAvailable
              ? '튜토리얼 보상 받기'
              : state?.status === 'NOT_STARTED'
                ? '튜토리얼 시작하기'
                : '튜토리얼 다시 시작하기'}
          </button>
        </div>
      )}
    </>
  );
};
