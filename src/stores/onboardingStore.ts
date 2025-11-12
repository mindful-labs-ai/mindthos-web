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

interface OnboardingActions {
  checkOnboarding: (email: string) => Promise<void>;
  saveName: (email: string, name: string) => Promise<void>;
  savePhone: (email: string, phoneNumber: string) => Promise<void>;
  nextStep: (email: string) => Promise<void>;
  complete: (email: string) => Promise<void>;
  close: () => void;
  clear: () => void;
}

type OnboardingStore = OnboardingStoreState & OnboardingActions;

export const useOnboardingStore = create<OnboardingStore>()(
  devtools(
    (set, get) => ({
      isOpen: false,
      currentStep: OnboardingStep.NAME,
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

      saveName: async (email: string, name: string) => {
        const response = await onboardingService.save({
          email,
          step: OnboardingStep.NAME,
          name,
        });

        const updatedStep = (response.step + 1) as OnboardingStepType;

        set(
          {
            currentStep: updatedStep,
            status: {
              step: response.step,
              state: response.state,
              shouldShowOnboarding:
                response.state !== OnboardingState.COMPLETED,
            },
          },
          false,
          'saveName'
        );
      },

      savePhone: async (email: string, phoneNumber: string) => {
        const response = await onboardingService.save({
          email,
          step: OnboardingStep.PHONE,
          phone_number: phoneNumber,
        });

        const updatedStep = (response.step + 1) as OnboardingStepType;

        set(
          {
            currentStep: updatedStep,
            status: {
              step: response.step,
              state: response.state,
              shouldShowOnboarding:
                response.state !== OnboardingState.COMPLETED,
            },
          },
          false,
          'savePhone'
        );
      },

      nextStep: async (email: string) => {
        const { currentStep } = get();

        const response = await onboardingService.save({
          email,
          step: (currentStep + 1) as OnboardingStepType,
        });

        set(
          {
            currentStep: response.step,
            status: {
              step: response.step,
              state: response.state,
              shouldShowOnboarding:
                response.state !== OnboardingState.COMPLETED,
            },
          },
          false,
          'nextStep'
        );
      },

      complete: async (email: string) => {
        const response = await onboardingService.save({
          email,
          step: OnboardingStep.GUIDE_2,
        });

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
            currentStep: OnboardingStep.NAME,
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
