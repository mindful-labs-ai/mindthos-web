export const OnboardingState = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export type OnboardingStateType =
  (typeof OnboardingState)[keyof typeof OnboardingState];

export const OnboardingStep = {
  NAME: 0,
  PHONE: 1,
  GUIDE_1: 2,
  GUIDE_2: 3,
} as const;

export type OnboardingStepType =
  (typeof OnboardingStep)[keyof typeof OnboardingStep];

export interface OnboardingStatus {
  step: OnboardingStepType;
  state: OnboardingStateType;
  shouldShowOnboarding: boolean;
}

export interface OnboardingStatusResponse {
  success: boolean;
  message: string;
  onboarding: OnboardingStatus;
}

export interface OnboardingSaveRequest {
  email: string;
  step: OnboardingStepType;
  name?: string;
  phone_number?: string;
}

export interface OnboardingSaveResponse {
  success: boolean;
  message: string;
  step: OnboardingStepType;
  state: OnboardingStateType;
}
