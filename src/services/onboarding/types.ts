export const OnboardingState = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export type OnboardingStateType =
  (typeof OnboardingState)[keyof typeof OnboardingState];

export const OnboardingStep = {
  INFO: 0,
  TRANSCRIBE: 1,
  PROGRESS_NOTE: 2,
  AI_SUPERVISION: 3,
  DONE: 4,
} as const;

export type OnboardingStepType = number;

export interface OnboardingStatus {
  step: OnboardingStepType;
  state: OnboardingStateType;
  shouldShowOnboarding: boolean;
  started_at?: string | null;
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

export interface OnboardingNextRequest {
  email: string;
  currentState: OnboardingStateType;
  currentStep: OnboardingStepType;
}

export interface OnboardingNextResponse {
  success: boolean;
  message: string;
  onboarding: {
    state: OnboardingStateType;
    step: OnboardingStepType;
  };
}

export interface OnboardingStartRequest {
  email: string;
}

export interface OnboardingStartResponse {
  success: boolean;
  message: string;
  startedAt: string;
}

export interface OnboardingSuccessRequest {
  email: string;
}

export interface OnboardingSuccessResponse {
  success: boolean;
  message: string;
  completedAt: string;
  reward: {
    planType: string;
    freeUntil: string;
  };
}
