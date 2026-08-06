import { useQuery } from '@tanstack/react-query';

import { getClientById } from '@/shared/api/supabase/clientQueries';
import { clientQueryKeys } from '@/shared/constants/queryKeys';
import { useAuthStore } from '@/stores/authStore';

export function useClientById(clientId: string | null) {
  const counselorId = useAuthStore((state) => state.userId);

  const query = useQuery({
    queryKey: clientQueryKeys.detail(counselorId ?? '', clientId ?? ''),
    queryFn: () => getClientById(clientId!, counselorId!),
    enabled: !!clientId && !!counselorId,
  });

  return {
    client: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
  };
}
