import { useInfiniteQuery } from '@tanstack/react-query';

import {
  getClientsPage,
  type ClientsPageItem,
  type ClientsPageResult,
} from '@/shared/api/supabase/clientQueries';
import { clientQueryKeys } from '@/shared/constants/queryKeys';

export type ClientSortOrder = 'desc' | 'asc';

const DEFAULT_LIMIT = 20;

export interface UseClientsListOptions {
  /** 검색 disable 시 null. 검색어 있으면 ILIKE 부분 일치 */
  search?: string | null;
  sortOrder?: ClientSortOrder;
  enabled?: boolean;
  limit?: number;
  /**
   * 캐시 키 분리용 식별자 — 일반적으로 counselor의 user.id 사용.
   * 사용자 전환 시 캐시 충돌 방지.
   */
  counselorId: number;
}

/**
 * 클라이언트 리스트 무한 스크롤 + 세션 수 집계.
 * `get_clients_with_session_count` RPC 호출.
 *
 * - cursor-based pagination (created_at)
 * - 검색/정렬 변경 시 별도 캐시 (queryKey에 search/sortOrder 포함)
 */
export function useClientsList({
  counselorId,
  search = null,
  sortOrder = 'desc',
  enabled = true,
  limit = DEFAULT_LIMIT,
}: UseClientsListOptions) {
  const query = useInfiniteQuery<ClientsPageResult, Error>({
    queryKey: clientQueryKeys.paginated(counselorId, search, sortOrder),
    queryFn: ({ pageParam }) =>
      getClientsPage({
        sortOrder,
        search,
        cursor: (pageParam as string | null) ?? null,
        limit,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: enabled && !!counselorId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });

  const items: ClientsPageItem[] =
    query.data?.pages.flatMap((p) => p.items) ?? [];

  return {
    ...query,
    items,
  };
}
