import { createElement, type ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CreditSummary } from '@/shared/api/server/creditServerApi';

import { canUseCredit, useCreditGuard } from './useCreditGuard';

const mocks = vi.hoisted(() => ({
  getCreditSummary: vi.fn(),
  userId: '42' as string | null,
}));

vi.mock('@/shared/api/server/creditServerApi', () => ({
  getCreditSummary: mocks.getCreditSummary,
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (
    selector: (state: { userId: string | null }) => string | null
  ) => selector({ userId: mocks.userId }),
}));

const summary: CreditSummary = {
  walletAvailableCredit: 30,
  heldCredit: 0,
  plan: {
    planId: null,
    subscriptionId: null,
    policyCode: 'LOCAL_QA_PLAN_7D',
    issuedCredit: 10,
    availableCredit: 10,
    heldCredit: 0,
    capturedCredit: 0,
    voidedCredit: 0,
    periodEndsAt: '2026-07-23T00:00:00.000Z',
  },
  promotional: {
    issuedCredit: 20,
    availableCredit: 20,
    heldCredit: 0,
    capturedCredit: 0,
    voidedCredit: 0,
    nearestExpiryAt: '2026-07-23T00:00:00.000Z',
  },
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

beforeEach(() => {
  mocks.getCreditSummary.mockReset();
  mocks.userId = '42';
});

describe('canUseCredit', () => {
  it('[CREDIT-WEB-06] PLAN과 PROMOTIONAL을 합친 서버 walletAvailableCredit만 판단 기준으로 쓴다', () => {
    expect(canUseCredit(summary, 25)).toBe(true);
    expect(canUseCredit(summary, 31)).toBe(false);
  });

  it('[CREDIT-WEB-08] 유효한 사용자 ID가 없으면 조회 없이 unavailable로 차단한다', async () => {
    mocks.userId = null;
    const { result } = renderHook(() => useCreditGuard(), {
      wrapper: createWrapper(),
    });

    await expect(result.current(10)).resolves.toEqual({
      ok: false,
      required: 10,
      remaining: 0,
      summary: null,
      unavailable: true,
    });
    expect(mocks.getCreditSummary).not.toHaveBeenCalled();
  });

  it('[CREDIT-WEB-09] 잔액 조회 실패는 command 서버 검증을 위해 unavailable 상태로 통과시킨다', async () => {
    mocks.getCreditSummary.mockRejectedValue(new Error('wallet unavailable'));
    const { result } = renderHook(() => useCreditGuard(), {
      wrapper: createWrapper(),
    });

    await expect(result.current(10)).resolves.toEqual({
      ok: true,
      required: 10,
      remaining: 0,
      summary: null,
      unavailable: true,
    });
  });
});
