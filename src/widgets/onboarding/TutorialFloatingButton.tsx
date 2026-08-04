import React from 'react';

import { useQuery } from '@tanstack/react-query';
import { Check, Gift } from 'lucide-react';

import { getCohortFromTutorialStep } from '@/features/onboarding/constants/tutorialStep';
import { formatTutorialRemainingTime } from '@/features/onboarding/constants/tutorialUi';
import { cn } from '@/lib/cn';
import { getCohortSurveyStatus } from '@/shared/api/server/acquisitionServerApi';
import { tutorialQueryKeys } from '@/shared/api/services/tutorial/constants';
import { tutorialService } from '@/shared/api/services/tutorial/tutorialService';
import { Button } from '@/shared/ui/atoms/Button';
import { useAuthStore } from '@/stores/authStore';
import { useQuestStore } from '@/stores/questStore';

import {
  getTutorialMissionProgress,
  TUTORIAL_MISSION_LABELS,
} from './TutorialMissionArea';

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
  const progress =
    state && cohort ? getTutorialMissionProgress(state, cohort) : null;
  const stage = progress?.activeStage ?? 1;
  const completedCount = progress?.completedCount ?? 0;
  const missionLabels = cohort ? TUTORIAL_MISSION_LABELS[cohort] : [];
  const remainingTime = expiresAt
    ? formatTutorialRemainingTime(expiresAt - now)
    : '7일';
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

  const openTutorial = (targetStage: number) => {
    setIsOpen(false);
    setTutorialGuideLevel(targetStage);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={
          isRewardAvailable ? '튜토리얼 보상 받기' : '튜토리얼 다시 열기'
        }
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          'fixed bottom-6 right-6 z-sticky',
          'flex h-20 w-20 flex-col items-center justify-center',
          'rounded-full border-2 border-primary bg-surface',
          'shadow-elevated transition-all duration-normal',
          'active:scale-95 lg:hover:scale-105 lg:hover:shadow-prominent'
        )}
      >
        <Gift className="h-6 w-6 text-primary" />
        <span className="typo-xs mt-1 font-headline text-primary">
          {isRewardAvailable ? '보상 받기' : '가이드 진행 중'}
        </span>
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          className={cn(
            'fixed bottom-28 right-6 z-overlay',
            'w-[352px] rounded-2xl border border-border bg-surface',
            'animate-in select-none shadow-prominent duration-normal',
            'fade-in slide-in-from-bottom-4'
          )}
        >
          <div className="p-6">
            <h3 className="typo-xl font-headline text-fg">
              신규 가입자 튜토리얼
            </h3>

            <div className="mt-4 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-strong">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${(completedCount / 4) * 100}%` }}
                />
              </div>
              <span className="typo-sm font-medium text-fg-muted">
                {completedCount}/4 완료
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {missionLabels.map((label, index) => {
                const missionStage = index + 1;
                const isCompleted = missionStage <= completedCount;
                const isInProgress =
                  !isCompleted && missionStage === stage && !isRewardAvailable;

                return (
                  <div
                    key={label}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors duration-slow',
                          isCompleted
                            ? 'border-primary bg-primary text-primary-fg'
                            : isInProgress
                              ? 'border-primary bg-surface text-primary'
                              : 'border-fg-muted bg-surface text-fg-muted'
                        )}
                      >
                        <Check size={14} strokeWidth={3} />
                      </div>
                      <span
                        className={cn(
                          'typo-sm font-medium',
                          isCompleted
                            ? 'text-fg'
                            : isInProgress
                              ? 'font-headline text-fg'
                              : 'text-fg-muted'
                        )}
                      >
                        {label}
                      </span>
                    </div>
                    {isCompleted ? (
                      <span className="typo-sm font-medium text-fg-muted">
                        완료
                      </span>
                    ) : isInProgress ? (
                      <button
                        type="button"
                        onClick={() => openTutorial(missionStage)}
                        className="typo-sm font-headline text-primary lg:hover:text-primary-hover lg:hover:underline"
                      >
                        진행하기
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {!isRewardAvailable && (
              <p className="typo-sm mt-6 text-center font-headline text-danger">
                남은 기간 {remainingTime}
              </p>
            )}

            <Button
              tone="primary"
              variant={isRewardAvailable ? 'solid' : 'ghost'}
              size="lg"
              className="mt-4 w-full font-headline"
              disabled={!isRewardAvailable}
              onClick={() => {
                setIsOpen(false);
                setTutorialRewardOpen(true);
              }}
            >
              이벤트 보상 받기
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
