import { useQuery } from '@tanstack/react-query';

import { phoneVerificationService } from '@/features/auth/services/phoneVerificationService';
import { phoneVerificationQueryKeys } from '@/shared/constants/queryKeys';

/**
 * 회원가입(휴대폰 인증) 필요 여부 확인
 * required === true 이면 /user-verify 로 리다이렉트
 */
export const useSignupCheck = (enabled = true) => {
  const query = useQuery({
    queryKey: phoneVerificationQueryKeys.status(),
    queryFn: async () => {
      const response = await phoneVerificationService.checkStatus();
      if (!response.success) {
        throw new Error('회원가입 상태를 확인할 수 없어요.');
      }
      return response;
    },
    enabled,
    staleTime: Infinity,
  });

  return {
    required: query.data?.required ?? false,
    verifiedAt: query.data?.verified_at ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
};
