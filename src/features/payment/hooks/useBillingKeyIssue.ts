// TODO: 삭제 예정 - 결제 로직 변경으로 사용되지 않음
import { useMutation } from '@tanstack/react-query';

import { billingService } from '../services/billingService';
import type { BillingKeyIssueRequest } from '../types';

export const useBillingKeyIssue = () => {
  const mutation = useMutation({
    mutationFn: (request: BillingKeyIssueRequest) =>
      billingService.issueBillingKey(request),
  });

  return {
    issueBillingKey: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};
