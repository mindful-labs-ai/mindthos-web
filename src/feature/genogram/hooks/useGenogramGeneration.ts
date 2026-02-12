import { useEffect } from 'react';

import { useMutation } from '@tanstack/react-query';

import type { SerializedGenogram } from '@/genogram/core/models/genogram';

import { generateFamilySummary } from '../services/genogramAIService';

interface UseGenogramGenerationOptions {
  onSuccess?: (data: SerializedGenogram) => void;
  onError?: (error: Error) => void;
}

/**
 * 가계도 AI 생성 훅
 * 클라이언트의 상담 기록을 기반으로 가계도 생성
 *
 * 파이프라인:
 * 1. API 호출 → AI 분석 결과 (원본 JSON)
 * 2. aiJsonConverter로 좌표 계산 및 캔버스 변환
 * 3. DB 저장 (옵션)
 */
export function useGenogramGeneration(options?: UseGenogramGenerationOptions) {
  const mutation = useMutation({
    mutationFn: async ({
      clientId,
      userId,
      saveToDb = true,
    }: {
      clientId: string;
      userId: string;
      saveToDb?: boolean;
    }) => {
      const response = await generateFamilySummary(clientId, userId, saveToDb);

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

  // 생성 중 브라우저 새로고침/이탈 방지
  useEffect(() => {
    if (!mutation.isPending) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [mutation.isPending]);

  return {
    generate: mutation.mutate,
    generateAsync: mutation.mutateAsync,
    isGenerating: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}
