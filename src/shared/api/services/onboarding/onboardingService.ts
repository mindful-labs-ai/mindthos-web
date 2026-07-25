import { serverRequest } from '@/shared/api/server/serverClient';

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
    return await serverRequest<OnboardingStatusResponse>(
      ONBOARDING_ENDPOINTS.STATUS,
      { method: 'POST', body: { email } }
    );
  },

  async check(email: string): Promise<OnboardingStatusResponse> {
    return await serverRequest<OnboardingStatusResponse>(
      ONBOARDING_ENDPOINTS.CHECK,
      { method: 'POST', body: { email } }
    );
  },

  async start(
    payload: OnboardingStartRequest
  ): Promise<OnboardingStartResponse> {
    return await serverRequest<OnboardingStartResponse>(
      ONBOARDING_ENDPOINTS.START,
      { method: 'POST', body: payload }
    );
  },

  async save(payload: OnboardingSaveRequest): Promise<OnboardingSaveResponse> {
    return await serverRequest<OnboardingSaveResponse>(
      ONBOARDING_ENDPOINTS.SAVE,
      { method: 'POST', body: payload }
    );
  },

  async next(payload: OnboardingNextRequest): Promise<OnboardingNextResponse> {
    return await serverRequest<OnboardingNextResponse>(
      ONBOARDING_ENDPOINTS.NEXT,
      { method: 'POST', body: payload }
    );
  },

  async success(
    payload: OnboardingSuccessRequest
  ): Promise<OnboardingSuccessResponse> {
    return await serverRequest<OnboardingSuccessResponse>(
      ONBOARDING_ENDPOINTS.SUCCESS,
      { method: 'POST', body: payload }
    );
  },

  async complete(
    payload: OnboardingCompleteRequest
  ): Promise<OnboardingCompleteResponse> {
    return await serverRequest<OnboardingCompleteResponse>(
      ONBOARDING_ENDPOINTS.COMPLETE,
      { method: 'POST', body: payload }
    );
  },
};
