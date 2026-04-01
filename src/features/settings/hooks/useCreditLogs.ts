import { useInfiniteQuery } from '@tanstack/react-query';

import { creditService } from '@/shared/api/supabase/creditQueries';
import { creditQueryKeys } from '@/shared/constants/queryKeys';
import { useAuthStore } from '@/stores/authStore';

export const useCreditLogs = () => {
  const userId = useAuthStore((state) => state.userId);
  const userIdNumber = userId ? Number(userId) : null;

  return useInfiniteQuery({
    queryKey: creditQueryKeys.logs(userIdNumber!),
    queryFn: ({ pageParam = 0 }) =>
      creditService.getCreditLogs(userIdNumber!, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      // 만약 가져온 데이터가 pageSize(20)보다 작으면 다음 페이지가 없는 것으로 간주
      return lastPage.length === 20 ? allPages.length : undefined;
    },
    initialPageParam: 0,
    enabled: !!userIdNumber,
  });
};
