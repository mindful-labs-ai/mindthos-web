/**
 * 다중 세션 순차 생성 Hook
 * - 지정된 순서대로 하나씩 세션 생성
 * - 각 파일: S3 업로드 → 세션 생성 API 호출
 * - 중간 실패해도 나머지 계속 진행
 */

import { useCallback, useState } from 'react';

import { type InfiniteData, useQueryClient } from '@tanstack/react-query';

import {
  createSessionBackground,
  InsufficientCreditError,
  type SessionsPageResult,
} from '@/shared/api/supabase/sessionQueries';
import { sessionQueryKeys } from '@/shared/constants/queryKeys';

import { s3UploadService } from '../services/s3UploadService';
import type {
  FileSessionConfig,
  MultiFileInfo,
  SessionCreateResult,
  SessionListItem,
} from '../types';

const SESSION_LIST_INVALIDATE_DELAY_MS = 2000;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

function queryKeyHasClientFilter(
  queryKey: readonly unknown[],
  clientId: string | null
) {
  if (queryKey.length === 4) return true;
  if (!clientId) return false;

  return (
    queryKey[4] === 'filter' &&
    typeof queryKey[5] === 'string' &&
    queryKey[5].split(',').includes(clientId)
  );
}

function shouldPrependToPaginatedQuery(
  queryKey: readonly unknown[],
  userId: number,
  clientId: string | null
) {
  if (queryKey[0] !== 'sessions' || queryKey[1] !== userId) return false;
  if (queryKey[2] !== 'paginated') return false;

  if (queryKey[3] === 'desc') {
    return queryKeyHasClientFilter(queryKey, clientId);
  }

  return (
    queryKey[3] === 'client' &&
    queryKey[5] === 'desc' &&
    queryKey[4] === clientId
  );
}

function shouldPrependToAllByClientQuery(
  queryKey: readonly unknown[],
  userId: number,
  clientId: string | null
) {
  return (
    !!clientId &&
    queryKey[0] === 'sessions' &&
    queryKey[1] === userId &&
    queryKey[2] === 'all-by-client' &&
    queryKey[3] === clientId &&
    queryKey[4] === 'desc'
  );
}

function prependToPaginatedData(
  data: InfiniteData<SessionsPageResult> | undefined,
  item: SessionListItem
) {
  if (!data) return data;
  if (
    data.pages.some((page) =>
      page.items.some(({ session }) => session.id === item.session.id)
    )
  ) {
    return data;
  }

  const [firstPage, ...restPages] = data.pages;
  if (!firstPage) {
    return {
      pages: [{ items: [item], nextCursor: null }],
      pageParams: [null],
    };
  }

  return {
    ...data,
    pages: [{ ...firstPage, items: [item, ...firstPage.items] }, ...restPages],
  };
}

function prependToSessionItems(
  items: SessionListItem[] | undefined,
  item: SessionListItem
) {
  if (!items) return items;
  if (items.some(({ session }) => session.id === item.session.id)) return items;

  return [item, ...items];
}

function createOptimisticSessionItem({
  sessionId,
  userId,
  title,
  s3Key,
  fileSizeMb,
  durationSeconds,
  clientId,
}: {
  sessionId: string;
  userId: number;
  title: string;
  s3Key: string;
  fileSizeMb: number;
  durationSeconds: number;
  clientId: string | null;
}): SessionListItem {
  return {
    session: {
      id: sessionId,
      user_id: userId,
      client_id: clientId,
      title: title.slice(0, 50),
      description: null,
      audio_meta_data: {
        s3_key: s3Key,
        file_size_mb: fileSizeMb,
        duration_seconds: durationSeconds,
      },
      audio_url: null,
      created_at: new Date().toISOString(),
      processing_status: 'pending',
      progress_percentage: 0,
      current_step: '안전한 AI에게 요청을 전달하고 있어요.',
    },
    transcribe: null,
    progressNotes: [],
  };
}

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

  const optimisticallyPrependSession = useCallback(
    (item: SessionListItem) => {
      queryClient.setQueriesData<InfiniteData<SessionsPageResult>>(
        {
          queryKey: sessionQueryKeys.all(userId),
          predicate: (query) =>
            shouldPrependToPaginatedQuery(
              query.queryKey,
              userId,
              item.session.client_id
            ),
        },
        (oldData) => prependToPaginatedData(oldData, item)
      );

      queryClient.setQueriesData<SessionListItem[]>(
        {
          queryKey: sessionQueryKeys.all(userId),
          predicate: (query) =>
            shouldPrependToAllByClientQuery(
              query.queryKey,
              userId,
              item.session.client_id
            ),
        },
        (oldItems) => prependToSessionItems(oldItems, item)
      );
    },
    [queryClient, userId]
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
          const durationSeconds =
            uploadResult.duration_seconds || file.duration || 0;
          const clientId = config.clientId || null;

          const response = await createSessionBackground({
            user_id: userId,
            title: file.name,
            s3_key: uploadResult.file_path,
            file_size_mb: uploadResult.file_size_mb,
            duration_seconds: durationSeconds,
            client_id: clientId,
            stt_model: sttModel,
            template_id: templateId,
          });

          optimisticallyPrependSession(
            createOptimisticSessionItem({
              sessionId: response.session_id,
              userId,
              title: file.name,
              s3Key: uploadResult.file_path,
              fileSizeMb: uploadResult.file_size_mb,
              durationSeconds,
              clientId,
            })
          );

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

      const invalidateSessionLists = () =>
        queryClient
          .invalidateQueries({
            queryKey: sessionQueryKeys.all(userId),
            refetchType: 'all',
          })
          .catch(() => {
            // Optimistic prepend가 이미 보이는 상태라 재검증 실패가 생성 결과를 막으면 안 된다.
          });

      if (finalResults.some((result) => result.status === 'success')) {
        void sleep(SESSION_LIST_INVALIDATE_DELAY_MS).then(
          invalidateSessionLists
        );
      } else {
        void invalidateSessionLists();
      }

      setIsCreating(false);

      return finalResults;
    },
    [
      userId,
      templateId,
      queryClient,
      updateResult,
      optimisticallyPrependSession,
      onInsufficientCredit,
    ]
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
