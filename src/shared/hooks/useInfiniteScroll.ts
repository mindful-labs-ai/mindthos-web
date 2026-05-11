import { useEffect, useRef } from 'react';

/**
 * IntersectionObserver 기반 무한 스크롤 sentinel.
 *
 * 사용 패턴:
 *   const sentinelRef = useInfiniteScroll({
 *     hasNextPage,
 *     isFetchingNextPage,
 *     fetchNextPage,
 *   });
 *   return (
 *     <>
 *       {items.map(...)}
 *       <div ref={sentinelRef} />
 *     </>
 *   );
 *
 * sentinel 요소가 viewport에 진입(또는 rootMargin만큼 가까워지면) 자동으로 fetchNextPage 호출.
 */
export interface UseInfiniteScrollOptions {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => unknown;
  /** sentinel과의 거리 — 일찍 prefetch하려면 양수 (default 200px) */
  rootMargin?: string;
  /** disabled 시 observer 동작 안 함 (모달 등에서 일시 정지 등) */
  disabled?: boolean;
  /**
   * 스크롤 컨테이너 root. null이면 viewport 사용.
   * 내부 overflow-y-auto 컨테이너에 sentinel이 들어가는 경우 그 컨테이너 element를 전달.
   */
  root?: Element | null;
}

export function useInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  rootMargin = '200px',
  disabled = false,
  root = null,
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || disabled || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin, root }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, rootMargin, disabled, root]);

  return sentinelRef;
}
