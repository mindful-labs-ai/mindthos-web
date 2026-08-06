import { useQuery } from '@tanstack/react-query';

import { getCohortSurveyStatus } from '@/shared/api/server/acquisitionServerApi';

export const cohortSurveyQueryKeys = {
  all: ['cohort-survey'] as const,
  status: () => [...cohortSurveyQueryKeys.all, 'status'] as const,
};

export const useCohortSurveyCheck = (enabled = true) => {
  const query = useQuery({
    queryKey: cohortSurveyQueryKeys.status(),
    queryFn: getCohortSurveyStatus,
    enabled,
    staleTime: Infinity,
  });

  return {
    completed: query.data?.completed ?? false,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};
