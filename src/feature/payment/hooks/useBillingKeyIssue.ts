import { useMutation } from '@tanstack/react-query';

import { billingService } from '../services/billingService';
import type { BillingKeyIssueRequest } from '../types';

export const useBillingKeyIssue = () => {
  const mutation = useMutation({
    mutationFn: (request: BillingKeyIssueRequest) => billingService.issueBillingKey(request),
  });

  return {
    issueBillingKey: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};
