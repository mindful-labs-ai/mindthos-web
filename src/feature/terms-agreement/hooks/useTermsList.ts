import { useQuery } from '@tanstack/react-query';

import { termsAgreementQueryKeys } from '../constants';
import { termsAgreementService } from '../services/termsAgreementService';

export const useTermsList = () => {
  const query = useQuery({
    queryKey: termsAgreementQueryKeys.list(),
    queryFn: async () => {
      const response = await termsAgreementService.getTermsList();
      if (!response.success) {
        throw new Error('약관 목록을 불러올 수 없습니다.');
      }
      return response.terms;
    },
  });

  return {
    terms: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
};
