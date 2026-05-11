/**
 * 다중 세션 순차 생성 Hook
 * - 지정된 순서대로 하나씩 세션 생성
 * - 각 파일: S3 업로드 → 세션 생성 API 호출
 * - 중간 실패해도 나머지 계속 진행
 */

import { useCallback, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import {
  createSessionBackground,
  InsufficientCreditError,
} from '@/shared/api/supabase/sessionQueries';
import { sessionQueryKeys } from '@/shared/constants/queryKeys';

import { s3UploadService } from '../services/s3UploadService';
import type {
  FileSessionConfig,
  MultiFileInfo,
  SessionCreateResult,
} from '../types';

interface UseMultiSessionCreateParams {
  userId: number;
  templateId: number;
  /** 서버 402 (잔액 부족) 응답이 떨어진 시점에 호출. 토스트/플랜 안내용. */
  onInsufficientCredit?: (message: string) => void;
}

interface UseMultiSessionCreateReturn {
  createSessions: (
    configs: FileSessionConfig[],
    files: MultiFileInfo[]
  ) => Promise<SessionCreateResult[]>;
  results: SessionCreateResult[];
  currentFileId: string | null;
  isCreating: boolean;
  reset: () => void;
}

export function useMultiSessionCreate({
  userId,
  templateId,
  onInsufficientCredit,
}: UseMultiSessionCreateParams): UseMultiSessionCreateReturn {
  const queryClient = useQueryClient();
  const [results, setResults] = useState<SessionCreateResult[]>([]);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const updateResult = useCallback(
    (fileId: string, update: Partial<SessionCreateResult>) => {
      setResults((prev) =>
        prev.map((r) => (r.fileId === fileId ? { ...r, ...update } : r))
      );
    },
    []
  );

  const createSessions = useCallback(
    async (
      configs: FileSessionConfig[],
      files: MultiFileInfo[]
    ): Promise<SessionCreateResult[]> => {
      setIsCreating(true);

      // 순서대로 정렬
      const sortedConfigs = [...configs].sort((a, b) => a.order - b.order);

      // 초기 결과 상태 설정
      const initialResults: SessionCreateResult[] = sortedConfigs.map(
        (config) => {
          const file = files.find((f) => f.id === config.fileId);
          return {
            fileId: config.fileId,
            fileName: file?.name || '',
            status: 'pending' as const,
          };
        }
      );
      setResults(initialResults);

      const finalResults: SessionCreateResult[] = [];

      // 순차적으로 처리
      for (let i = 0; i < sortedConfigs.length; i += 1) {
        const config = sortedConfigs[i];
        const file = files.find((f) => f.id === config.fileId);
        if (!file) {
          finalResults.push({
            fileId: config.fileId,
            fileName: '',
            status: 'failed',
            errorMessage: '파일을 찾을 수 없어요.',
          });
          continue;
        }

        setCurrentFileId(config.fileId);

        try {
          // 1. S3 업로드
          updateResult(config.fileId, {
            status: 'uploading',
            uploadProgress: 0,
          });

          const uploadResult = await s3UploadService.uploadAudio({
            file: file.file,
            user_id: userId,
            onProgress: (progress) => {
              updateResult(config.fileId, { uploadProgress: progress });
            },
          });

          // 2. 세션 생성 API
          updateResult(config.fileId, { status: 'creating' });

          const sttModel = config.sttModel;

          const response = await createSessionBackground({
            user_id: userId,
            title: file.name,
            s3_key: uploadResult.file_path,
            file_size_mb: uploadResult.file_size_mb,
            duration_seconds:
              uploadResult.duration_seconds || file.duration || 0,
            client_id: config.clientId || null,
            stt_model: sttModel,
            template_id: templateId,
          });

          const successResult: SessionCreateResult = {
            fileId: config.fileId,
            fileName: file.name,
            status: 'success',
            sessionId: response.session_id,
          };

          updateResult(config.fileId, successResult);
          finalResults.push(successResult);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : '알 수 없는 오류';

          const failedResult: SessionCreateResult = {
            fileId: config.fileId,
            fileName: file.name,
            status: 'failed',
            errorMessage,
          };

          updateResult(config.fileId, failedResult);
          finalResults.push(failedResult);

          // 잔액 부족이면 이후 파일은 모두 같은 사유로 실패시키고 루프 중단.
          // 사용자 알림은 onInsufficientCredit 콜백에 위임.
          if (error instanceof InsufficientCreditError) {
            const remaining = sortedConfigs.slice(i + 1);
            for (const skipped of remaining) {
              const skippedFile = files.find((f) => f.id === skipped.fileId);
              if (!skippedFile) continue;
              const skippedResult: SessionCreateResult = {
                fileId: skipped.fileId,
                fileName: skippedFile.name,
                status: 'failed',
                errorMessage,
              };
              updateResult(skipped.fileId, skippedResult);
              finalResults.push(skippedResult);
            }
            onInsufficientCredit?.(errorMessage);
            break;
          }
          // 그 외 실패는 다음 파일 계속 진행
        }
      }

      setCurrentFileId(null);
      setIsCreating(false);

      // 세션 목록 쿼리 invalidate
      queryClient.invalidateQueries({ queryKey: sessionQueryKeys.all(userId) });

      return finalResults;
    },
    [userId, templateId, queryClient, updateResult, onInsufficientCredit]
  );

  const reset = useCallback(() => {
    setResults([]);
    setCurrentFileId(null);
    setIsCreating(false);
  }, []);

  return {
    createSessions,
    results,
    currentFileId,
    isCreating,
    reset,
  };
}
