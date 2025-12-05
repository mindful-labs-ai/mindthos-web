/**
 * 클라이언트 분석 관련 Hooks
 */

import { useEffect, useRef } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/stores/authStore';

import { clientAnalysisService } from '../services/clientAnalysisService';
import type {
  ClientAnalysisVersion,
  ClientTemplate,
  ClientTemplateGroups,
  ClientAnalysisType,
} from '../types/clientAnalysis.types';
import type {
  CreateClientAnalysisRequest,
  CreateClientAnalysisResponse,
  GetClientAnalysisStatusResponse,
  ClientAnalysisApiError,
} from '../types/clientAnalysisApi.types';

/**
 * 클라이언트 분석 Query Keys
 */
export const clientAnalysisQueryKeys = {
  all: ['client-analyses'] as const,
  templates: () => [...clientAnalysisQueryKeys.all, 'templates'] as const,
  templatesByType: (type: ClientAnalysisType) =>
    [...clientAnalysisQueryKeys.templates(), type] as const,
  analyses: () => [...clientAnalysisQueryKeys.all, 'analyses'] as const,
  analysesByClient: (clientId: string) =>
    [...clientAnalysisQueryKeys.analyses(), clientId] as const,
  status: (clientId: string, version: number) =>
    [...clientAnalysisQueryKeys.all, 'status', clientId, version] as const,
};

/**
 * 모든 템플릿 조회 (타입별 그룹화)
 */
export function useClientTemplates() {
  return useQuery<ClientTemplateGroups, ClientAnalysisApiError>({
    queryKey: clientAnalysisQueryKeys.templates(),
    queryFn: () => clientAnalysisService.getAllTemplates(),
    staleTime: 5 * 60 * 1000, // 5분
  });
}

/**
 * 타입별 템플릿 조회
 */
export function useTemplatesByType(type: ClientAnalysisType) {
  return useQuery<ClientTemplate[], ClientAnalysisApiError>({
    queryKey: clientAnalysisQueryKeys.templatesByType(type),
    queryFn: () => clientAnalysisService.getTemplatesByType(type),
    staleTime: 5 * 60 * 1000, // 5분
  });
}

/**
 * 클라이언트 분석 히스토리 조회
 */
export function useClientAnalyses(clientId: string) {
  return useQuery<ClientAnalysisVersion[], ClientAnalysisApiError>({
    queryKey: clientAnalysisQueryKeys.analysesByClient(clientId),
    queryFn: () => clientAnalysisService.getClientAnalyses(clientId),
    enabled: !!clientId,
    staleTime: 1 * 60 * 1000, // 1분
  });
}

/**
 * 클라이언트 분석 생성 Mutation
 */
export function useCreateClientAnalysis() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);

  return useMutation<
    CreateClientAnalysisResponse,
    ClientAnalysisApiError,
    Omit<CreateClientAnalysisRequest, 'user_id'>
  >({
    mutationFn: async (request) => {
      if (!userId) {
        throw {
          status: 401,
          success: false,
          error: 'UNAUTHORIZED',
          message: '사용자 정보를 찾을 수 없습니다.',
        } as ClientAnalysisApiError;
      }

      return clientAnalysisService.createAnalysis({
        ...request,
        user_id: Number(userId),
      });
    },
    onSuccess: (data, variables) => {
      // 생성 직후 분석 목록 쿼리 invalidate
      queryClient.invalidateQueries({
        queryKey: clientAnalysisQueryKeys.analysesByClient(variables.client_id),
      });
    },
  });
}

/**
 * 클라이언트 분석 상태 조회 (폴링)
 */
export interface UseClientAnalysisStatusOptions {
  clientId: string;
  version: number;
  enabled?: boolean;
  refetchInterval?: number | false;
  onSuccess?: (data: GetClientAnalysisStatusResponse) => void;
  onError?: (error: ClientAnalysisApiError) => void;
  onComplete?: (data: GetClientAnalysisStatusResponse) => void; // 완료 시에만 호출
}

export function useClientAnalysisStatus({
  clientId,
  version,
  enabled = true,
  refetchInterval = 8000, // 기본 8초마다 폴링
  onSuccess,
  onError,
  onComplete,
}: UseClientAnalysisStatusOptions) {
  const queryClient = useQueryClient();
  const previousStatusRef = useRef<string | null>(null);

  const query = useQuery<
    GetClientAnalysisStatusResponse,
    ClientAnalysisApiError
  >({
    queryKey: clientAnalysisQueryKeys.status(clientId, version),
    queryFn: () => clientAnalysisService.getAnalysisStatus(clientId, version),
    enabled: enabled && !!clientId && version > 0,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return refetchInterval;

      // AI 수퍼비전 분석이 succeeded 또는 failed 상태면 폴링 중단
      const analysis = data.analyses.ai_supervision;
      const isCompleted =
        analysis &&
        (analysis.status === 'succeeded' || analysis.status === 'failed');

      if (isCompleted) {
        return false;
      }

      return refetchInterval;
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 0, // 폴링 중에는 항상 최신 데이터 필요
    refetchOnWindowFocus: false, // 폴링으로 충분
    refetchOnMount: false, // 폴링으로 충분
  });

  // useEffect로 데이터 변경 감지
  useEffect(() => {
    const data = query.data;
    if (!data) return;

    // 기존 onSuccess 콜백 호출 (모든 폴링마다)
    onSuccess?.(data);

    // 상태가 변경되었을 때 확인
    const currentStatus = data.analyses.ai_supervision.status;
    const previousStatus = previousStatusRef.current;

    // AI 수퍼비전 분석이 완료되었고, 이전에는 완료되지 않았을 때 onComplete 호출
    const isCompleted =
      currentStatus === 'succeeded' || currentStatus === 'failed';

    const wasNotCompleted =
      previousStatus !== 'succeeded' && previousStatus !== 'failed';

    if (isCompleted && (wasNotCompleted || previousStatus === null)) {
      // 분석 히스토리 쿼리 invalidate (최신 데이터로 갱신)
      queryClient.invalidateQueries({
        queryKey: clientAnalysisQueryKeys.analysesByClient(clientId),
      });

      onComplete?.(data);
    }

    // 현재 상태 저장
    previousStatusRef.current = currentStatus;
  }, [query.data, onSuccess, onComplete, queryClient, clientId]);

  // 에러 처리
  useEffect(() => {
    if (query.error) {
      onError?.(query.error);
    }
  }, [query.error, onError]);

  return query;
}
