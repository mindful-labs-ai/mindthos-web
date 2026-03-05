import {
  callEdgeFunction,
  EDGE_FUNCTION_ENDPOINTS,
} from '@/shared/utils/edgeFunctionClient';

import type { TermsContentResponse } from '../types';

export const termsContentService = {
  async getContent(type: string): Promise<TermsContentResponse> {
    return await callEdgeFunction<TermsContentResponse>(
      `${EDGE_FUNCTION_ENDPOINTS.TERMS.CONTENT}?type=${type}`,
      undefined,
      { method: 'GET' }
    );
  },
};
