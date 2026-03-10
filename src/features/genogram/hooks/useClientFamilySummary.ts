import { useQuery } from '@tanstack/react-query';

import { fetchFamilySummary } from '@/shared/api/supabase/clientQueries';

import type { AIGenogramOutput } from '../utils/aiJsonConverter';

interface UseClientFamilySummaryReturn {
  familySummary: AIGenogramOutput | null;
  isLoading: boolean;
}

export function useClientFamilySummary(
  clientId: string
): UseClientFamilySummaryReturn {
  const { data, isLoading } = useQuery({
    queryKey: ['clientFamilySummary', clientId],
    queryFn: () => fetchFamilySummary(clientId),
    enabled: !!clientId,
    staleTime: 0,
  });

  return {
    familySummary: data ?? null,
    isLoading,
  };
}
