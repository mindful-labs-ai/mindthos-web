import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

import type { AIGenogramOutput } from '../utils/aiJsonConverter';

interface UseClientFamilySummaryReturn {
  familySummary: AIGenogramOutput | null;
  isLoading: boolean;
}

export function useClientFamilySummary(
  clientId: string
): UseClientFamilySummaryReturn {
  const [familySummary, setFamilySummary] = useState<AIGenogramOutput | null>(
    null
  );
  // clientId가 있으면 초기 로딩 상태로 시작
  const [isLoading, setIsLoading] = useState(!!clientId);

  useEffect(() => {
    if (!clientId) {
      setFamilySummary(null);
      setIsLoading(false);
      return;
    }

    // 새 clientId로 변경될 때 로딩 상태 초기화
    setIsLoading(true);
    setFamilySummary(null);

    const fetchFamilySummary = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('family_summary')
          .eq('id', clientId)
          .single();

        if (error) {
          console.error('Failed to fetch family_summary:', error);
          setFamilySummary(null);
          return;
        }

        setFamilySummary(data?.family_summary ?? null);
      } catch (e) {
        console.error('Failed to fetch family_summary:', e);
        setFamilySummary(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFamilySummary();
  }, [clientId]);

  return { familySummary, isLoading };
}
