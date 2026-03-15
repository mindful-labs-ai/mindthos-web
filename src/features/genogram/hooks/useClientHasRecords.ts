import { useQuery } from '@tanstack/react-query';

import { checkClientHasRecords } from '@/shared/api/supabase/clientQueries';

/**
 * 클라이언트의 상담 기록 유무 확인 훅
 * @param clientId 클라이언트 ID
 * @returns 상담 기록 존재 여부
 */
export function useClientHasRecords(clientId: string) {
  const { data: hasRecords = false, isLoading } = useQuery({
    queryKey: ['client-has-records', clientId],
    queryFn: () => checkClientHasRecords(clientId),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5분간 캐시
  });

  return { hasRecords, isLoading };
}
