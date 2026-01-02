import { useInfiniteQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/stores/authStore';

import { creditService } from '../services/creditService';

export const useCreditLogs = () => {
  const userId = useAuthStore((state) => state.userId);
  const userIdNumber = userId ? Number(userId) : null;

  return useInfiniteQuery({
    queryKey: ['credit', 'logs', userIdNumber],
    queryFn: async ({ pageParam = 0 }) => {
      if (!userIdNumber) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }
      return await creditService.getCreditLogs(userIdNumber, pageParam);
    },
    getNextPageParam: (lastPage, allPages) => {
      // 만약 가져온 데이터가 pageSize(20)보다 작으면 다음 페이지가 없는 것으로 간주
      return lastPage.length === 20 ? allPages.length : undefined;
    },
    initialPageParam: 0,
    enabled: !!userIdNumber,
  });
};
