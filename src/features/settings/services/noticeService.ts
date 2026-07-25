import { serverRequestPublic } from '@/shared/api/server/serverClient';

import type { Notice, NoticeListResponse } from '../types/notice';

export const noticeService = {
  /** 공지사항 목록 조회 */
  async getList(): Promise<Notice[]> {
    const data = await serverRequestPublic<NoticeListResponse>('/notices');
    return data.notices ?? [];
  },
};
