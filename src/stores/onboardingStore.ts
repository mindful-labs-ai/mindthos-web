import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { onboardingService } from '@/services/onboarding/onboardingService';
import {
  OnboardingState,
  OnboardingStep,
  type OnboardingStepType,
  type OnboardingStatus,
} from '@/services/onboarding/types';

interface OnboardingStoreState {
  isOpen: boolean;
  currentStep: OnboardingStepType;
  status: OnboardingStatus | null;
  isChecked: boolean;
  isLoading: boolean;
}

interface SaveInfoPayload {
  name: string;
  phone_number?: string;
  organization?: string;
}

interface OnboardingActions {
  checkOnboarding: (email: string) => Promise<void>;
  saveInfo: (email: string, payload: SaveInfoPayload) => Promise<void>;
  nextStep: () => void;
  complete: (email: string) => Promise<void>;
  close: () => void;
  clear: () => void;
}

type OnboardingStore = OnboardingStoreState & OnboardingActions;

export const useOnboardingStore = create<OnboardingStore>()(
  devtools(
    (set, get) => ({
      isOpen: false,
      currentStep: OnboardingStep.INFO,
      status: null,
      isChecked: false,
      isLoading: false,

      checkOnboarding: async (email: string) => {
        if (get().isChecked) return;

        set({ isLoading: true }, false, 'checkOnboarding/start');

        try {
          const response = await onboardingService.getStatus(email);

          const startStep =
            response.onboarding.state === OnboardingState.IN_PROGRESS
              ? ((response.onboarding.step + 1) as OnboardingStepType)
              : response.onboarding.step;

          set(
            {
              status: response.onboarding,
              currentStep: startStep,
              isOpen: response.onboarding.shouldShowOnboarding,
              isChecked: true,
              isLoading: false,
            },
            false,
            'checkOnboarding/success'
          );
        } catch {
          set(
            {
              status: null,
              isChecked: true,
              isLoading: false,
              isOpen: false,
            },
            false,
            'checkOnboarding/error'
          );
        }
      },

      saveInfo: async (email: string, payload: SaveInfoPayload) => {
        const response = await onboardingService.save({
          email,
          ...payload,
        });

        const nextStepValue = (response.step + 1) as OnboardingStepType;

        set(
          {
            currentStep: nextStepValue,
            status: {
              step: response.step,
              state: response.state,
              shouldShowOnboarding:
                response.state !== OnboardingState.COMPLETED,
            },
          },
          false,
          'saveInfo'
        );
      },

      nextStep: () => {
        const { currentStep } = get();
        const nextStepValue = (currentStep + 1) as OnboardingStepType;

        set(
          {
            currentStep: nextStepValue,
          },
          false,
          'nextStep'
        );
      },

      complete: async (email: string) => {
        const response = await onboardingService.complete({ email });

        set(
          {
            currentStep: response.step,
            isOpen: false,
            status: {
              step: response.step,
              state: response.state,
              shouldShowOnboarding: false,
            },
          },
          false,
          'complete'
        );
      },

      close: () => {
        set({ isOpen: false }, false, 'close');
      },

      clear: () =>
        set(
          {
            isOpen: false,
            currentStep: OnboardingStep.INFO,
            status: null,
            isChecked: false,
            isLoading: false,
          },
          false,
          'clear'
        ),
    }),
    { name: 'OnboardingStore' }
  )
);
