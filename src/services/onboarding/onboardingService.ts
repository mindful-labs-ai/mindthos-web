import { callEdgeFunction } from '@/services/auth/edgeFunctionClient';

import { ONBOARDING_ENDPOINTS } from './constants';
import type {
  OnboardingStatusResponse,
  OnboardingSaveRequest,
  OnboardingSaveResponse,
} from './types';

export const onboardingService = {
  async getStatus(email: string): Promise<OnboardingStatusResponse> {
    return await callEdgeFunction<OnboardingStatusResponse>(
      ONBOARDING_ENDPOINTS.STATUS,
      { email }
    );
  },

  async save(payload: OnboardingSaveRequest): Promise<OnboardingSaveResponse> {
    return await callEdgeFunction<OnboardingSaveResponse>(
      ONBOARDING_ENDPOINTS.SAVE,
      payload
    );
  },
};
