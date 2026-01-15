import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';

import { onboardingService } from '@/services/onboarding/onboardingService';
import {
  OnboardingState,
  type OnboardingStateType,
} from '@/services/onboarding/types';

/**
 * 서버의 [state, step] 조합을 프론트엔드 퀘스트 레벨(0~7)로 매핑하는 함수
 * [ ['pending', 0], // 0: 미시작
 *   ['in_progress', 0], // 1: 시작 직후
 *   ['in_progress', 1], // 2: 상담기록 미션 클리어
 *   ['in_progress', 2], // 3: 다회기 분석 미션 클리어
 *   ['in_progress', 3], // 4: 새 상담기록 만들기 진행 중
 *   ['in_progress', 4], // 5: 새 상담기록 만들기 클리어
 *   ['completed', 5], // 6: 내 정보 입력 클리어
 *   ['completed', 6], // 7: 선물까지 완료 ]
 */
const getQuestLevel = (state: OnboardingStateType, step: number): number => {
  if (state === OnboardingState.PENDING) return 0;

  if (state === OnboardingState.IN_PROGRESS) {
    if (step === 0) return 1;
    if (step === 1) return 2;
    if (step === 2) return 3;
    if (step === 3) return 4;
    if (step === 4) return 5;
  }

  if (state === OnboardingState.COMPLETED) {
    if (step === 5) return 6;
    if (step >= 6) return 7;
  }

  // 레거시 온보딩 데이터 (['completed', 3])
  if (state === OnboardingState.COMPLETED && step === 3) return 8;

  return 0;
};

interface QuestStoreState {
  currentLevel: number;
  startedAt: string | null;
  isLoading: boolean;
  isChecked: boolean;
  isTutorialActive: boolean;
  tutorialStep: number;
  shouldShowOnboarding: boolean;
  hasShownMissionModal: boolean;
  showCompleteModalStep: number | null;
  spotlightConfig: {
    isActive: boolean;
    targetElement: HTMLElement | null;
    tooltip?: React.ReactNode;
    tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
    padding?: number;
    onClose?: () => void;
    rounded?: 'sm' | 'md' | 'lg' | 'full' | number;
  } | null;
  showConfetti: boolean;
}

interface QuestActions {
  /**
   * 퀘스트 초기화: 상태 확인 후 시작 전이면 자동으로 start 호출
   */
  initializeQuest: (email: string) => Promise<void>;

  /**
   * 다음 퀘스트 단계로 진행
   */
  completeNextStep: (email: string) => Promise<void>;

  /**
   * 온보딩 보상 받기
   */
  getReward: (email: string) => Promise<void>;

  /**
   * 튜토리얼 활성화 여부 설정
   */
  setTutorialActive: (active: boolean) => void;

  /**
   * 튜토리얼 다음 단계로 진행
   */
  nextTutorialStep: () => void;

  /**
   * 튜토리얼 상태 초기화
   */
  resetTutorial: () => void;

  /**
   * 미션 완료 모달 표시 여부 설정
   */
  setShowCompleteModalStep: (step: number | null) => void;

  /**
   * 미션 안내 모달 표시 여부 설정
   */
  setHasShownMissionModal: (shown: boolean) => void;

  /**
   * 전역 스포트라이트 설정
   */
  setSpotlightConfig: (config: QuestStoreState['spotlightConfig']) => void;

  /**
   * 전역 스포트라이트 초기화
   */
  clearSpotlight: () => void;

  /**
   * 컨페티 표시 여부 설정
   */
  setShowConfetti: (show: boolean) => void;

  /**
   * 상태 전체 초기화
   */
  clear: () => void;
}

export type QuestStore = QuestStoreState & QuestActions;

export const useQuestStore = create<QuestStore>()(
  devtools(
    persist(
      (set, get) => ({
        currentLevel: 0,
        startedAt: null,
        isLoading: false,
        isChecked: false,
        isTutorialActive: false,
        tutorialStep: 0,
        shouldShowOnboarding: false,
        hasShownMissionModal: false,
        showCompleteModalStep: null,
        spotlightConfig: null,
        showConfetti: false,

        initializeQuest: async (email: string) => {
          const { isChecked, currentLevel } = get();

          if (!isChecked && currentLevel === 0) {
            set({ isLoading: true }, false, 'quest/init_start');
          }

          try {
            // 1. 현재 상태 체크
            let response = await onboardingService.check(email);
            let level = getQuestLevel(
              response.onboarding.state,
              response.onboarding.step
            );

            // 2. 미시작 상태(Level 0)라면 자동으로 start 호출
            if (level === 0) {
              await onboardingService.start({ email });
              // 시작 후 최신 상태 다시 조회
              response = await onboardingService.check(email);
              level = getQuestLevel(
                response.onboarding.state,
                response.onboarding.step
              );
            }

            set(
              {
                currentLevel: level,
                startedAt: response.onboarding.startedAt,
                isChecked: true,
                isLoading: false,
                shouldShowOnboarding: response.onboarding.shouldShowOnboarding,
              },
              false,
              'quest/init_success'
            );
          } catch (error) {
            console.error('Quest initialization failed:', error);
            set(
              { isLoading: false, isChecked: true },
              false,
              'quest/init_error'
            );
          }
        },

        completeNextStep: async (email: string) => {
          const { currentLevel, isLoading } = get();
          if (isLoading) return;

          set({ isLoading: true }, false, 'quest/next_start');

          try {
            // 서버로 다음 단계 요청을 보낼 때 필요한 현재 상태 매핑
            const currentState =
              currentLevel >= 6
                ? OnboardingState.COMPLETED
                : OnboardingState.IN_PROGRESS;
            // 서버의 step은 대략 level - 1 관례를 따르거나,
            // 정확한 로직은 백엔드 구현에 따르지만 여기서는 현재 레벨의 서버 기준 step을 보냅니다.
            const currentStepMapping: Record<number, number> = {
              1: 0,
              2: 1,
              3: 2,
              4: 3,
              5: 4,
              6: 5,
              7: 6,
            };

            const response = await onboardingService.next({
              email,
              currentState: currentState,
              currentStep: currentStepMapping[currentLevel] ?? 0,
            });

            const nextLevel = getQuestLevel(
              response.onboarding.state,
              response.onboarding.step
            );

            const prevLevel = currentLevel;

            set(
              {
                currentLevel: nextLevel,
                isLoading: false,
              },
              false,
              'quest/next_success'
            );

            // 미션 완료 모달 표시
            // 1: 상담기록 예시 (L1->L2), 2: 다회기 분석 예시 (L2->L3)
            // 3: 녹음 파일 업로드 (L4->L5), 4: 내 정보 입력 완료 및 보상 유도 (L5->L6)
            if ([1, 2, 4, 5].includes(prevLevel)) {
              let modalStep = prevLevel;
              if (prevLevel === 4) modalStep = 3;
              if (prevLevel === 5) modalStep = 5; // 마지막 미션 완료 시 5번(보상) 모달 표시
              get().setShowCompleteModalStep(modalStep);
            }
          } catch (error) {
            console.error('Moving to next quest step failed:', error);
            set({ isLoading: false }, false, 'quest/next_error');
          }
        },

        getReward: async (email: string) => {
          set({ isLoading: true }, false, 'quest/reward_start');

          try {
            await onboardingService.success({ email });

            // 보상 수령 후 상태 갱신을 위해 initializeQuest 재호출 혹은 직접 레벨 7로 설정
            const response = await onboardingService.check(email);
            const level = getQuestLevel(
              response.onboarding.state,
              response.onboarding.step
            );

            set(
              {
                currentLevel: level,
                isLoading: false,
              },
              false,
              'quest/reward_success'
            );
          } catch (error) {
            console.error('Getting reward failed:', error);
            set({ isLoading: false }, false, 'quest/reward_error');
          }
        },

        setTutorialActive: (active: boolean) => {
          set({ isTutorialActive: active }, false, 'quest/set_tutorial_active');
        },

        nextTutorialStep: () => {
          set(
            (state) => ({ tutorialStep: state.tutorialStep + 1 }),
            false,
            'quest/next_tutorial_step'
          );
        },

        setHasShownMissionModal: (shown: boolean) => {
          set(
            { hasShownMissionModal: shown },
            false,
            'quest/set_has_shown_mission_modal'
          );
        },

        setShowCompleteModalStep: (step: number | null) => {
          set(
            { showCompleteModalStep: step },
            false,
            'quest/set_show_complete_modal_step'
          );
        },

        setSpotlightConfig: (config) => {
          set({ spotlightConfig: config }, false, 'quest/set_spotlight_config');
        },

        clearSpotlight: () => {
          set({ spotlightConfig: null }, false, 'quest/clear_spotlight');
        },

        resetTutorial: () => {
          set(
            { isTutorialActive: false, tutorialStep: 0, spotlightConfig: null },
            false,
            'quest/reset_tutorial'
          );
        },

        setShowConfetti: (show: boolean) => {
          set({ showConfetti: show }, false, 'quest/set_show_confetti');
        },

        clear: () =>
          set(
            {
              currentLevel: 0,
              startedAt: null,
              isLoading: false,
              isChecked: false,
              isTutorialActive: false,
              tutorialStep: 0,
              shouldShowOnboarding: false,
              hasShownMissionModal: false,
              showCompleteModalStep: null,
            },
            false,
            'quest/clear'
          ),
      }),
      {
        name: 'mindthos-quest-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          currentLevel: state.currentLevel,
          startedAt: state.startedAt,
          shouldShowOnboarding: state.shouldShowOnboarding,
        }),
      }
    ),
    { name: 'QuestStore' }
  )
);
