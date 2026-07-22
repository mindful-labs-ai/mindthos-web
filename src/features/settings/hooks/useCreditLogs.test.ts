import { beforeEach, describe, expect, it, vi } from 'vitest';

import { creditQueryKeys } from '@/shared/constants/queryKeys';

import { useCreditLogs } from './useCreditLogs';

const mocks = vi.hoisted(() => ({
  getCreditHistory: vi.fn(),
  useInfiniteQuery: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: mocks.useInfiniteQuery,
}));

vi.mock('@/shared/api/server/creditServerApi', () => ({
  getCreditHistory: mocks.getCreditHistory,
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: { userId: string }) => unknown) =>
    selector({ userId: '42' }),
}));

beforeEach(() => {
  mocks.getCreditHistory.mockReset();
  mocks.useInfiniteQuery.mockReset();
});

describe('useCreditLogs', () => {
  it('서버 nextCursor를 다음 페이지 요청에 그대로 전달한다.', async () => {
    useCreditLogs();

    const options = mocks.useInfiniteQuery.mock.calls[0][0];

    expect(options.queryKey).toEqual(creditQueryKeys.logs(42));
    expect(options.initialPageParam).toBeNull();
    expect(options.getNextPageParam({ nextCursor: 'next-cursor' })).toBe(
      'next-cursor'
    );
    expect(options.getNextPageParam({ nextCursor: null })).toBeUndefined();

    await options.queryFn({ pageParam: null });
    await options.queryFn({ pageParam: 'next-cursor' });

    expect(mocks.getCreditHistory).toHaveBeenNthCalledWith(1, 20, null);
    expect(mocks.getCreditHistory).toHaveBeenNthCalledWith(
      2,
      20,
      'next-cursor'
    );
  });
});
