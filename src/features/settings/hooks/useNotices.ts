import { useQuery } from '@tanstack/react-query';

import { noticeService } from '../services/noticeService';

export const noticeQueryKeys = {
  all: ['notices'] as const,
  list: () => ['notices', 'list'] as const,
};

/** 공지사항 목록 조회 훅 */
export const useNotices = () => {
  const query = useQuery({
    queryKey: noticeQueryKeys.list(),
    queryFn: () => noticeService.getList(),
    staleTime: 5 * 60 * 1000,
  });

  return {
    notices: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
  };
};
