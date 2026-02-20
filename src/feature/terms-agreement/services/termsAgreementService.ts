import {
  callEdgeFunction,
  EDGE_FUNCTION_ENDPOINTS,
} from '@/shared/utils/edgeFunctionClient';

import type {
  TermsAgreeRequest,
  TermsAgreeResponse,
  TermsCheckResponse,
  TermsListResponse,
} from '../types';

export const termsAgreementService = {
  async getTermsList(): Promise<TermsListResponse> {
    return await callEdgeFunction<TermsListResponse>(
      EDGE_FUNCTION_ENDPOINTS.TERMS.LIST,
      undefined,
      { method: 'GET' }
    );
  },

  async checkTerms(email: string): Promise<TermsCheckResponse> {
    return await callEdgeFunction<TermsCheckResponse>(
      EDGE_FUNCTION_ENDPOINTS.TERMS.CHECK,
      { email }
    );
  },

  async agreeToTerms(payload: TermsAgreeRequest): Promise<TermsAgreeResponse> {
    return await callEdgeFunction<TermsAgreeResponse>(
      EDGE_FUNCTION_ENDPOINTS.TERMS.AGREE,
      payload
    );
  },
};
