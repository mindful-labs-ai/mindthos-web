import { serverRequestPublic } from '@/shared/api/server/serverClient';

import type { TermsContentResponse } from '../types';

export const termsContentService = {
  async getContent(type: string): Promise<TermsContentResponse> {
    return await serverRequestPublic<TermsContentResponse>(
      `/terms/content?type=${encodeURIComponent(type)}`
    );
  },
};
