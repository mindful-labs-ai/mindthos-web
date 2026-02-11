import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import type { AIGenogramOutput } from '../utils/aiJsonConverter';

interface UseClientFamilySummaryReturn {
  familySummary: AIGenogramOutput | null;
  isLoading: boolean;
}

async function fetchFamilySummary(
  clientId: string
): Promise<AIGenogramOutput | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('family_summary')
    .eq('id', clientId)
    .single();

  if (error) {
    console.error('Failed to fetch family_summary:', error);
    return null;
  }

  return data?.family_summary ?? null;
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
