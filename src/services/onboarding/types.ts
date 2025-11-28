export const OnboardingState = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export type OnboardingStateType =
  (typeof OnboardingState)[keyof typeof OnboardingState];

export const OnboardingStep = {
  INFO: 0,
  GUIDE_1: 1,
  GUIDE_2: 2,
  DONE: 3,
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
  name: string;
  phone_number?: string;
  organization?: string;
}

export interface OnboardingSaveResponse {
  success: boolean;
  message: string;
  step: OnboardingStepType;
  state: OnboardingStateType;
}

export interface OnboardingCompleteRequest {
  email: string;
}

export interface OnboardingCompleteResponse {
  success: boolean;
  message: string;
  step: OnboardingStepType;
  state: OnboardingStateType;
}
