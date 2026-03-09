import {
  callEdgeFunction,
  EDGE_FUNCTION_ENDPOINTS,
} from '@/shared/utils/edgeFunctionClient';

import type {
  TermsAgreeRequest,
  TermsAgreeResponse,
  TermsCheckResponse,
} from '../types';

export const termsAgreementService = {
  async checkTerms(): Promise<TermsCheckResponse> {
    return await callEdgeFunction<TermsCheckResponse>(
      EDGE_FUNCTION_ENDPOINTS.TERMS.CHECK,
      undefined,
      { method: 'GET' }
    );
  },

  async agreeToTerms(payload: TermsAgreeRequest): Promise<TermsAgreeResponse> {
    return await callEdgeFunction<TermsAgreeResponse>(
      EDGE_FUNCTION_ENDPOINTS.TERMS.AGREE,
      payload
    );
  },
};
