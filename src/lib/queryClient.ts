import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // 무한대 - 수동으로 invalidate하기 전까지 fresh 상태 유지
      gcTime: 1000 * 60 * 30, // 30분 - 캐시 유지 시간
      retry: 1,
      refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 refetch 완전 비활성화
      refetchOnMount: false, // 마운트 시 자동 refetch 완전 비활성화
      refetchOnReconnect: false, // 재연결 시 자동 refetch 완전 비활성화
      refetchInterval: false, // 자동 폴링 완전 비활성화
    },
    mutations: {
      retry: 0,
    },
  },
});
