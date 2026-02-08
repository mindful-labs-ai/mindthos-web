import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

/**
 * 클라이언트의 상담 기록 유무 확인 훅
 * @param clientId 클라이언트 ID
 * @returns 상담 기록 존재 여부
 */
export function useClientHasRecords(clientId: string) {
  const { data: hasRecords = false, isLoading } = useQuery({
    queryKey: ['client-has-records', clientId],
    queryFn: async () => {
      if (!clientId) return false;

      // 클라이언트의 세션 수 조회
      const { count, error } = await supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId);

      if (error) {
        console.error('Failed to check client records:', error);
        return false;
      }

      return (count ?? 0) > 0;
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5분간 캐시
  });

  return { hasRecords, isLoading };
}
