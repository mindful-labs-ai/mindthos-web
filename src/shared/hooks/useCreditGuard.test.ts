import { describe, expect, it, vi } from 'vitest';

import type { CreditSummary } from '@/shared/api/server/creditServerApi';

import { canUseCredit } from './useCreditGuard';

vi.mock('@/shared/api/server/creditServerApi', () => ({
  getCreditSummary: vi.fn(),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
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

describe('canUseCredit', () => {
  it('PLAN과 PROMOTIONAL을 합친 서버 walletAvailableCredit만 판단 기준으로 쓴다.', () => {
    expect(canUseCredit(summary, 25)).toBe(true);
    expect(canUseCredit(summary, 31)).toBe(false);
  });
});
