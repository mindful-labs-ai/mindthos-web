import { useCallback, useMemo, useState } from 'react';

import { useMutation } from '@tanstack/react-query';

import { queryClient } from '@/lib/queryClient';
import { termsAgreementQueryKeys } from '@/shared/constants/queryKeys';

import { termsAgreementService } from '../services/termsAgreementService';
import type { TermItem, TermsCheckResponse } from '../types';

export const useTermsAgreement = (terms: TermItem[]) => {
  const [agreements, setAgreements] = useState<Record<string, boolean>>({});

  const allChecked = useMemo(
    () => terms.length > 0 && terms.every((t) => agreements[t.id] === true),
    [terms, agreements]
  );

  const allRequiredChecked = useMemo(
    () =>
      terms
        .filter((t) => t.is_required)
        .every((t) => agreements[t.id] === true),
    [terms, agreements]
  );

  const toggleAll = useCallback(() => {
    if (allChecked) {
      setAgreements({});
    } else {
      const next: Record<string, boolean> = {};
      terms.forEach((t) => {
        next[t.id] = true;
      });
      setAgreements(next);
    }
  }, [allChecked, terms]);

  const toggleOne = useCallback((termId: string) => {
    setAgreements((prev) => ({ ...prev, [termId]: !prev[termId] }));
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      return await termsAgreementService.agreeToTerms({
        agreements: terms.map((t) => ({
          terms_id: t.id,
          agreed: agreements[t.id] ?? false,
        })),
      });
    },
    onSuccess: () => {
      queryClient.setQueryData<TermsCheckResponse>(
        termsAgreementQueryKeys.check(),
        (old) =>
          old
            ? {
                ...old,
                agreedAll: true,
                pendingTerms: [],
              }
            : old
      );
    },
  });

  return {
    agreements,
    allChecked,
    allRequiredChecked,
    toggleAll,
    toggleOne,
    submit: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    submitError: mutation.error,
  };
};
