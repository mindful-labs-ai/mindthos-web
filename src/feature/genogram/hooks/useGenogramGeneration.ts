import { useMutation } from '@tanstack/react-query';

import {
  generateFamilySummary,
  type GenogramData,
} from '../services/genogramAIService';

interface UseGenogramGenerationOptions {
  onSuccess?: (data: GenogramData) => void;
  onError?: (error: Error) => void;
}

/**
 * 가계도 AI 생성 훅
 * 클라이언트의 상담 기록을 기반으로 가계도 생성
 */
export function useGenogramGeneration(options?: UseGenogramGenerationOptions) {
  const mutation = useMutation({
    mutationFn: async ({
      clientId,
      forceRefresh = true,
    }: {
      clientId: string;
      forceRefresh?: boolean;
    }) => {
      const response = await generateFamilySummary(clientId, forceRefresh);

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data.genogram;
    },
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });

  return {
    generate: mutation.mutate,
    generateAsync: mutation.mutateAsync,
    isGenerating: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}
