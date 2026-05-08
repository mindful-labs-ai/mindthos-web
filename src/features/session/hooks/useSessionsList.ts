import { useEffect, useRef } from 'react';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import {
  getAllSessionsByClient,
  getSessionsPage,
  type SessionsPageResult,
} from '@/shared/api/supabase/sessionQueries';
import { sessionQueryKeys } from '@/shared/constants/queryKeys';

import type { Session, SessionListItem } from '../types';

export type SortOrder = 'desc' | 'asc';

const DEFAULT_LIMIT = 20;

/**
 * 처리 중인 세션 식별 — 폴링 활성화 조건
 */
function hasProcessingSession(items: SessionListItem[]): boolean {
  return items.some((item) => {
    const status = item.session.processing_status;
    return (
      status === 'pending' ||
      status === 'transcribing' ||
      status === 'generating_note'
    );
  });
}

export interface UseSessionsListOptions {
  userId: number;
  enabled?: boolean;
  sortOrder?: SortOrder;
  limit?: number;
  /**
   * 다중 클라이언트 필터 (세션 이력 사이드바). 비어있으면 전체.
   * 비어있지 않으면 서버에서 client_id IN (...) 필터 적용 + queryKey 분리 캐싱.
   */
  clientIds?: readonly string[];
  onSessionComplete?: (session: Session) => void;
  onSessionError?: (session: Session) => void;
}

/**
 * 사용자 전체 세션 무한 스크롤 (홈 / 세션 이력 페이지).
 *
 * - cursor-based pagination (created_at)
 * - 정렬/필터 변경 시 별도 캐시 (queryKey에 sortOrder + clientIds 포함)
 * - 처리 중 세션 있을 때만 8s 폴링 (status 전이 감지)
 * - status 전이 시 onSessionComplete/onSessionError 콜백
 */
export function useSessionsList({
  userId,
  enabled = true,
  sortOrder = 'desc',
  limit = DEFAULT_LIMIT,
  clientIds,
  onSessionComplete,
  onSessionError,
}: UseSessionsListOptions) {
  const prevStatusRef = useRef<Map<string, Session['processing_status']>>(
    new Map()
  );

  const query = useInfiniteQuery<SessionsPageResult, Error>({
    queryKey: sessionQueryKeys.paginated(userId, sortOrder, clientIds),
    queryFn: ({ pageParam }) =>
      getSessionsPage({
        userId,
        sortOrder,
        clientIds: clientIds ? [...clientIds] : undefined,
        cursor: (pageParam as string | null) ?? null,
        limit,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: (query) => {
      const allItems =
        query.state.data?.pages.flatMap((p) => p.items) ?? [];
      return hasProcessingSession(allItems) ? 8000 : false;
    },
    retry: 2,
  });

  // status 전이 감지 → 콜백
  useEffect(() => {
    const items = query.data?.pages.flatMap((p) => p.items) ?? [];
    if (items.length === 0) return;

    const prev = prevStatusRef.current;
    items.forEach(({ session }) => {
      const prevStatus = prev.get(session.id);
      const currentStatus = session.processing_status;

      if (prevStatus && prevStatus !== currentStatus) {
        const wasProcessing =
          prevStatus === 'pending' ||
          prevStatus === 'transcribing' ||
          prevStatus === 'generating_note';
        if (wasProcessing && currentStatus === 'succeeded') {
          onSessionComplete?.(session);
        }
        if (wasProcessing && currentStatus === 'failed') {
          onSessionError?.(session);
        }
      }
      prev.set(session.id, currentStatus);
    });
  }, [query.data, onSessionComplete, onSessionError]);

  const items: SessionListItem[] =
    query.data?.pages.flatMap((p) => p.items) ?? [];

  return {
    ...query,
    items,
  };
}

/**
 * 특정 클라이언트의 세션 무한 스크롤 (클라이언트 상세 탭).
 */
export function useClientSessions({
  userId,
  clientId,
  enabled = true,
  sortOrder = 'desc',
  limit = DEFAULT_LIMIT,
}: {
  userId: number;
  clientId: string;
  enabled?: boolean;
  sortOrder?: SortOrder;
  limit?: number;
}) {
  const query = useInfiniteQuery<SessionsPageResult, Error>({
    queryKey: sessionQueryKeys.paginatedByClient(userId, clientId, sortOrder),
    queryFn: ({ pageParam }) =>
      getSessionsPage({
        userId,
        clientId,
        sortOrder,
        cursor: (pageParam as string | null) ?? null,
        limit,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: enabled && !!userId && !!clientId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });

  const items: SessionListItem[] =
    query.data?.pages.flatMap((p) => p.items) ?? [];

  return {
    ...query,
    items,
  };
}

/**
 * 특정 클라이언트의 모든 세션 (limit 없음 — 다회기 분석용).
 *
 * userId를 받아 캐시 키를 사용자 단위로 분리. mutation 측에서
 * `sessionQueryKeys.all(userId)` invalidate 시 자동 propagate.
 */
export function useAllClientSessions({
  userId,
  clientId,
  enabled = true,
  sortOrder = 'desc',
}: {
  userId: number;
  clientId: string;
  enabled?: boolean;
  sortOrder?: SortOrder;
}) {
  return useQuery<SessionListItem[], Error>({
    queryKey: sessionQueryKeys.allByClient(userId, clientId, sortOrder),
    queryFn: () => getAllSessionsByClient(clientId, sortOrder),
    enabled: enabled && !!clientId && !!userId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });
}
