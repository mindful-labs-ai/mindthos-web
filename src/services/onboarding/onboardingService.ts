import { callEdgeFunction } from '@/shared/utils/edgeFunctionClient';

import { ONBOARDING_ENDPOINTS } from './constants';
import type {
  OnboardingStatusResponse,
  OnboardingSaveRequest,
  OnboardingSaveResponse,
  OnboardingCompleteRequest,
  OnboardingCompleteResponse,
  OnboardingNextRequest,
  OnboardingNextResponse,
  OnboardingStartRequest,
  OnboardingStartResponse,
  OnboardingSuccessRequest,
  OnboardingSuccessResponse,
} from './types';

export const onboardingService = {
  async getStatus(email: string): Promise<OnboardingStatusResponse> {
    return await callEdgeFunction<OnboardingStatusResponse>(
      ONBOARDING_ENDPOINTS.STATUS,
      { email }
    );
  },

  async check(email: string): Promise<OnboardingStatusResponse> {
    return await callEdgeFunction<OnboardingStatusResponse>(
      ONBOARDING_ENDPOINTS.CHECK,
      { email }
    );
  },

  async start(
    payload: OnboardingStartRequest
  ): Promise<OnboardingStartResponse> {
    return await callEdgeFunction<OnboardingStartResponse>(
      ONBOARDING_ENDPOINTS.START,
      payload
    );
  },

  async save(payload: OnboardingSaveRequest): Promise<OnboardingSaveResponse> {
    return await callEdgeFunction<OnboardingSaveResponse>(
      ONBOARDING_ENDPOINTS.SAVE,
      payload
    );
  },

  async next(payload: OnboardingNextRequest): Promise<OnboardingNextResponse> {
    return await callEdgeFunction<OnboardingNextResponse>(
      ONBOARDING_ENDPOINTS.NEXT,
      payload
    );
  },

  async success(
    payload: OnboardingSuccessRequest
  ): Promise<OnboardingSuccessResponse> {
    return await callEdgeFunction<OnboardingSuccessResponse>(
      ONBOARDING_ENDPOINTS.SUCCESS,
      payload
    );
  },

  async complete(
    payload: OnboardingCompleteRequest
  ): Promise<OnboardingCompleteResponse> {
    return await callEdgeFunction<OnboardingCompleteResponse>(
      ONBOARDING_ENDPOINTS.COMPLETE,
      payload
    );
  },
};
