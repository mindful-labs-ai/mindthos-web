import { useCallback, useMemo, useState } from 'react';

import { useMutation } from '@tanstack/react-query';

import { queryClient } from '@/lib/queryClient';
import type { UserData } from '@/services/auth/types';
import { useAuthStore } from '@/stores/authStore';

import { termsAgreementService } from '../services/termsAgreementService';
import type { TermItem } from '../types';

export const useTermsAgreement = (terms: TermItem[]) => {
  const [agreements, setAgreements] = useState<Record<string, boolean>>({});
  const user = useAuthStore((state) => state.user);

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
      if (!user?.email) throw new Error('사용자 정보를 찾을 수 없습니다.');

      return await termsAgreementService.agreeToTerms({
        email: user.email,
        agreements: terms.map((t) => ({
          terms_id: t.id,
          agreed: agreements[t.id] ?? false,
        })),
      });
    },
    onSuccess: (data) => {
      // authStore 직접 업데이트
      useAuthStore.setState({
        termsAgreedAt: data.agreedAt,
        termsVersion: data.version,
      });

      // React Query 캐시도 동기적으로 업데이트
      // invalidateQueries 대신 setQueryData로 캐시를 직접 갱신하여
      // initialize() 재실행 시 구 데이터로 덮어쓰는 것을 방지
      if (user?.email) {
        queryClient.setQueryData<UserData | null>(
          ['user', 'data', user.email],
          (old) =>
            old
              ? {
                  ...old,
                  termsAgreedAt: data.agreedAt,
                  termsVersion: data.version,
                }
              : old
        );
      }
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
