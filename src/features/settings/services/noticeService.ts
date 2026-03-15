import {
  callEdgeFunction,
  EDGE_FUNCTION_ENDPOINTS,
} from '@/shared/api/edgeFunctionClient';

import type { Notice, NoticeListResponse } from '../types/notice';

export const noticeService = {
  /** 공지사항 목록 조회 */
  async getList(): Promise<Notice[]> {
    const data = await callEdgeFunction<NoticeListResponse>(
      EDGE_FUNCTION_ENDPOINTS.NOTICE.LIST,
      undefined,
      { method: 'GET' }
    );
    return data.notices ?? [];
  },
};
