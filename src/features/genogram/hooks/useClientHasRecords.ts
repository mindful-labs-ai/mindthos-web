import { useQuery } from '@tanstack/react-query';

import { checkClientHasRecords } from '@/shared/api/supabase/clientQueries';
import { genogramQueryKeys } from '@/shared/constants/queryKeys';

/**
 * 내담자의 상담 기록 유무 확인 훅
 * @param clientId 내담자 ID
 * @returns 상담 기록 존재 여부
 */
export function useClientHasRecords(clientId: string) {
  const { data: hasRecords = false, isLoading } = useQuery({
    queryKey: genogramQueryKeys.hasRecords(clientId),
    queryFn: () => checkClientHasRecords(clientId),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5분간 캐시
  });

  return { hasRecords, isLoading };
}
