import { useQuery, useQueryClient } from '@tanstack/react-query';

import { reportQueryKeys } from '@/features/report/constants/queryKeys';
import {
  fetchReportTemplates,
  type ReportTemplate,
} from '@/shared/api/supabase/reportQueries';

export type { ReportTemplate };

const STALE_TIME = 1000 * 60 * 30;

export function useReportTemplates() {
  const { data, isLoading } = useQuery({
    queryKey: reportQueryKeys.templates.all,
    queryFn: fetchReportTemplates,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });

  return {
    templates: data ?? [],
    isLoading,
    /** key로 단일 템플릿 조회 */
    getTemplate: (key: string) =>
      (data ?? []).find((t) => t.key === key) ?? null,
  };
}

/** AppInitialize에서 prefetch용으로 사용 */
export function usePrefetchReportTemplates() {
  const queryClient = useQueryClient();
  queryClient.prefetchQuery({
    queryKey: reportQueryKeys.templates.all,
    queryFn: fetchReportTemplates,
    staleTime: STALE_TIME,
  });
}
