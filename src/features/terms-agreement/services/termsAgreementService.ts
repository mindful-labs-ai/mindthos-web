import { serverRequest } from '@/shared/api/server/serverClient';

import type {
  TermsAgreeRequest,
  TermsAgreeResponse,
  TermsCheckResponse,
} from '../types';

export const termsAgreementService = {
  async checkTerms(): Promise<TermsCheckResponse> {
    return await serverRequest<TermsCheckResponse>('/terms/check');
  },

  async agreeToTerms(payload: TermsAgreeRequest): Promise<TermsAgreeResponse> {
    return await serverRequest<TermsAgreeResponse>('/terms/agree', {
      method: 'POST',
      body: payload,
    });
  },
};
