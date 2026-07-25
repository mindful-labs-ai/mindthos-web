import { useInfiniteQuery } from '@tanstack/react-query';

import { getCreditHistory } from '@/shared/api/server/creditServerApi';
import { creditQueryKeys } from '@/shared/constants/queryKeys';
import { useAuthStore } from '@/stores/authStore';

export const useCreditLogs = () => {
  const userId = useAuthStore((state) => state.userId);
  const userIdNumber = userId ? Number(userId) : null;

  return useInfiniteQuery({
    queryKey: creditQueryKeys.logs(userIdNumber!),
    queryFn: ({ pageParam }) => getCreditHistory(20, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!userIdNumber,
  });
};
