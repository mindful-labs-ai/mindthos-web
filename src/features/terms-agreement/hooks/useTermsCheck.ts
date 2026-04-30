import { useQuery } from '@tanstack/react-query';

import { termsAgreementQueryKeys } from '@/shared/constants/queryKeys';

import { termsAgreementService } from '../services/termsAgreementService';

export const useTermsCheck = (enabled = true) => {
  const query = useQuery({
    queryKey: termsAgreementQueryKeys.check(),
    queryFn: async () => {
      const response = await termsAgreementService.checkTerms();
      if (!response.success) {
        throw new Error('약관 동의 상태를 확인할 수 없어요.');
      }
      return response;
    },
    enabled,
    staleTime: Infinity,
  });

  return {
    agreedAll: query.data?.agreedAll ?? false,
    pendingTerms: query.data?.pendingTerms ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
};
