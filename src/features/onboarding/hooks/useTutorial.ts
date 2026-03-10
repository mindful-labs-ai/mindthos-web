import { useCallback } from 'react';

import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { useQuestStore } from '@/stores/questStore';

interface UseTutorialOptions {
  currentLevel: number;
}

export function useTutorial({ currentLevel }: UseTutorialOptions) {
  const { navigateWithUtm } = useNavigateWithUtm();

  const isTutorialActive = useQuestStore((state) => state.isTutorialActive);
  const tutorialStep = useQuestStore((state) => state.tutorialStep);
  const nextTutorialStep = useQuestStore((state) => state.nextTutorialStep);
  const setTutorialActive = useQuestStore((state) => state.setTutorialActive);
  const resetTutorial = useQuestStore((state) => state.resetTutorial);
  const setShowConfetti = useQuestStore((state) => state.setShowConfetti);
  const completeNextStep = useQuestStore((state) => state.completeNextStep);

  /**
   * 해당 단계의 튜토리얼이 활성화되어야 하는지 확인하는 함수
   */
  const checkIsTutorialActive = useCallback(
    (step: number, targetLevel?: number) => {
      const levelToCheck = targetLevel ?? currentLevel;
      // store의 currentLevel을 직접 구독하지 않고 getState로 확인 (불필요한 리렌더링 방지)
      const storeLevel = useQuestStore.getState().currentLevel;

      return (
        isTutorialActive && storeLevel === levelToCheck && tutorialStep === step
      );
    },
    [isTutorialActive, currentLevel, tutorialStep]
  );

  /**
   * 사용자의 액션을 감싸서 튜토리얼 중일 때는 다음 단계로 진행시키고,
   * 아닐 때는 원래 액션만 수행하도록 하는 래퍼 함수
   */
  const handleTutorialAction = useCallback(
    (
      action: () => void,
      step: number,
      options?: {
        nextRoute?: string;
        shouldComplete?: boolean;
        targetLevel?: number;
      }
    ) => {
      action();

      if (checkIsTutorialActive(step, options?.targetLevel)) {
        if (options?.shouldComplete) {
          resetTutorial();
        } else {
          nextTutorialStep();
        }

        if (options?.nextRoute) {
          navigateWithUtm(options.nextRoute);
        }
      }
    },
    [checkIsTutorialActive, nextTutorialStep, resetTutorial, navigateWithUtm]
  );

  const endTutorial = useCallback(() => {
    resetTutorial();
    navigateWithUtm('/');
  }, [resetTutorial, navigateWithUtm]);

  const startTutorial = useCallback(() => {
    setTutorialActive(true);
  }, [setTutorialActive]);

  return {
    isTutorialActive,
    tutorialStep,
    checkIsTutorialActive,
    handleTutorialAction,
    startTutorial,
    endTutorial,
    nextTutorialStep,
    setShowConfetti,
    completeNextStep,
  };
}
